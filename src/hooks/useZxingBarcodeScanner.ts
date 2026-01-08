import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from "@zxing/library";

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
      // @ts-expect-error - TS doesn't know about srcObject on HTMLMediaElement in some libs.
      video.srcObject = null;
    }

    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [videoRef]);

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    stop();

    setStatus("starting");
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("Camera API not available in this browser.");
      return;
    }

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

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (err: any) {
        // Desktop webcams / some browsers can choke on facingMode.
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      streamRef.current = stream;
      // @ts-expect-error - TS doesn't know about srcObject on HTMLMediaElement in some libs.
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;

      const played = await video.play().then(
        () => true,
        () => false,
      );

      if (!played) {
        throw new Error("Could not start camera preview. Tap Try Again.");
      }

      setStatus("scanning");

      const tick = () => {
        if (!active) return;
        if (lockRef.current) return;

        const now = performance.now();
        if (now - lastScanAtRef.current < 140) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        lastScanAtRef.current = now;

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
        canvas.width = crop.sw;
        canvas.height = crop.sh;

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

          // Only accept UPC/EAN here (per requirements).
          if (!isUpcEan(raw)) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          lockRef.current = true;
          stop();
          onDetected(raw);
          return;
        } catch (e: any) {
          if (e instanceof NotFoundException) {
            // nothing found in this frame
          }
          // Ignore other per-frame errors to keep scanning robust.
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
  }, [active, onDetected, regionRef, stop, videoRef]);

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
