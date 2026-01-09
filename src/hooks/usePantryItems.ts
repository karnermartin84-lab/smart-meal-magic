import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  serving_size: string;
  category: string;
  barcode: string | null;
  brand: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PantryItemInput = Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const PANTRY_CATEGORIES = [
  { value: 'grains', label: 'Grains & Flour' },
  { value: 'spices', label: 'Spices & Seasonings' },
  { value: 'oils', label: 'Oils & Vinegars' },
  { value: 'baking', label: 'Baking Supplies' },
  { value: 'canned', label: 'Canned Goods' },
  { value: 'condiments', label: 'Condiments & Sauces' },
  { value: 'pasta', label: 'Pasta & Noodles' },
  { value: 'legumes', label: 'Beans & Legumes' },
  { value: 'nuts', label: 'Nuts & Seeds' },
  { value: 'sweeteners', label: 'Sweeteners' },
  { value: 'other', label: 'Other' },
];

export function usePantryItems() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data as PantryItem[]);
    } catch (error) {
      console.error('Error fetching pantry items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pantry items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Partial<PantryItemInput>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .insert({
          user_id: user.id,
          name: item.name || 'Unknown Item',
          quantity: item.quantity ?? 1,
          unit: item.unit || 'unit',
          calories_per_serving: item.calories_per_serving ?? 0,
          protein_per_serving: item.protein_per_serving ?? 0,
          carbs_per_serving: item.carbs_per_serving ?? 0,
          fat_per_serving: item.fat_per_serving ?? 0,
          serving_size: item.serving_size || '100g',
          category: item.category || 'other',
          barcode: item.barcode || null,
          brand: item.brand || null,
          image_url: item.image_url || null,
          notes: item.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [...prev, data as PantryItem]);
      toast({
        title: 'Item added',
        description: `${item.name} added to your pantry`,
      });
      return data;
    } catch (error) {
      console.error('Error adding pantry item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<PantryItemInput>) => {
    try {
      const { error } = await supabase
        .from('pantry_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      return true;
    } catch (error) {
      console.error('Error updating pantry item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: 'Item removed',
        description: 'Item removed from your pantry',
      });
      return true;
    } catch (error) {
      console.error('Error deleting pantry item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchItems,
  };
}
