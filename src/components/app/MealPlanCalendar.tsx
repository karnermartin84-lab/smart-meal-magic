import { useState } from 'react';
import { format, addWeeks, subWeeks, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Flame, Beef, Wheat, Droplets, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMealPlan, MealSlot, DayPlan } from '@/hooks/useMealPlan';
import { Meal } from '@/hooks/useMeals';
import { cn } from '@/lib/utils';

interface MealPlanCalendarProps {
  meals: Meal[];
  onDragStart: (meal: Meal) => void;
  draggedMeal: Meal | null;
}

const SLOTS: { key: MealSlot; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
  { key: 'snack', label: 'Snacks', icon: '🍿' },
];

export function MealPlanCalendar({ meals, onDragStart, draggedMeal }: MealPlanCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { weekPlan, loading, addToSlot, removeFromSlot } = useMealPlan(currentWeek);
  const [dragOverSlot, setDragOverSlot] = useState<{ dateStr: string; slot: MealSlot } | null>(null);

  const handleDrop = async (date: Date, slot: MealSlot) => {
    if (draggedMeal) {
      await addToSlot(draggedMeal.id, date, slot);
    }
    setDragOverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string, slot: MealSlot) => {
    e.preventDefault();
    setDragOverSlot({ dateStr, slot });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <h2 className="font-semibold text-lg">
            {format(weekPlan[0]?.date || currentWeek, 'MMM d')} - {format(weekPlan[6]?.date || currentWeek, 'MMM d, yyyy')}
          </h2>
          <Button variant="link" size="sm" onClick={() => setCurrentWeek(new Date())} className="text-muted-foreground">
            Today
          </Button>
        </div>
        <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <ScrollArea className="w-full">
        <div className="grid grid-cols-7 gap-2 min-w-[800px]">
          {weekPlan.map((day) => (
            <DayColumn
              key={day.dateStr}
              day={day}
              dragOverSlot={dragOverSlot}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onRemove={removeFromSlot}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Discovery Section */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold">📚 Your Saved Meals</h3>
          <p className="text-sm text-muted-foreground">Drag meals to add them to your plan</p>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No saved meals yet. Create some meals first!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {meals.map((meal) => (
                <DraggableMealCard key={meal.id} meal={meal} onDragStart={onDragStart} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DayColumnProps {
  day: DayPlan;
  dragOverSlot: { dateStr: string; slot: MealSlot } | null;
  onDragOver: (e: React.DragEvent, dateStr: string, slot: MealSlot) => void;
  onDragLeave: () => void;
  onDrop: (date: Date, slot: MealSlot) => void;
  onRemove: (planId: string) => void;
}

function DayColumn({ day, dragOverSlot, onDragOver, onDragLeave, onDrop, onRemove }: DayColumnProps) {
  const today = isToday(day.date);

  return (
    <Card className={cn('min-h-[400px]', today && 'ring-2 ring-primary')}>
      <CardHeader className="p-3 pb-2">
        <div className="text-center">
          <p className={cn('text-xs uppercase tracking-wide', today ? 'text-primary font-semibold' : 'text-muted-foreground')}>
            {format(day.date, 'EEE')}
          </p>
          <p className={cn('text-lg font-bold', today && 'text-primary')}>{format(day.date, 'd')}</p>
        </div>
        
        {/* Daily Nutrition Summary */}
        {day.totals.calories > 0 && (
          <div className="mt-2 p-2 bg-muted rounded-lg space-y-1">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>{Math.round(day.totals.calories)}</span>
              <span className="text-muted-foreground text-xs">kcal</span>
            </div>
            <div className="flex justify-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Beef className="w-3 h-3" />
                {Math.round(day.totals.protein)}g
              </span>
              <span className="flex items-center gap-0.5">
                <Wheat className="w-3 h-3" />
                {Math.round(day.totals.carbs)}g
              </span>
              <span className="flex items-center gap-0.5">
                <Droplets className="w-3 h-3" />
                {Math.round(day.totals.fat)}g
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-2 space-y-2">
        {SLOTS.map(({ key, label, icon }) => {
          const plannedMeal = day.meals[key];
          const isDropTarget = dragOverSlot?.dateStr === day.dateStr && dragOverSlot?.slot === key;

          return (
            <div
              key={key}
              className={cn(
                'p-2 rounded-lg border-2 border-dashed transition-all min-h-[60px]',
                isDropTarget ? 'border-primary bg-primary/10' : 'border-border',
                plannedMeal && 'border-solid bg-card'
              )}
              onDragOver={(e) => onDragOver(e, day.dateStr, key)}
              onDragLeave={onDragLeave}
              onDrop={() => onDrop(day.date, key)}
            >
              <p className="text-xs text-muted-foreground mb-1">
                {icon} {label}
              </p>
              
              {plannedMeal?.meal ? (
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plannedMeal.meal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(plannedMeal.meal.total_calories || 0)} kcal
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={() => onRemove(plannedMeal.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Drop meal here</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface DraggableMealCardProps {
  meal: Meal;
  onDragStart: (meal: Meal) => void;
}

function DraggableMealCard({ meal, onDragStart }: DraggableMealCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(meal)}
      className="p-3 rounded-lg border bg-card hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{meal.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Badge variant="outline" className="capitalize text-xs px-1.5 py-0">
              {meal.meal_type}
            </Badge>
            <span>{Math.round(meal.total_calories)} kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
