import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ItemData {
  barcode: string | null;
  name: string;
  brand: string | null;
  quantity: number;
  unit: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  serving_size: string | null;
  image_url: string | null;
  expires_at: string | null;
}

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: ItemData) => Promise<void>;
  initialData?: Partial<ItemData>;
  loading?: boolean;
}

const defaultItem: ItemData = {
  barcode: null,
  name: '',
  brand: null,
  quantity: 1,
  unit: 'serving',
  calories_per_serving: 0,
  protein_per_serving: 0,
  carbs_per_serving: 0,
  fat_per_serving: 0,
  serving_size: '100g',
  image_url: null,
  expires_at: null
};

export function AddItemDialog({ open, onClose, onAdd, initialData, loading }: AddItemDialogProps) {
  const [item, setItem] = useState<ItemData>({ ...defaultItem, ...initialData });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setItem({ ...defaultItem, ...initialData });
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.name.trim()) return;

    setSubmitting(true);
    try {
      await onAdd(item);
      onClose();
      setItem(defaultItem);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof ItemData, value: string | number) => {
    setItem(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {initialData?.name ? 'Confirm Item' : 'Add Item Manually'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Looking up product...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Food Name *</Label>
                <Input
                  id="name"
                  value={item.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Chicken Breast"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand (optional)</Label>
                <Input
                  id="brand"
                  value={item.brand || ''}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="e.g., Tyson"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serving_size">Serving Size</Label>
                  <Input
                    id="serving_size"
                    value={item.serving_size || ''}
                    onChange={(e) => handleChange('serving_size', e.target.value)}
                    placeholder="100g"
                  />
                </div>
              </div>

              <p className="text-sm font-medium text-muted-foreground mt-2">
                Nutrition per serving ({item.serving_size || '100g'}):
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    min="0"
                    value={item.calories_per_serving}
                    onChange={(e) => handleChange('calories_per_serving', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.protein_per_serving}
                    onChange={(e) => handleChange('protein_per_serving', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.carbs_per_serving}
                    onChange={(e) => handleChange('carbs_per_serving', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.fat_per_serving}
                    onChange={(e) => handleChange('fat_per_serving', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !item.name.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add to Fridge
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
