import { useState, useRef } from 'react';
import { Receipt, Camera, Upload, Loader2, Check, X, ShoppingBasket, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  suggestedDestination: 'fridge' | 'pantry';
  selected: boolean;
  destination: 'fridge' | 'pantry';
}

interface ReceiptScannerProps {
  open: boolean;
  onClose: () => void;
  onAddToFridge: (items: Array<{ name: string; quantity: number; unit: string }>) => Promise<void>;
  onAddToPantry: (items: Array<{ name: string; quantity: number; unit: string; category: string }>) => Promise<void>;
}

export function ReceiptScanner({ open, onClose, onAddToFridge, onAddToPantry }: ReceiptScannerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [total, setTotal] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  const resetState = () => {
    setScanning(false);
    setSaving(false);
    setImagePreview(null);
    setScannedItems([]);
    setStoreName(null);
    setTotal(null);
    setStep('upload');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      await scanReceipt(base64);
    };
    reader.readAsDataURL(file);
  };

  const scanReceipt = async (imageBase64: string) => {
    setScanning(true);

    try {
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { imageBase64 },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Scan failed',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      if (!data.items || data.items.length === 0) {
        toast({
          title: 'No items found',
          description: 'Could not detect any food items. Try a clearer photo.',
          variant: 'destructive',
        });
        return;
      }

      setScannedItems(
        data.items.map((item: any) => ({
          ...item,
          selected: true,
          destination: item.suggestedDestination || 'fridge',
        }))
      );
      setStoreName(data.storeName);
      setTotal(data.total);
      setStep('review');

      toast({
        title: 'Receipt scanned!',
        description: `Found ${data.items.length} items`,
      });
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: 'Scan failed',
        description: 'Failed to scan receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const toggleItem = (index: number) => {
    setScannedItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItemDestination = (index: number, destination: 'fridge' | 'pantry') => {
    setScannedItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, destination } : item))
    );
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setScannedItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item))
    );
  };

  const handleConfirm = async () => {
    const selectedItems = scannedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to add',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const fridgeItems = selectedItems
        .filter(item => item.destination === 'fridge')
        .map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit }));

      const pantryItems = selectedItems
        .filter(item => item.destination === 'pantry')
        .map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit, category: item.category }));

      if (fridgeItems.length > 0) {
        await onAddToFridge(fridgeItems);
      }

      if (pantryItems.length > 0) {
        await onAddToPantry(pantryItems);
      }

      toast({
        title: 'Items added!',
        description: `Added ${fridgeItems.length} to fridge, ${pantryItems.length} to pantry`,
      });

      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Failed to add items',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = scannedItems.filter(item => item.selected).length;
  const fridgeCount = scannedItems.filter(item => item.selected && item.destination === 'fridge').length;
  const pantryCount = scannedItems.filter(item => item.selected && item.destination === 'pantry').length;

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Scan Receipt
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            {scanning ? (
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="font-medium">Scanning receipt...</p>
                <p className="text-sm text-muted-foreground">This may take a few seconds</p>
              </div>
            ) : (
              <>
                {imagePreview ? (
                  <div className="relative w-full max-w-xs">
                    <img
                      src={imagePreview}
                      alt="Receipt preview"
                      className="rounded-lg border shadow-sm w-full"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80"
                      onClick={() => setImagePreview(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-xs aspect-[3/4] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="font-medium text-center">Upload receipt photo</p>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      Tap to take a photo or choose from gallery
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Photo
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'review' && (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>
                {storeName && <span className="font-medium">{storeName}</span>}
                {total && <span className="ml-2">• Total: {total}</span>}
              </span>
              <span>{selectedCount} of {scannedItems.length} selected</span>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2">
                {scannedItems.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      item.selected ? 'bg-card' : 'bg-muted/30 opacity-60'
                    )}
                  >
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => toggleItem(index)}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 1)}
                          className="w-16 h-7 text-xs"
                          disabled={!item.selected}
                        />
                        <span className="text-xs text-muted-foreground">{item.unit}</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                    </div>

                    <Select
                      value={item.destination}
                      onValueChange={(value) => updateItemDestination(index, value as 'fridge' | 'pantry')}
                      disabled={!item.selected}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fridge">
                          <span className="flex items-center gap-1">
                            <ShoppingBasket className="w-3 h-3" /> Fridge
                          </span>
                        </SelectItem>
                        <SelectItem value="pantry">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" /> Pantry
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Scan Another
              </Button>
              <Button onClick={handleConfirm} disabled={selectedCount === 0 || saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Add {selectedCount} Items
                {fridgeCount > 0 && pantryCount > 0 && (
                  <span className="ml-1 text-xs opacity-70">
                    ({fridgeCount} fridge, {pantryCount} pantry)
                  </span>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
