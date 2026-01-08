import { useCallback, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useZxingBarcodeScanner } from "@/hooks/useZxingBarcodeScanner";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export function BarcodeScanner({ open, onClose, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  const handleDetected = useCallback(
    (barcode: string) => {
      // Close the scanner immediately (camera stops in the hook) and pass the code up.
      onClose();
      onDetected(barcode);
    },
    [onClose, onDetected],
  );

  const { status, error, start } = useZxingBarcodeScanner({
    active: open,
    videoRef,
    regionRef,
    onDetected: handleDetected,
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Keep the barcode inside the box — detection runs continuously.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full rounded-lg overflow-hidden bg-muted aspect-video">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain"
            playsInline
            muted
            autoPlay
          />

          {/* Functional scan zone (used to crop frames for decoding) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              ref={regionRef}
              className="w-[85%] max-w-[420px] aspect-[3/1] rounded-md border-2 border-primary/70 ring-1 ring-ring/20"
            />
          </div>

          {(status === "idle" || status === "starting") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Starting camera…</p>
            </div>
          )}

          {status === "error" && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 px-4 text-center">
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={start}>
                Try Again
              </Button>
            </div>
          )}
        </div>

        {status === "scanning" && (
          <p className="text-sm text-muted-foreground text-center">
            Hold steady — scanning inside the box.
          </p>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
