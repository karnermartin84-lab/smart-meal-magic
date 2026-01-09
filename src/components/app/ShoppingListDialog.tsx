import { useState, useMemo } from 'react';
import { ShoppingCart, Check, Copy, Share2, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DayPlan } from '@/hooks/useMealPlan';
import { FridgeItem } from '@/hooks/useFridgeItems';
import { cn } from '@/lib/utils';

interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  inPantry: boolean;
  pantryQuantity?: number;
  neededQuantity: number;
}

interface ShoppingListDialogProps {
  open: boolean;
  onClose: () => void;
  weekPlan: DayPlan[];
  fridgeItems: FridgeItem[];
}

export function ShoppingListDialog({ open, onClose, weekPlan, fridgeItems }: ShoppingListDialogProps) {
  const { toast } = useToast();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showPantryItems, setShowPantryItems] = useState(false);

  // Build shopping list from week plan
  const shoppingList = useMemo(() => {
    const ingredientMap = new Map<string, { quantity: number; unit: string }>();

    // Collect all ingredients from planned meals
    weekPlan.forEach(day => {
      Object.values(day.meals).forEach(plannedMeal => {
        if (plannedMeal?.meal?.meal_items) {
          plannedMeal.meal.meal_items.forEach(item => {
            const key = item.name.toLowerCase();
            const existing = ingredientMap.get(key);
            if (existing) {
              existing.quantity += item.quantity || 1;
            } else {
              ingredientMap.set(key, { 
                quantity: item.quantity || 1, 
                unit: item.unit || 'serving' 
              });
            }
          });
        }
      });
    });

    // Cross-reference with pantry (fridge items)
    const pantryMap = new Map(fridgeItems.map(fi => [fi.name.toLowerCase(), fi]));

    const items: ShoppingListItem[] = [];
    ingredientMap.forEach((value, key) => {
      const pantryItem = pantryMap.get(key);
      const inPantry = !!pantryItem;
      const pantryQuantity = pantryItem?.quantity || 0;
      const neededQuantity = Math.max(0, value.quantity - pantryQuantity);

      items.push({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        quantity: value.quantity,
        unit: value.unit,
        inPantry,
        pantryQuantity,
        neededQuantity
      });
    });

    // Sort: items to buy first, then pantry items
    return items.sort((a, b) => {
      if (a.neededQuantity > 0 && b.neededQuantity === 0) return -1;
      if (a.neededQuantity === 0 && b.neededQuantity > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [weekPlan, fridgeItems]);

  const itemsToBuy = shoppingList.filter(item => item.neededQuantity > 0);
  const itemsInPantry = shoppingList.filter(item => item.neededQuantity === 0);

  const toggleItem = (name: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const formatListForSharing = () => {
    const lines = ['🛒 Shopping List\n'];
    
    if (itemsToBuy.length > 0) {
      lines.push('To Buy:');
      itemsToBuy.forEach(item => {
        const checked = checkedItems.has(item.name) ? '✓' : '○';
        lines.push(`${checked} ${item.neededQuantity} ${item.unit} ${item.name}`);
      });
    }

    if (showPantryItems && itemsInPantry.length > 0) {
      lines.push('\n✅ Already Have:');
      itemsInPantry.forEach(item => {
        lines.push(`  ${item.quantity} ${item.unit} ${item.name}`);
      });
    }

    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatListForSharing());
      toast({
        title: 'Copied!',
        description: 'Shopping list copied to clipboard'
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    const text = formatListForSharing();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shopping List',
          text
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy(); // Fallback to copy
        }
      }
    } else {
      handleCopy(); // Fallback to copy
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Weekly Shopping List
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {shoppingList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No meals planned yet</p>
              <p className="text-sm">Add meals to your plan to generate a shopping list</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Items to Buy */}
              {itemsToBuy.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    To Buy ({itemsToBuy.length})
                  </h3>
                  <div className="space-y-2">
                    {itemsToBuy.map(item => (
                      <div
                        key={item.name}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          checkedItems.has(item.name) ? 'bg-muted/50 border-muted' : 'bg-card'
                        )}
                      >
                        <Checkbox
                          checked={checkedItems.has(item.name)}
                          onCheckedChange={() => toggleItem(item.name)}
                        />
                        <div className="flex-1">
                          <p className={cn(
                            'font-medium',
                            checkedItems.has(item.name) && 'line-through text-muted-foreground'
                          )}>
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.neededQuantity} {item.unit}
                            {item.inPantry && (
                              <span className="text-xs ml-2">
                                (have {item.pantryQuantity} of {item.quantity} needed)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items in Pantry */}
              {itemsInPantry.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPantryItems(!showPantryItems)}
                    className="w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Already in Pantry ({itemsInPantry.length})
                    </span>
                    <span>{showPantryItems ? '−' : '+'}</span>
                  </button>
                  
                  {showPantryItems && (
                    <div className="space-y-2 mt-2">
                      {itemsInPantry.map(item => (
                        <div
                          key={item.name}
                          className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                          <div className="flex-1">
                            <p className="font-medium text-green-700 dark:text-green-400">{item.name}</p>
                            <p className="text-sm text-green-600/80">
                              Have {item.pantryQuantity} {item.unit} (need {item.quantity})
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                            ✓ In Fridge
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {itemsToBuy.length === 0 && itemsInPantry.length > 0 && (
                <div className="text-center py-4 bg-green-500/10 rounded-lg">
                  <Check className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="font-medium text-green-700">You have everything!</p>
                  <p className="text-sm text-green-600/80">All ingredients are in your fridge</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopy} disabled={shoppingList.length === 0}>
            <Copy className="w-4 h-4 mr-2" />
            Copy List
          </Button>
          <Button onClick={handleShare} disabled={shoppingList.length === 0}>
            <Share2 className="w-4 h-4 mr-2" />
            Share List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
