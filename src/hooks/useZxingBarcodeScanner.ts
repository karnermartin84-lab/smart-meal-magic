import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

export type ZxingScannerStatus = "idle" | "starting" | "scanning" | "error";

function normalizeBarcode(raw: string) {
  return raw.replace(/\s+/g, "").trim();
}

function isUpcEan(raw: string) {
  // UPC/EAN are numeric, usually 8/12/13 digits (+ some edge cases like 14)
  return /^\d{8,14}$/.test(raw);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getVideoContentRect(videoEl: HTMLVideoElement) {
  const rect = videoEl.getBoundingClientRect();
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;

  if (!vw || !vh) return null;

  // We intentionally render the preview using object-contain (see BarcodeScanner.tsx)
  // so the math below maps DOM pixels to the real video frame reliably.
  const scale = Math.min(rect.width / vw, rect.height / vh);
  const renderedW = vw * scale;
  const renderedH = vh * scale;

  const offsetX = (rect.width - renderedW) / 2;
  const offsetY = (rect.height - renderedH) / 2;

  return {
    left: rect.left + offsetX,
    top: rect.top + offsetY,
    width: renderedW,
    height: renderedH,
    vw,
    vh,
  };
}

function computeCropFromRegion(
  videoEl: HTMLVideoElement,
  regionEl: HTMLElement,
): { sx: number; sy: number; sw: number; sh: number } | null {
  const contentRect = getVideoContentRect(videoEl);
  if (!contentRect) return null;

  const regionRect = regionEl.getBoundingClientRect();

  // Convert region coords to coords inside the rendered video content box.
  const rx = regionRect.left - contentRect.left;
  const ry = regionRect.top - contentRect.top;
  const rw = regionRect.width;
  const rh = regionRect.height;

  // If the scan box is outside the rendered video area (letterboxing), don't scan.
  if (
    rx + rw <= 0 ||
    ry + rh <= 0 ||
    rx >= contentRect.width ||
    ry >= contentRect.height
  ) {
    return null;
  }

  const leftPct = clamp(rx / contentRect.width, 0, 1);
  const topPct = clamp(ry / contentRect.height, 0, 1);
  const widthPct = clamp(rw / contentRect.width, 0, 1);
  const heightPct = clamp(rh / contentRect.height, 0, 1);

  const sx = Math.floor(leftPct * contentRect.vw);
  const sy = Math.floor(topPct * contentRect.vh);
  const sw = Math.floor(widthPct * contentRect.vw);
  const sh = Math.floor(heightPct * contentRect.vh);

  if (sw < 40 || sh < 40) return null;

  return { sx, sy, sw, sh };
}

export function useZxingBarcodeScanner(params: {
  active: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  regionRef: React.RefObject<HTMLElement>;
  onDetected: (barcode: string) => void;
}) {
  const { active, videoRef, regionRef, onDetected } = params;

  const [status, setStatus] = useState<ZxingScannerStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanAtRef = useRef(0);
  const lockRef = useRef(false);
  const activeRef = useRef(active);
  const startSeqRef = useRef(0);

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stop = useCallback(() => {
    lockRef.current = false;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [videoRef]);

  const start = useCallback(async () => {
    // New "session" for this start attempt (prevents races if user taps Try Again quickly)
    startSeqRef.current += 1;
    const seq = startSeqRef.current;

    lockRef.current = false;
    lastScanAtRef.current = 0;

    stop();

    setStatus("starting");
    setError(null);

    // Wait for video element to be available in DOM (Dialog animation)
    const waitForVideo = async (maxWait = 1000): Promise<HTMLVideoElement | null> => {
      const startTime = Date.now();
      while (Date.now() - startTime < maxWait) {
        const video = videoRef.current;
        if (video && video.isConnected) {
          return video;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      return null;
    };

    const video = await waitForVideo();
    if (!video) {
      setStatus("error");
      setError("Scanner not ready. Please try again.");
      return;
    }

    // Check if this start attempt is still current
    if (seq !== startSeqRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("Camera API not available in this browser.");
      return;
    }

    const waitForVideoReady = (timeoutMs: number) =>
      new Promise<void>((resolve, reject) => {
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
          resolve();
          return;
        }

        const done = () => {
          cleanup();
          resolve();
        };

        const cleanup = () => {
          video.removeEventListener("loadedmetadata", done);
          video.removeEventListener("loadeddata", done);
          window.clearTimeout(timer);
        };

        const timer = window.setTimeout(() => {
          cleanup();
          reject(new Error("Camera did not start. Tap Try Again."));
        }, timeoutMs);

        video.addEventListener("loadedmetadata", done);
        video.addEventListener("loadeddata", done);
      });

    const tryPlay = async () => {
      // iOS Safari can be picky; do a couple attempts without hanging.
      for (let i = 0; i < 3; i += 1) {
        try {
          await video.play();
          return true;
        } catch {
          await new Promise((r) => setTimeout(r, 150));
        }
      }
      return false;
    };

    const getStreamWithFallback = async () => {
      // IMPORTANT: iOS Safari is sensitive to constraints.
      // - No facingMode: { exact: "environment" }
      // - Avoid forcing resolutions/frame rates
      const candidates: MediaStreamConstraints[] = [
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        { audio: false, video: { facingMode: { ideal: "user" } } },
        { audio: false, video: true },
      ];

      let lastErr: unknown = null;
      for (const c of candidates) {
        try {
          return await navigator.mediaDevices.getUserMedia(c);
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr ?? new Error("Failed to access camera.");
    };

    try {
      // Hints to focus on UPC/EAN for reliability.
      if (!readerRef.current) {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ]);
        readerRef.current = new BrowserMultiFormatReader(hints);
      }

      const stream = await getStreamWithFallback();
      if (seq !== startSeqRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      // Ensure iOS-friendly attributes are set before play
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      video.autoplay = true;
      video.srcObject = stream;

      await waitForVideoReady(2000);

      const played = await tryPlay();
      if (!played) {
        throw new Error("Could not start camera preview. Tap Try Again.");
      }

      if (seq !== startSeqRef.current) return;

      setStatus("scanning");

      const tick = (ts: number) => {
        if (!activeRef.current) {
          stop();
          return;
        }
        if (lockRef.current) return;

        if (ts - lastScanAtRef.current < 140) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        lastScanAtRef.current = ts;

        const regionEl = regionRef.current;
        const reader = readerRef.current;

        if (!regionEl || !reader || !video.videoWidth || !video.videoHeight) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const crop = computeCropFromRegion(video, regionEl);
        if (!crop) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const canvas =
          canvasRef.current ?? (canvasRef.current = document.createElement("canvas"));

        // Downscale the crop for speed while keeping enough detail for UPC/EAN.
        const maxW = 800;
        const scale = Math.min(1, maxW / crop.sw);
        canvas.width = Math.max(40, Math.floor(crop.sw * scale));
        canvas.height = Math.max(40, Math.floor(crop.sh * scale));

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        try {
          ctx.drawImage(
            video,
            crop.sx,
            crop.sy,
            crop.sw,
            crop.sh,
            0,
            0,
            canvas.width,
            canvas.height,
          );

          const result = reader.decodeFromCanvas(canvas);
          const raw = normalizeBarcode(result.getText());

          if (!isUpcEan(raw)) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          lockRef.current = true;
          stop();
          onDetected(raw);
          return;
        } catch (e: any) {
          const name = e?.name || e?.constructor?.name;
          // NotFoundException is expected for most frames; keep the loop running.
          if (name !== "NotFoundException") {
            // Ignore other per-frame errors to avoid breaking scanning.
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      stop();

      const raw = String(err?.message || "");
      let message = "Failed to access camera.";

      if (err?.name === "NotAllowedError" || /permission|denied/i.test(raw)) {
        message =
          "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err?.name === "NotFoundError" || /no camera|not found/i.test(raw)) {
        message = "No camera found. Connect a webcam or use a phone camera.";
      } else if (err?.name === "NotReadableError") {
        message = "Camera is in use by another application.";
      } else if (raw) {
        message = raw;
      }

      setStatus("error");
      setError(message);
    }
  }, [onDetected, regionRef, stop, videoRef]);

  // Keep activeRef in sync so the scanning loop can check it.
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!active) {
      stop();
      setStatus("idle");
      setError(null);
      return;
    }

    start();

    return () => {
      stop();
    };
  }, [active, start, stop]);

  return { status, error, start, stop };
}
