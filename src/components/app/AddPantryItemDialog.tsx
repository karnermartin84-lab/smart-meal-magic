import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { PANTRY_CATEGORIES } from '@/hooks/usePantryItems';

interface AddPantryItemDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: any) => Promise<any>;
  initialData?: Partial<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    calories_per_serving: number;
    protein_per_serving: number;
    carbs_per_serving: number;
    fat_per_serving: number;
    serving_size: string;
    brand: string | null;
    notes: string | null;
  }>;
  loading?: boolean;
}

export function AddPantryItemDialog({ open, onClose, onAdd, initialData, loading }: AddPantryItemDialogProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('unit');
  const [category, setCategory] = useState('other');
  const [calories, setCalories] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');
  const [servingSize, setServingSize] = useState('100g');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setQuantity(String(initialData.quantity ?? 1));
      setUnit(initialData.unit || 'unit');
      setCategory(initialData.category || 'other');
      setCalories(String(initialData.calories_per_serving ?? 0));
      setProtein(String(initialData.protein_per_serving ?? 0));
      setCarbs(String(initialData.carbs_per_serving ?? 0));
      setFat(String(initialData.fat_per_serving ?? 0));
      setServingSize(initialData.serving_size || '100g');
      setNotes(initialData.notes || '');
    } else {
      resetForm();
    }
  }, [initialData, open]);

  const resetForm = () => {
    setName('');
    setQuantity('1');
    setUnit('unit');
    setCategory('other');
    setCalories('0');
    setProtein('0');
    setCarbs('0');
    setFat('0');
    setServingSize('100g');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    await onAdd({
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit,
      category,
      calories_per_serving: parseFloat(calories) || 0,
      protein_per_serving: parseFloat(protein) || 0,
      carbs_per_serving: parseFloat(carbs) || 0,
      fat_per_serving: parseFloat(fat) || 0,
      serving_size: servingSize,
      notes: notes.trim() || null,
    });
    setSaving(false);
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Pantry Item</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., All-Purpose Flour"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PANTRY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">unit</SelectItem>
                    <SelectItem value="g">grams</SelectItem>
                    <SelectItem value="kg">kilograms</SelectItem>
                    <SelectItem value="oz">ounces</SelectItem>
                    <SelectItem value="lb">pounds</SelectItem>
                    <SelectItem value="ml">milliliters</SelectItem>
                    <SelectItem value="L">liters</SelectItem>
                    <SelectItem value="cup">cups</SelectItem>
                    <SelectItem value="tbsp">tablespoons</SelectItem>
                    <SelectItem value="tsp">teaspoons</SelectItem>
                    <SelectItem value="bottle">bottles</SelectItem>
                    <SelectItem value="jar">jars</SelectItem>
                    <SelectItem value="bag">bags</SelectItem>
                    <SelectItem value="box">boxes</SelectItem>
                    <SelectItem value="can">cans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nutrition per Serving</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Calories</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Protein (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Carbs (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fat (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servingSize">Serving Size</Label>
              <Input
                id="servingSize"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="e.g., 100g, 1 cup"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Item
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
