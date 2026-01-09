import { useState } from 'react';
import { CalendarDays, Sparkles, Plus, ShoppingCart } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { MealPlanCalendar } from '@/components/app/MealPlanCalendar';
import { MealBuilder } from '@/components/app/MealBuilder';
import { AIMealSuggestions } from '@/components/app/AIMealSuggestions';
import { ShoppingListDialog } from '@/components/app/ShoppingListDialog';
import { useMeals, Meal } from '@/hooks/useMeals';
import { useFridgeItems } from '@/hooks/useFridgeItems';
import { useMealPlan } from '@/hooks/useMealPlan';
import { Loader2 } from 'lucide-react';

export default function MealPlanPage() {
  const { meals, loading, createMeal } = useMeals();
  const { items: fridgeItems } = useFridgeItems();
  const [currentWeek] = useState(new Date());
  const { weekPlan } = useMealPlan(currentWeek);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [draggedMeal, setDraggedMeal] = useState<Meal | null>(null);

  const handleDragStart = (meal: Meal) => {
    setDraggedMeal(meal);
  };

  const handleDragEnd = () => {
    setDraggedMeal(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6" onDragEnd={handleDragEnd}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-6 h-6" />
              Meal Plan
            </h1>
            <p className="text-muted-foreground">Plan your meals for the week</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShoppingListOpen(true)}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Shopping List</span>
            </Button>
            <Button variant="outline" onClick={() => setAiSuggestionsOpen(true)} className="hidden md:flex">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Ideas
            </Button>
            <Button onClick={() => setBuilderOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Meal</span>
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <MealPlanCalendar
            meals={meals}
            onDragStart={handleDragStart}
            draggedMeal={draggedMeal}
          />
        )}

        {/* Fixed AI button on mobile */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <Button 
            size="lg" 
            className="rounded-full shadow-lg h-14 w-14 p-0"
            onClick={() => setAiSuggestionsOpen(true)}
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </div>

        {/* Dialogs */}
        <MealBuilder 
          open={builderOpen} 
          onClose={() => setBuilderOpen(false)} 
          fridgeItems={fridgeItems} 
          onCreateMeal={createMeal} 
        />
        
        <AIMealSuggestions 
          open={aiSuggestionsOpen} 
          onClose={() => setAiSuggestionsOpen(false)} 
          fridgeItems={fridgeItems} 
          onSaveMeal={createMeal}
        />

        <ShoppingListDialog
          open={shoppingListOpen}
          onClose={() => setShoppingListOpen(false)}
          weekPlan={weekPlan}
          fridgeItems={fridgeItems}
        />
      </div>
    </AppLayout>
  );
}
