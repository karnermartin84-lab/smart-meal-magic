import { useState } from 'react';
import { ChefHat, MessageCircle } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AIChefChat } from '@/components/app/AIChefChat';
import { useFridgeItems } from '@/hooks/useFridgeItems';
import { usePantryItems } from '@/hooks/usePantryItems';
import { useMeals } from '@/hooks/useMeals';
import { useShoppingList } from '@/hooks/useShoppingList';
import { MealData } from '@/hooks/useAIChefChat';
import { useToast } from '@/hooks/use-toast';

export default function ChefPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const { items: fridgeItems } = useFridgeItems();
  const { items: pantryItems } = usePantryItems();
  const { createMeal } = useMeals();
  const { addItems: addToShoppingList } = useShoppingList();
  const { toast } = useToast();

  const handleAddToMealPlan = async (meal: MealData) => {
    try {
      // Combine all ingredients for the meal
      const allIngredients = [...meal.ingredientsHave, ...meal.ingredientsMissing];
      
      await createMeal(
        {
          name: meal.name,
          description: meal.description || null,
          meal_type: meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
          servings: meal.servings,
          total_calories: meal.totalMacros.calories,
          total_protein: meal.totalMacros.protein,
          total_carbs: meal.totalMacros.carbs,
          total_fat: meal.totalMacros.fat,
          is_favorite: false,
        },
        allIngredients.map(ing => ({
          fridge_item_id: null,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          calories: ing.calories,
          protein: ing.protein,
          carbs: ing.carbs,
          fat: ing.fat,
        }))
      );

      // Add missing ingredients to shopping list
      if (meal.ingredientsMissing.length > 0) {
        addToShoppingList(
          meal.ingredientsMissing.map(ing => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            source: `AI Chef - ${meal.name}`,
          }))
        );

        toast({
          title: 'Meal saved!',
          description: `${meal.name} added to meals. ${meal.ingredientsMissing.length} missing ingredient(s) added to shopping list.`,
        });
      } else {
        toast({
          title: 'Meal saved!',
          description: `${meal.name} has been added to your meals. You have all the ingredients!`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save meal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Personal Chef AI
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your AI-powered personal chef that knows your fridge, pantry, and can create custom recipes for any calorie goal.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  🥗
                </div>
                <div>
                  <h3 className="font-semibold">Fridge Items</h3>
                  <p className="text-sm text-muted-foreground">{fridgeItems.length} fresh ingredients</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Fresh items like meats, vegetables, dairy that the AI will prioritize using.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  🥫
                </div>
                <div>
                  <h3 className="font-semibold">Pantry Staples</h3>
                  <p className="text-sm text-muted-foreground">{pantryItems.length} long-term items</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Staples like flour, spices, oils that complement your fresh ingredients.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">What can the Chef AI do?</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>✅ Create custom recipes - even with missing ingredients</li>
              <li>✅ Target specific calorie goals (800-1200+ kcal for hearty meals)</li>
              <li>✅ Clearly list "Missing Ingredients" you need to buy</li>
              <li>✅ Auto-add missing ingredients to shopping list when saving</li>
              <li>✅ Answer cooking questions and provide tips</li>
            </ul>
          </CardContent>
        </Card>

        <Button
          size="lg"
          onClick={() => setChatOpen(true)}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Start Chatting with Chef AI
        </Button>
      </div>

      <AIChefChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        fridgeItems={fridgeItems}
        pantryItems={pantryItems}
        onAddToMealPlan={handleAddToMealPlan}
      />
    </AppLayout>
  );
}
