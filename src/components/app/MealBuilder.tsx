import { useState, useMemo } from 'react';
import { X, Plus, Minus, ChefHat, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FridgeItem } from '@/hooks/useFridgeItems';
import { FridgeItemCard } from './FridgeItemCard';

interface SelectedItem {
  fridgeItem: FridgeItem;
  quantity: number;
}

interface MealBuilderProps {
  open: boolean;
  onClose: () => void;
  fridgeItems: FridgeItem[];
  onCreateMeal: (meal: {
    name: string;
    description: string;
    meal_type: string;
    servings: number;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    is_favorite: boolean;
  }, items: {
    fridge_item_id: string | null;
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[]) => Promise<unknown>;
}

export function MealBuilder({ open, onClose, fridgeItems, onCreateMeal }: MealBuilderProps) {
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [mealName, setMealName] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [servings, setServings] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    return selectedItems.reduce(
      (acc, { fridgeItem, quantity }) => ({
        calories: acc.calories + fridgeItem.calories_per_serving * quantity,
        protein: acc.protein + fridgeItem.protein_per_serving * quantity,
        carbs: acc.carbs + fridgeItem.carbs_per_serving * quantity,
        fat: acc.fat + fridgeItem.fat_per_serving * quantity
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedItems]);

  const handleSelectItem = (item: FridgeItem) => {
    const existing = selectedItems.find(s => s.fridgeItem.id === item.id);
    if (existing) {
      setSelectedItems(prev => prev.filter(s => s.fridgeItem.id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, { fridgeItem: item, quantity: 1 }]);
    }
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    setSelectedItems(prev =>
      prev.map(s =>
        s.fridgeItem.id === itemId
          ? { ...s, quantity: Math.max(0.1, s.quantity + delta) }
          : s
      )
    );
  };

  const handleSubmit = async () => {
    if (!mealName.trim() || selectedItems.length === 0) return;

    setSubmitting(true);
    try {
      const mealData = {
        name: mealName,
        description: mealDescription,
        meal_type: mealType,
        servings,
        total_calories: totals.calories,
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fat: totals.fat,
        is_favorite: false
      };

      const items = selectedItems.map(({ fridgeItem, quantity }) => ({
        fridge_item_id: fridgeItem.id,
        name: fridgeItem.name,
        quantity,
        unit: fridgeItem.unit,
        calories: fridgeItem.calories_per_serving * quantity,
        protein: fridgeItem.protein_per_serving * quantity,
        carbs: fridgeItem.carbs_per_serving * quantity,
        fat: fridgeItem.fat_per_serving * quantity
      }));

      await onCreateMeal(mealData, items);
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedItems([]);
    setMealName('');
    setMealDescription('');
    setMealType('lunch');
    setServings(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            {step === 'select' ? 'Select Ingredients' : 'Meal Details'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' ? (
          <>
            {/* Totals Summary */}
            {selectedItems.length > 0 && (
              <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="font-bold text-primary">{Math.round(totals.calories)}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{Math.round(totals.protein)}g</p>
                  <p className="text-xs text-muted-foreground">protein</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{Math.round(totals.carbs)}g</p>
                  <p className="text-xs text-muted-foreground">carbs</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{Math.round(totals.fat)}g</p>
                  <p className="text-xs text-muted-foreground">fat</p>
                </div>
              </div>
            )}

            {/* Selected Items with quantity controls */}
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected ({selectedItems.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedItems.map(({ fridgeItem, quantity }) => (
                    <div
                      key={fridgeItem.id}
                      className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full"
                    >
                      <span className="text-sm">{fridgeItem.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => updateItemQuantity(fridgeItem.id, -0.5)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-medium w-6 text-center">{quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => updateItemQuantity(fridgeItem.id, 0.5)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => handleSelectItem(fridgeItem)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 pr-4">
              {fridgeItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No items in your fridge. Add some items first!
                </p>
              ) : (
                <div className="space-y-2">
                  {fridgeItems.map((item) => (
                    <FridgeItemCard
                      key={item.id}
                      item={item}
                      onUpdateQuantity={() => {}}
                      onDelete={() => {}}
                      selectable
                      selected={selectedItems.some(s => s.fridgeItem.id === item.id)}
                      onSelect={handleSelectItem}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={() => setStep('details')}
                disabled={selectedItems.length === 0}
              >
                Next: Add Details
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mealName">Meal Name *</Label>
                <Input
                  id="mealName"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g., Grilled Chicken Salad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  placeholder="A light and healthy meal..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meal Type</Label>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* Final Totals */}
              <div className="grid grid-cols-4 gap-2 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">{Math.round(totals.calories)}</p>
                  <p className="text-xs text-muted-foreground">kcal total</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{Math.round(totals.protein)}g</p>
                  <p className="text-xs text-muted-foreground">protein</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{Math.round(totals.carbs)}g</p>
                  <p className="text-xs text-muted-foreground">carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{Math.round(totals.fat)}g</p>
                  <p className="text-xs text-muted-foreground">fat</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('select')}>Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !mealName.trim()}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Meal
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
