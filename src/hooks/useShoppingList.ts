import { useState, useCallback, useEffect } from 'react';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  source: string; // e.g., "AI Chef", "Manual"
}

const STORAGE_KEY = 'smartmeal-shopping-list';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItems = useCallback((newItems: Omit<ShoppingListItem, 'id' | 'checked'>[]) => {
    setItems(prev => {
      const updated = [...prev];
      
      newItems.forEach(newItem => {
        const existingIndex = updated.findIndex(
          item => item.name.toLowerCase() === newItem.name.toLowerCase()
        );
        
        if (existingIndex >= 0) {
          // Update quantity if item exists
          updated[existingIndex].quantity += newItem.quantity;
        } else {
          // Add new item
          updated.push({
            ...newItem,
            id: crypto.randomUUID(),
            checked: false,
          });
        }
      });
      
      return updated;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearChecked = useCallback(() => {
    setItems(prev => prev.filter(item => !item.checked));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItems,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
  };
}
