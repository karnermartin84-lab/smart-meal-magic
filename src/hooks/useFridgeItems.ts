import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface FridgeItem {
  id: string;
  user_id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  quantity: number;
  unit: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  serving_size: string | null;
  image_url: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useFridgeItems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fridge_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data || []) as FridgeItem[]);
    } catch (error: any) {
      toast({
        title: 'Error loading fridge items',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Omit<FridgeItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('fridge_items')
        .insert({
          ...item,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setItems(prev => [data as FridgeItem, ...prev]);
      toast({
        title: 'Item added',
        description: `${item.name} added to your fridge`
      });
      return data as FridgeItem;
    } catch (error: any) {
      toast({
        title: 'Error adding item',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<FridgeItem>) => {
    try {
      const { data, error } = await supabase
        .from('fridge_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setItems(prev => prev.map(item => item.id === id ? data as FridgeItem : item));
      toast({
        title: 'Item updated',
        description: 'Fridge item updated successfully'
      });
      return data as FridgeItem;
    } catch (error: any) {
      toast({
        title: 'Error updating item',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fridge_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Item removed',
        description: 'Item removed from your fridge'
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error removing item',
        description: error.message,
        variant: 'destructive'
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
    refetch: fetchItems
  };
}
