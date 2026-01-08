import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Loader2, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

type ScannerStatus = "idle" | "starting" | "scanning" | "found" | "error";

function normalizeBarcode(raw: string) {
  return raw.trim();
}

function pickBestCameraId(
  cameras: Array<{ id: string; label: string }>,
): string {
  const back = cameras.find((c) => /back|rear|environment/i.test(c.label));
  return (back ?? cameras[0]).id;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);
  const scanLockRef = useRef(false);

  const formats = useMemo(
    () => [
      // UPC/EAN
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
      // Common on some packaging
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.CODE_128,
    ],
    [],
  );

  const stopScannerInstance = useCallback(async () => {
    scanLockRef.current = false;

    if (!scannerRef.current) return;

    try {
      const state = scannerRef.current.getState();
      // 2 = SCANNING (html5-qrcode internal enum)
      if (state === 2) {
        await scannerRef.current.stop();
      }
      scannerRef.current.clear();
    } catch (err) {
      console.log("Stop scanner error (safe to ignore):", err);
    } finally {
      scannerRef.current = null;
    }
  }, []);

  const resetUi = useCallback(async () => {
    await stopScannerInstance();
    if (!mountedRef.current) return;
    setStatus("idle");
    setErrorMessage(null);
    setScannedCode(null);
  }, [stopScannerInstance]);

  const ensureCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API not available in this browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" } },
    });

    stream.getTracks().forEach((t) => t.stop());
  }, []);

  const startScanning = useCallback(async () => {
    const element = document.getElementById("barcode-reader");
    if (!element) return; // dialog content not mounted yet

    await stopScannerInstance();

    try {
      setStatus("starting");
      setErrorMessage(null);
      setScannedCode(null);

      // Request permission up-front to make camera access more reliable across browsers.
      await ensureCameraPermission();

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras?.length) {
        setHasCamera(false);
        throw new Error("No camera found.");
      }
      setHasCamera(true);

      const cameraId = pickBestCameraId(cameras);

      const scanner = new Html5Qrcode("barcode-reader", {
        formatsToSupport: formats,
        // Prefer native BarcodeDetector (Chrome/Android, etc.) for better barcode reads.
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 12,
          // Wide scan window works better for barcodes than a square.
          qrbox: (viewW: number, viewH: number) => {
            const width = Math.min(420, Math.floor(viewW * 0.9));
            const height = Math.min(180, Math.floor(viewH * 0.35));
            return { width, height };
          },
          aspectRatio: 1.6,
          // Nudge browser toward the back camera when the UA uses constraints.
          videoConstraints: {
            facingMode: { ideal: "environment" },
          },
        },
        async (decodedText) => {
          if (scanLockRef.current) return;
          scanLockRef.current = true;

          const code = normalizeBarcode(decodedText);
          setScannedCode(code);
          setStatus("found");

          // Stop camera immediately after detection (privacy + prevents repeat triggers).
          await stopScannerInstance();
        },
        () => {
          // ignore per-frame errors
        },
      );

      if (mountedRef.current) {
        setStatus("scanning");
      }
    } catch (err: any) {
      console.error("Scanner error:", err);

      let message = "Failed to access camera";
      const raw = String(err?.message || "");

      if (err?.name === "NotAllowedError" || /permission|denied/i.test(raw)) {
        message =
          "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err?.name === "NotFoundError" || /no camera|not found/i.test(raw)) {
        message = "No camera found.";
      } else if (err?.name === "NotReadableError") {
        message = "Camera is in use by another application.";
      } else if (/user gesture|not allowed by the user agent/i.test(raw)) {
        message = "Tap “Try Again” to start the camera.";
      } else if (raw) {
        message = raw;
      }

      if (mountedRef.current) {
        setErrorMessage(message);
        setStatus("error");
      }

      await stopScannerInstance();
    }
  }, [ensureCameraPermission, formats, stopScannerInstance]);

  const handleClose = useCallback(() => {
    resetUi();
    onClose();
  }, [onClose, resetUi]);

  const handleConfirm = useCallback(() => {
    if (!scannedCode) return;
    const code = scannedCode;
    handleClose();
    onScan(code);
  }, [handleClose, onScan, scannedCode]);

  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setScannedCode(null);
    scanLockRef.current = false;
    startScanning();
  }, [startScanning]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopScannerInstance();
    };
  }, [stopScannerInstance]);

  // Detect camera presence (helps show a clear message on desktop without webcams).
  useEffect(() => {
    if (!open) return;

    const check = async () => {
      try {
        const devices = await navigator.mediaDevices?.enumerateDevices?.();
        const videoDevices = (devices || []).filter((d) => d.kind === "videoinput");
        setHasCamera(videoDevices.length > 0);
      } catch {
        setHasCamera(null);
      }
    };

    check();
  }, [open]);

  // Auto-start on open (and keep a Retry button if a browser requires an additional gesture).
  useEffect(() => {
    if (!open) {
      resetUi();
      return;
    }

    const timer = window.setTimeout(() => {
      startScanning();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, resetUi, startScanning]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Scan a UPC/EAN barcode, then confirm to look it up.
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[240px]">
          {hasCamera === false ? (
            <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
              <Smartphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No camera detected. Barcode scanning requires a device with a camera.
              </p>
            </div>
          ) : status === "error" && errorMessage ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-destructive text-sm mb-3">{errorMessage}</p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          ) : status === "found" && scannedCode ? (
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Scanned code</p>
              <p className="font-mono text-foreground break-all">{scannedCode}</p>

              <div className="mt-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={handleRetry}>
                  Scan again
                </Button>
                <Button onClick={handleConfirm}>Use this code</Button>
              </div>
            </div>
          ) : (
            <>
              <div
                id="barcode-reader"
                className="relative rounded-lg overflow-hidden bg-muted aspect-video"
              />

              {/* Visible scan zone overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-[85%] max-w-[420px] aspect-[3/1] rounded-md border-2 border-primary/70 ring-1 ring-ring/20" />
              </div>

              {(status === "idle" || status === "starting") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {status === "starting" ? "Starting camera..." : "Initializing..."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {status === "scanning" && (
          <p className="text-sm text-muted-foreground text-center">
            Hold the barcode inside the box.
          </p>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
