import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { MealCard } from '@/components/app/MealCard';
import { MealBuilder } from '@/components/app/MealBuilder';
import { useMeals } from '@/hooks/useMeals';
import { useFridgeItems } from '@/hooks/useFridgeItems';

export default function MealsPage() {
  const { meals, loading, createMeal, toggleFavorite, deleteMeal } = useMeals();
  const { items: fridgeItems } = useFridgeItems();
  const [builderOpen, setBuilderOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">My Meals</h1>
            <p className="text-muted-foreground">{meals.length} saved meals</p>
          </div>
          <Button onClick={() => setBuilderOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Meal
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No meals created yet</p>
            <Button onClick={() => setBuilderOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first meal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onToggleFavorite={toggleFavorite} onDelete={deleteMeal} />
            ))}
          </div>
        )}

        <MealBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} fridgeItems={fridgeItems} onCreateMeal={createMeal} />
      </div>
    </AppLayout>
  );
}
