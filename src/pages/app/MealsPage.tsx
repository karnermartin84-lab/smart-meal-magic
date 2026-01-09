import { useState } from 'react';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { MealCard } from '@/components/app/MealCard';
import { MealBuilder } from '@/components/app/MealBuilder';
import { AIMealSuggestions } from '@/components/app/AIMealSuggestions';
import { useMeals } from '@/hooks/useMeals';
import { useFridgeItems } from '@/hooks/useFridgeItems';

export default function MealsPage() {
  const { meals, loading, createMeal, toggleFavorite, deleteMeal } = useMeals();
  const { items: fridgeItems } = useFridgeItems();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">My Meals</h1>
            <p className="text-muted-foreground">{meals.length} saved meals</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAiSuggestionsOpen(true)} className="hidden md:flex">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Ideas
            </Button>
            <Button onClick={() => setBuilderOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Meal
            </Button>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-0">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onToggleFavorite={toggleFavorite} onDelete={deleteMeal} />
            ))}
          </div>
        )}

        {/* Fixed AI Ideas button on mobile */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <Button 
            size="lg" 
            className="rounded-full shadow-lg h-14 w-14 p-0"
            onClick={() => setAiSuggestionsOpen(true)}
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </div>

        <MealBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} fridgeItems={fridgeItems} onCreateMeal={createMeal} />
        
        <AIMealSuggestions 
          open={aiSuggestionsOpen} 
          onClose={() => setAiSuggestionsOpen(false)} 
          fridgeItems={fridgeItems} 
          onSaveMeal={createMeal}
        />
      </div>
    </AppLayout>
  );
}
