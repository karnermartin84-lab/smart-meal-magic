import { Heart, Trash2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Meal } from '@/hooks/useMeals';
import { cn } from '@/lib/utils';

interface MealCardProps {
  meal: Meal;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MealCard({ meal, onToggleFavorite, onDelete }: MealCardProps) {
  const mealTypeColors: Record<string, string> = {
    breakfast: 'bg-amber-500/10 text-amber-600',
    lunch: 'bg-green-500/10 text-green-600',
    dinner: 'bg-blue-500/10 text-blue-600',
    snack: 'bg-purple-500/10 text-purple-600'
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <span className={cn(
              'inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize mb-2',
              mealTypeColors[meal.meal_type] || 'bg-muted text-muted-foreground'
            )}>
              {meal.meal_type}
            </span>
            <h3 className="font-semibold text-lg text-foreground">{meal.name}</h3>
            {meal.description && (
              <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onToggleFavorite(meal.id)}
            className={cn(
              meal.is_favorite && 'text-red-500 hover:text-red-600'
            )}
          >
            <Heart className={cn('w-5 h-5', meal.is_favorite && 'fill-current')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Macros Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <p className="text-lg font-bold text-primary">{Math.round(meal.total_calories)}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/10">
            <p className="text-lg font-bold text-accent-foreground">{Math.round(meal.total_protein)}g</p>
            <p className="text-xs text-muted-foreground">protein</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary/10">
            <p className="text-lg font-bold text-secondary-foreground">{Math.round(meal.total_carbs)}g</p>
            <p className="text-xs text-muted-foreground">carbs</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted">
            <p className="text-lg font-bold text-muted-foreground">{Math.round(meal.total_fat)}g</p>
            <p className="text-xs text-muted-foreground">fat</p>
          </div>
        </div>

        {/* Meal Items */}
        {meal.meal_items && meal.meal_items.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground mb-2">Ingredients:</p>
            <div className="flex flex-wrap gap-1">
              {meal.meal_items.map((item) => (
                <span
                  key={item.id}
                  className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                >
                  {item.name} ({item.quantity} {item.unit})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {meal.servings} {meal.servings === 1 ? 'serving' : 'servings'}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(meal.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
