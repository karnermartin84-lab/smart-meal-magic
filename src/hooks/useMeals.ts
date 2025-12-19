import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface MealItem {
  id: string;
  meal_id: string;
  fridge_item_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  servings: number;
  meal_type: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  meal_items?: MealItem[];
}

export function useMeals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = useCallback(async () => {
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          meal_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeals((data || []) as Meal[]);
    } catch (error: any) {
      toast({
        title: 'Error loading meals',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const createMeal = async (
    meal: Omit<Meal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'meal_items'>,
    items: Omit<MealItem, 'id' | 'meal_id' | 'created_at'>[]
  ) => {
    if (!user) return null;

    try {
      // Create the meal first
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert({
          ...meal,
          user_id: user.id
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Add meal items
      if (items.length > 0) {
        const mealItems = items.map(item => ({
          ...item,
          meal_id: mealData.id
        }));

        const { error: itemsError } = await supabase
          .from('meal_items')
          .insert(mealItems);

        if (itemsError) throw itemsError;
      }

      await fetchMeals();
      toast({
        title: 'Meal created',
        description: `${meal.name} has been saved`
      });
      return mealData as Meal;
    } catch (error: any) {
      toast({
        title: 'Error creating meal',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateMeal = async (id: string, updates: Partial<Meal>) => {
    try {
      const { data, error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setMeals(prev => prev.map(meal => meal.id === id ? { ...meal, ...data } as Meal : meal));
      return data as Meal;
    } catch (error: any) {
      toast({
        title: 'Error updating meal',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const deleteMeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMeals(prev => prev.filter(meal => meal.id !== id));
      toast({
        title: 'Meal deleted',
        description: 'Meal has been removed'
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting meal',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const toggleFavorite = async (id: string) => {
    const meal = meals.find(m => m.id === id);
    if (!meal) return;
    
    return updateMeal(id, { is_favorite: !meal.is_favorite });
  };

  return {
    meals,
    loading,
    createMeal,
    updateMeal,
    deleteMeal,
    toggleFavorite,
    refetch: fetchMeals
  };
}
