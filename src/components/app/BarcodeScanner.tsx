import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);

  // Check for camera availability
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasCamera(videoDevices.length > 0);
      } catch {
        setHasCamera(false);
      }
    };
    checkCamera();
  }, []);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.log('Stop scanner error (safe to ignore):', err);
      }
      scannerRef.current = null;
    }
    setStatus('idle');
  }, []);

  const startScanning = useCallback(async () => {
    // Wait for DOM element to be ready
    const element = document.getElementById('barcode-reader');
    if (!element) {
      console.log('Waiting for DOM element...');
      return;
    }

    // Clean up any existing scanner
    await stopScanning();

    try {
      setStatus('starting');
      setErrorMessage(null);

      const scanner = new Html5Qrcode('barcode-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 120 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          console.log('Barcode scanned:', decodedText);
          onScan(decodedText);
          stopScanning();
          onClose();
        },
        () => {
          // Ignore scan errors (no barcode found in frame)
        }
      );

      if (mountedRef.current) {
        setStatus('scanning');
      }
    } catch (err: any) {
      console.error('Scanner error:', err);
      
      let message = 'Failed to access camera';
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        message = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.message?.includes('not found')) {
        message = 'No camera found. Barcode scanning requires a device with a camera.';
      } else if (err.name === 'NotReadableError') {
        message = 'Camera is in use by another application.';
      } else if (err.message) {
        message = err.message;
      }
      
      if (mountedRef.current) {
        setErrorMessage(message);
        setStatus('error');
      }
    }
  }, [onScan, onClose, stopScanning]);

  // Handle dialog open/close
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      stopScanning();
    };
  }, [stopScanning]);

  // Start scanning when dialog opens and element is ready
  useEffect(() => {
    if (open && hasCamera) {
      // Small delay to ensure dialog content is rendered
      const timer = setTimeout(() => {
        startScanning();
      }, 300);
      return () => clearTimeout(timer);
    } else if (!open) {
      stopScanning();
    }
  }, [open, hasCamera, startScanning, stopScanning]);

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  const handleRetry = () => {
    setErrorMessage(null);
    startScanning();
  };

  // No camera available (likely desktop)
  if (hasCamera === false) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Barcode Scanner
            </DialogTitle>
            <DialogDescription>
              Scan product barcodes to quickly add items
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-2">Camera Required</h3>
            <p className="text-sm text-muted-foreground">
              Barcode scanning requires a mobile device with a camera. 
              Please use the search feature or add items manually.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a product barcode
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[200px]">
          {status === 'error' && errorMessage ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-destructive text-sm mb-3">{errorMessage}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div 
                id="barcode-reader" 
                className="rounded-lg overflow-hidden bg-muted aspect-video"
              />
              {(status === 'idle' || status === 'starting') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {status === 'starting' ? 'Starting camera...' : 'Initializing...'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {status === 'scanning' && (
          <p className="text-sm text-muted-foreground text-center">
            Position the barcode within the frame to scan
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
