import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FoodSuggestion {
  name: string;
  confidence: number;
  quantity: number;
  unit: string;
}

interface FridgePhotoScannerProps {
  open: boolean;
  onClose: () => void;
  onSuggestionsReceived: (suggestions: FoodSuggestion[], notes: string | null) => void;
}

export function FridgePhotoScanner({ open, onClose, onSuggestionsReceived }: FridgePhotoScannerProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      
      // Convert to base64
      const base64 = await fileToBase64(file);
      newImages.push(base64);
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
    }
    
    // Reset input
    e.target.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeImages = async () => {
    if (images.length === 0) {
      toast({
        title: 'No images',
        description: 'Please take or upload at least one photo',
        variant: 'destructive'
      });
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-fridge-photo', {
        body: { images }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Analysis failed',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      const suggestions = data.suggestions || [];
      if (suggestions.length === 0) {
        toast({
          title: 'No items found',
          description: data.notes || 'Could not identify any food items. Try a clearer photo.',
          variant: 'destructive'
        });
        return;
      }

      onSuggestionsReceived(suggestions, data.notes);
      setImages([]);
      onClose();
    } catch (error: any) {
      console.error('Error analyzing images:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze images',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClose = () => {
    if (!analyzing) {
      setImages([]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Your Fridge</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Take photos of your fridge and we'll identify the food items for you.
          </p>

          {/* Image preview grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={img} alt={`Fridge photo ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                    disabled={analyzing}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg border-muted-foreground/25">
              <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No photos yet</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Camera button - hidden input for mobile camera */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={analyzing || images.length >= 5}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing || images.length >= 5}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>

          {images.length >= 5 && (
            <p className="text-xs text-muted-foreground text-center">Maximum 5 photos</p>
          )}

          {/* Analyze button */}
          <Button
            onClick={analyzeImages}
            disabled={analyzing || images.length === 0}
            className="w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              `Analyze ${images.length} Photo${images.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
