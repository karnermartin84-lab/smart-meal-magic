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
import { useIsMobile } from "@/hooks/use-mobile";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

type ScannerStatus = "idle" | "starting" | "scanning" | "found" | "error";

function normalizeBarcode(raw: string) {
  return raw.trim();
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const isMobile = useIsMobile();

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);
  const scanLockRef = useRef(false);

  const formats = useMemo(
    () => [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.ITF,
    ],
    [],
  );

  const stopScanning = useCallback(async () => {
    scanLockRef.current = false;

    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // 2 = SCANNING (per html5-qrcode internal state)
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.log("Stop scanner error (safe to ignore):", err);
      }
      scannerRef.current = null;
    }

    if (mountedRef.current) {
      setStatus("idle");
    }
  }, []);

  const ensureCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API not available in this browser.");
    }

    // Request permission explicitly (important on iOS/Safari and for getting camera labels).
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
      },
    });

    stream.getTracks().forEach((t) => t.stop());
  }, []);

  const pickBestCameraId = useCallback(async () => {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras?.length) return null;

    const back = cameras.find((c) => /back|rear|environment/i.test(c.label));
    return (back ?? cameras[0]).id;
  }, []);

  const startScanning = useCallback(async () => {
    // Mobile-first requirement: if not mobile, show a clear message.
    if (!isMobile) {
      setStatus("error");
      setErrorMessage("Barcode scanning requires a mobile device.");
      return;
    }

    const element = document.getElementById("barcode-reader");
    if (!element) return; // dialog content not mounted yet

    await stopScanning();

    try {
      setStatus("starting");
      setErrorMessage(null);
      setScannedCode(null);

      await ensureCameraPermission();

      const cameraId = await pickBestCameraId();
      if (!cameraId) {
        throw new Error("No camera found on this device.");
      }

      const scanner = new Html5Qrcode("barcode-reader", {
        formatsToSupport: formats,
        // Prefer native BarcodeDetector when available (Chrome/Android, etc.)
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 12,
          // Barcode-friendly scan box (wide rectangle)
          qrbox: (viewW: number, viewH: number) => {
            const width = Math.min(360, Math.floor(viewW * 0.9));
            const height = Math.min(180, Math.floor(viewH * 0.35));
            return { width, height };
          },
          aspectRatio: 1.6,
        },
        (decodedText) => {
          if (scanLockRef.current) return;
          scanLockRef.current = true;

          const code = normalizeBarcode(decodedText);
          setScannedCode(code);
          setStatus("found");

          // Freeze camera feed while user confirms.
          try {
            scannerRef.current?.pause(true);
          } catch {
            // ignore
          }
        },
        () => {
          // ignore per-frame scan errors (no barcode found)
        },
      );

      if (mountedRef.current) {
        setStatus("scanning");
      }
    } catch (err: any) {
      console.error("Scanner error:", err);

      let message = "Failed to access camera";

      const raw = String(err?.message || "");
      if (err?.name === "NotAllowedError" || /permission/i.test(raw)) {
        message =
          "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err?.name === "NotFoundError" || /no camera|not found/i.test(raw)) {
        message = "No camera found on this device.";
      } else if (err?.name === "NotReadableError") {
        message = "Camera is in use by another application.";
      } else if (raw) {
        message = raw;
      }

      if (mountedRef.current) {
        setErrorMessage(message);
        setStatus("error");
      }

      await stopScanning();
    }
  }, [ensureCameraPermission, formats, isMobile, pickBestCameraId, stopScanning]);

  const handleClose = useCallback(() => {
    stopScanning();
    onClose();
  }, [onClose, stopScanning]);

  const handleConfirm = useCallback(() => {
    if (!scannedCode) return;
    const code = scannedCode;
    handleClose();
    onScan(code);
  }, [handleClose, onScan, scannedCode]);

  const handleScanAgain = useCallback(() => {
    scanLockRef.current = false;
    setScannedCode(null);
    setErrorMessage(null);

    try {
      scannerRef.current?.resume();
      setStatus("scanning");
    } catch {
      // If resume fails, restart.
      startScanning();
    }
  }, [startScanning]);

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
      stopScanning();
    };
  }, [stopScanning]);

  useEffect(() => {
    if (!open) {
      stopScanning();
      setErrorMessage(null);
      setScannedCode(null);
      return;
    }

    // Small delay to ensure dialog DOM is mounted.
    const timer = setTimeout(() => {
      startScanning();
    }, 250);

    return () => clearTimeout(timer);
  }, [open, startScanning, stopScanning]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a UPC/EAN barcode, then confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[220px]">
          {/* Desktop / non-mobile message (exact requirement) */}
          {!isMobile ? (
            <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
              <Smartphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Barcode scanning requires a mobile device.
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
                <Button variant="outline" onClick={handleScanAgain}>
                  Scan again
                </Button>
                <Button onClick={handleConfirm}>Use this code</Button>
              </div>
            </div>
          ) : (
            <>
              <div
                id="barcode-reader"
                className="rounded-lg overflow-hidden bg-muted aspect-video"
              />

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

        {isMobile && status === "scanning" && (
          <p className="text-sm text-muted-foreground text-center">
            Keep the barcode inside the box.
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
