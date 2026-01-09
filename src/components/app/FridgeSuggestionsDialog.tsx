import { useState } from 'react';
import { Check, X, Minus, Plus, ScanLine, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { searchFoods, convertToFridgeItem } from '@/lib/openFoodFacts';

interface FoodSuggestion {
  name: string;
  confidence: number;
  quantity: number;
  unit: string;
}

interface EditableSuggestion extends FoodSuggestion {
  selected: boolean;
  lookingUp: boolean;
  lookedUp: boolean;
  fridgeItem?: ReturnType<typeof convertToFridgeItem>;
}

interface FridgeSuggestionsDialogProps {
  open: boolean;
  onClose: () => void;
  suggestions: FoodSuggestion[];
  notes: string | null;
  onConfirm: (items: ReturnType<typeof convertToFridgeItem>[]) => void;
}

export function FridgeSuggestionsDialog({ 
  open, 
  onClose, 
  suggestions, 
  notes,
  onConfirm 
}: FridgeSuggestionsDialogProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<EditableSuggestion[]>(() => 
    suggestions.map(s => ({ 
      ...s, 
      selected: s.confidence >= 0.7, 
      lookingUp: false,
      lookedUp: false 
    }))
  );
  const [confirming, setConfirming] = useState(false);

  const toggleSelect = (index: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateQuantity = (index: number, delta: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const lookupItem = async (index: number) => {
    const item = items[index];
    setItems(prev => prev.map((it, i) => 
      i === index ? { ...it, lookingUp: true } : it
    ));

    try {
      const products = await searchFoods(item.name);
      if (products.length > 0) {
        const fridgeItem = convertToFridgeItem(products[0]);
        fridgeItem.quantity = item.quantity;
        
        setItems(prev => prev.map((it, i) => 
          i === index ? { 
            ...it, 
            lookingUp: false, 
            lookedUp: true,
            fridgeItem,
            name: fridgeItem.name
          } : it
        ));
        
        toast({
          title: 'Found nutrition data',
          description: `${fridgeItem.calories_per_serving} cal per ${fridgeItem.serving_size}`
        });
      } else {
        setItems(prev => prev.map((it, i) => 
          i === index ? { ...it, lookingUp: false } : it
        ));
        toast({
          title: 'No match found',
          description: 'Item will be added with default values',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setItems(prev => prev.map((it, i) => 
        i === index ? { ...it, lookingUp: false } : it
      ));
    }
  };

  const handleConfirm = async () => {
    const selectedItems = items.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to add',
        variant: 'destructive'
      });
      return;
    }

    setConfirming(true);

    // For items without nutrition data, create basic fridge items
    const fridgeItems = selectedItems.map(item => {
      if (item.fridgeItem) {
        return { ...item.fridgeItem, quantity: item.quantity };
      }
      // Default values for items without lookup
      return {
        barcode: null,
        name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
        brand: null,
        quantity: item.quantity,
        unit: item.unit,
        calories_per_serving: 0,
        protein_per_serving: 0,
        carbs_per_serving: 0,
        fat_per_serving: 0,
        serving_size: '1 serving',
        image_url: null,
        expires_at: null
      };
    });

    onConfirm(fridgeItems);
    setConfirming(false);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge variant="default" className="bg-green-500">High</Badge>;
    if (confidence >= 0.7) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline" className="text-amber-600 border-amber-600">Low</Badge>;
  };

  const selectedCount = items.filter(i => i.selected).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Detected Items</DialogTitle>
        </DialogHeader>

        {notes && (
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-muted-foreground">{notes}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {items.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                item.selected ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
              }`}
            >
              <Checkbox
                checked={item.selected}
                onCheckedChange={() => toggleSelect(index)}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize truncate">{item.name}</span>
                  {getConfidenceBadge(item.confidence)}
                  {item.lookedUp && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      Nutrition
                    </Badge>
                  )}
                </div>
                {item.fridgeItem && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.fridgeItem.calories_per_serving} cal · {item.fridgeItem.protein_per_serving}g protein
                  </p>
                )}
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(index, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(index, 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Lookup button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => lookupItem(index)}
                disabled={item.lookingUp || item.lookedUp}
                title="Lookup nutrition data"
              >
                {item.lookingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ScanLine className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={confirming || selectedCount === 0}
            className="flex-1"
          >
            {confirming ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Add {selectedCount} Item{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
