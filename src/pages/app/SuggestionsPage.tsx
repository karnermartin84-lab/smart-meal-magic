import { useState, useMemo } from 'react';
import { ChefHat, Filter, Flame, Drumstick } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFridgeItems } from '@/hooks/useFridgeItems';

export default function SuggestionsPage() {
  const { items } = useFridgeItems();
  const [filter, setFilter] = useState<'all' | 'high-protein' | 'low-carb'>('all');

  const suggestions = useMemo(() => {
    if (items.length < 2) return [];

    const combos = [];
    for (let i = 0; i < Math.min(items.length, 5); i++) {
      for (let j = i + 1; j < Math.min(items.length, 6); j++) {
        const combo = [items[i], items[j]];
        const totals = combo.reduce((acc, item) => ({
          calories: acc.calories + item.calories_per_serving,
          protein: acc.protein + item.protein_per_serving,
          carbs: acc.carbs + item.carbs_per_serving,
          fat: acc.fat + item.fat_per_serving
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        combos.push({ items: combo, ...totals });
      }
    }

    return combos.filter(c => {
      if (filter === 'high-protein') return c.protein > 20;
      if (filter === 'low-carb') return c.carbs < 30;
      return true;
    });
  }, [items, filter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">What Can I Make?</h1>
          <p className="text-muted-foreground">Meal ideas based on your fridge</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            <ChefHat className="w-4 h-4 mr-1" /> All
          </Button>
          <Button variant={filter === 'high-protein' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('high-protein')}>
            <Drumstick className="w-4 h-4 mr-1" /> High Protein
          </Button>
          <Button variant={filter === 'low-carb' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('low-carb')}>
            <Flame className="w-4 h-4 mr-1" /> Low Carb
          </Button>
        </div>

        {items.length < 2 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Add at least 2 items to your fridge to see meal suggestions</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No meals match your current filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {suggestion.items.map(item => (
                      <span key={item.id} className="px-3 py-1 bg-primary/10 rounded-full text-sm">{item.name}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div><p className="font-bold text-primary">{Math.round(suggestion.calories)}</p><p className="text-xs text-muted-foreground">kcal</p></div>
                    <div><p className="font-bold">{Math.round(suggestion.protein)}g</p><p className="text-xs text-muted-foreground">protein</p></div>
                    <div><p className="font-bold">{Math.round(suggestion.carbs)}g</p><p className="text-xs text-muted-foreground">carbs</p></div>
                    <div><p className="font-bold">{Math.round(suggestion.fat)}g</p><p className="text-xs text-muted-foreground">fat</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
