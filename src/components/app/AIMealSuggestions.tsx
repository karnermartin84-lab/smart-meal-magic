import { useState } from 'react';
import { Sparkles, ChefHat, Clock, Loader2, Check, ShoppingCart, X, Salad, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FridgeItem } from '@/hooks/useFridgeItems';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealIdea {
  name: string;
  description: string;
  cookingStyle: 'quick' | 'simple' | 'cooked' | 'slow-cook' | 'no-cook';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: {
    have: Ingredient[];
    pantry: Ingredient[];
    missing: Ingredient[];
  };
  instructions: string[];
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  servings: number;
}

interface AIMealSuggestionsProps {
  open: boolean;
  onClose: () => void;
  fridgeItems: FridgeItem[];
  onSaveMeal: (meal: {
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
  onAddToShoppingList?: (items: { name: string; quantity: number; unit: string }[]) => void;
}

const cookingStyleInfo: Record<string, { label: string; time: string; color: string }> = {
  'quick': { label: 'Quick', time: '<15 min', color: 'bg-green-500/10 text-green-600' },
  'simple': { label: 'Simple', time: '15-30 min', color: 'bg-blue-500/10 text-blue-600' },
  'cooked': { label: 'Cooked', time: '30-60 min', color: 'bg-amber-500/10 text-amber-600' },
  'slow-cook': { label: 'Slow Cook', time: '1+ hour', color: 'bg-orange-500/10 text-orange-600' },
  'no-cook': { label: 'No Cook', time: 'No cooking', color: 'bg-purple-500/10 text-purple-600' },
};

export function AIMealSuggestions({ open, onClose, fridgeItems, onSaveMeal, onAddToShoppingList }: AIMealSuggestionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState<'any' | 'healthy' | 'comfort'>('any');
  const [onlyUseAvailable, setOnlyUseAvailable] = useState(false);
  const [suggestions, setSuggestions] = useState<MealIdea[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealIdea | null>(null);
  const [saving, setSaving] = useState(false);

  const generateSuggestions = async () => {
    if (fridgeItems.length === 0) {
      toast({
        title: 'No ingredients',
        description: 'Add some items to your fridge first',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-meal-ideas', {
        body: {
          fridgeItems: fridgeItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            calories_per_serving: item.calories_per_serving,
            protein_per_serving: item.protein_per_serving,
            carbs_per_serving: item.carbs_per_serving,
            fat_per_serving: item.fat_per_serving
          })),
          preferences: {
            mealType,
            onlyUseAvailable,
            count: 4
          }
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      setSuggestions(data.meals || []);
    } catch (err: any) {
      console.error('Error generating meals:', err);
      toast({
        title: 'Failed to generate meals',
        description: err.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMeal = async (meal: MealIdea) => {
    setSaving(true);
    try {
      // Map fridge items to their IDs
      const fridgeItemMap = new Map(fridgeItems.map(fi => [fi.name.toLowerCase(), fi]));

      const allIngredients = [
        ...meal.ingredients.have,
        ...meal.ingredients.pantry,
        ...meal.ingredients.missing
      ];

      const mealItems = allIngredients.map(ing => {
        const fridgeItem = fridgeItemMap.get(ing.name.toLowerCase());
        return {
          fridge_item_id: fridgeItem?.id || null,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          calories: ing.calories,
          protein: ing.protein,
          carbs: ing.carbs,
          fat: ing.fat
        };
      });

      await onSaveMeal({
        name: meal.name,
        description: meal.description,
        meal_type: meal.mealType,
        servings: meal.servings,
        total_calories: meal.totalMacros.calories,
        total_protein: meal.totalMacros.protein,
        total_carbs: meal.totalMacros.carbs,
        total_fat: meal.totalMacros.fat,
        is_favorite: false
      }, mealItems);

      toast({
        title: 'Meal saved!',
        description: `${meal.name} has been added to your meals`
      });
      setSelectedMeal(null);
    } catch (err: any) {
      toast({
        title: 'Failed to save meal',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMissingToList = (meal: MealIdea) => {
    if (onAddToShoppingList && meal.ingredients.missing.length > 0) {
      onAddToShoppingList(meal.ingredients.missing.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit
      })));
      toast({
        title: 'Added to shopping list',
        description: `${meal.ingredients.missing.length} items added`
      });
    }
  };

  const handleClose = () => {
    setSuggestions([]);
    setSelectedMeal(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Meal Ideas
          </DialogTitle>
        </DialogHeader>

        {suggestions.length === 0 && !selectedMeal ? (
          // Configuration Screen
          <div className="space-y-6 py-4">
            <p className="text-muted-foreground">
              Generate real meal ideas based on your {fridgeItems.length} fridge items using AI.
            </p>

            {/* Meal Type Selection */}
            <div className="space-y-3">
              <Label>What kind of meals?</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={mealType === 'any' ? 'default' : 'outline'}
                  onClick={() => setMealType('any')}
                  className="flex-col h-auto py-3"
                >
                  <ChefHat className="w-5 h-5 mb-1" />
                  <span className="text-sm">Any</span>
                </Button>
                <Button
                  variant={mealType === 'healthy' ? 'default' : 'outline'}
                  onClick={() => setMealType('healthy')}
                  className="flex-col h-auto py-3"
                >
                  <Salad className="w-5 h-5 mb-1" />
                  <span className="text-sm">Healthy</span>
                </Button>
                <Button
                  variant={mealType === 'comfort' ? 'default' : 'outline'}
                  onClick={() => setMealType('comfort')}
                  className="flex-col h-auto py-3"
                >
                  <Cookie className="w-5 h-5 mb-1" />
                  <span className="text-sm">Comfort</span>
                </Button>
              </div>
            </div>

            {/* Only use available toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div>
                <Label htmlFor="only-available" className="font-medium">Only use what I have</Label>
                <p className="text-sm text-muted-foreground">
                  {onlyUseAvailable 
                    ? "Meals will only use your fridge items" 
                    : "May suggest pantry items or missing ingredients"}
                </p>
              </div>
              <Switch
                id="only-available"
                checked={onlyUseAvailable}
                onCheckedChange={setOnlyUseAvailable}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={generateSuggestions}
              disabled={loading || fridgeItems.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating ideas...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Meal Ideas
                </>
              )}
            </Button>
          </div>
        ) : selectedMeal ? (
          // Meal Detail View
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cookingStyleInfo[selectedMeal.cookingStyle]?.color}>
                    <Clock className="w-3 h-3 mr-1" />
                    {cookingStyleInfo[selectedMeal.cookingStyle]?.time}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{selectedMeal.mealType}</Badge>
                </div>
                <h3 className="text-xl font-semibold">{selectedMeal.name}</h3>
                <p className="text-muted-foreground mt-1">{selectedMeal.description}</p>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="font-bold text-primary">{Math.round(selectedMeal.totalMacros.calories)}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{Math.round(selectedMeal.totalMacros.protein)}g</p>
                  <p className="text-xs text-muted-foreground">protein</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{Math.round(selectedMeal.totalMacros.carbs)}g</p>
                  <p className="text-xs text-muted-foreground">carbs</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{Math.round(selectedMeal.totalMacros.fat)}g</p>
                  <p className="text-xs text-muted-foreground">fat</p>
                </div>
              </div>

              {/* Ingredients */}
              <div className="space-y-3">
                <h4 className="font-medium">Ingredients</h4>
                
                {selectedMeal.ingredients.have.length > 0 && (
                  <div>
                    <p className="text-sm text-green-600 font-medium flex items-center gap-1 mb-2">
                      <Check className="w-4 h-4" /> You have
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeal.ingredients.have.map((ing, i) => (
                        <Badge key={i} variant="secondary" className="bg-green-500/10">
                          {ing.quantity} {ing.unit} {ing.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMeal.ingredients.pantry.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-2">Pantry basics</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeal.ingredients.pantry.map((ing, i) => (
                        <Badge key={i} variant="outline">
                          {ing.quantity} {ing.unit} {ing.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMeal.ingredients.missing.length > 0 && (
                  <div>
                    <p className="text-sm text-amber-600 font-medium flex items-center gap-1 mb-2">
                      <ShoppingCart className="w-4 h-4" /> Suggested to buy
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeal.ingredients.missing.map((ing, i) => (
                        <Badge key={i} variant="secondary" className="bg-amber-500/10">
                          {ing.quantity} {ing.unit} {ing.name}
                        </Badge>
                      ))}
                    </div>
                    {onAddToShoppingList && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleAddMissingToList(selectedMeal)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to shopping list
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-medium mb-2">Instructions</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  {selectedMeal.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </ScrollArea>
        ) : (
          // Suggestions List
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {suggestions.map((meal, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedMeal(meal)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={cookingStyleInfo[meal.cookingStyle]?.color}>
                          {cookingStyleInfo[meal.cookingStyle]?.label}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{meal.mealType}</Badge>
                      </div>
                      {meal.ingredients.missing.length > 0 && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          +{meal.ingredients.missing.length} to buy
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mt-2">{meal.name}</h3>
                    <p className="text-sm text-muted-foreground">{meal.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-4 text-sm">
                      <span className="text-primary font-medium">{Math.round(meal.totalMacros.calories)} kcal</span>
                      <span>{Math.round(meal.totalMacros.protein)}g protein</span>
                      <span className="text-muted-foreground">{meal.ingredients.have.length} ingredients</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          {suggestions.length > 0 && !selectedMeal && (
            <Button variant="outline" onClick={() => setSuggestions([])}>
              Back to options
            </Button>
          )}
          {selectedMeal && (
            <>
              <Button variant="outline" onClick={() => setSelectedMeal(null)}>
                Back to list
              </Button>
              <Button onClick={() => handleSaveMeal(selectedMeal)} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Meal
                  </>
                )}
              </Button>
            </>
          )}
          {!selectedMeal && suggestions.length === 0 && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
