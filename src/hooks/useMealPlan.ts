import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Meal } from './useMeals';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedMeal {
  id: string;
  user_id: string;
  meal_id: string;
  plan_date: string;
  slot: MealSlot;
  created_at: string;
  updated_at: string;
  meal?: Meal;
}

export interface DayPlan {
  date: Date;
  dateStr: string;
  meals: {
    breakfast?: PlannedMeal;
    lunch?: PlannedMeal;
    dinner?: PlannedMeal;
    snack?: PlannedMeal;
  };
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function useMealPlan(weekStart: Date) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStartDate = startOfWeek(weekStart, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(weekStart, { weekStartsOn: 1 });

  const fetchPlannedMeals = useCallback(async () => {
    if (!user) {
      setPlannedMeals([]);
      setLoading(false);
      return;
    }

    try {
      const startStr = format(weekStartDate, 'yyyy-MM-dd');
      const endStr = format(weekEndDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('meal_plan')
        .select(`
          *,
          meal:meals (
            *,
            meal_items (*)
          )
        `)
        .gte('plan_date', startStr)
        .lte('plan_date', endStr)
        .order('plan_date');

      if (error) throw error;
      setPlannedMeals((data || []) as PlannedMeal[]);
    } catch (error: any) {
      toast({
        title: 'Error loading meal plan',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, weekStartDate, weekEndDate, toast]);

  useEffect(() => {
    fetchPlannedMeals();
  }, [fetchPlannedMeals]);

  const addToSlot = async (mealId: string, date: Date, slot: MealSlot): Promise<boolean> => {
    if (!user) return false;

    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      // Remove existing meal in that slot first
      await supabase
        .from('meal_plan')
        .delete()
        .eq('user_id', user.id)
        .eq('plan_date', dateStr)
        .eq('slot', slot);

      // Add new meal
      const { error } = await supabase
        .from('meal_plan')
        .insert({
          user_id: user.id,
          meal_id: mealId,
          plan_date: dateStr,
          slot
        });

      if (error) throw error;

      await fetchPlannedMeals();
      toast({
        title: 'Meal planned!',
        description: `Added to ${slot} on ${format(date, 'EEEE')}`
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error planning meal',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const removeFromSlot = async (planId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('meal_plan')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      setPlannedMeals(prev => prev.filter(p => p.id !== planId));
      toast({
        title: 'Meal removed',
        description: 'Removed from meal plan'
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error removing meal',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  // Build week plan structure
  const weekPlan: DayPlan[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayMeals = plannedMeals.filter(p => p.plan_date === dateStr);
    
    const meals: DayPlan['meals'] = {};
    dayMeals.forEach(pm => {
      meals[pm.slot] = pm;
    });

    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    Object.values(meals).forEach(pm => {
      if (pm?.meal) {
        totals.calories += pm.meal.total_calories || 0;
        totals.protein += pm.meal.total_protein || 0;
        totals.carbs += pm.meal.total_carbs || 0;
        totals.fat += pm.meal.total_fat || 0;
      }
    });

    return { date, dateStr, meals, totals };
  });

  return {
    weekPlan,
    loading,
    addToSlot,
    removeFromSlot,
    refetch: fetchPlannedMeals
  };
}
