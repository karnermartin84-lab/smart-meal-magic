import { useState } from 'react';
import { Plus, Loader2, Search } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PantryItemCard } from '@/components/app/PantryItemCard';
import { AddPantryItemDialog } from '@/components/app/AddPantryItemDialog';
import { usePantryItems, PANTRY_CATEGORIES } from '@/hooks/usePantryItems';

export default function PantryPage() {
  const { items, loading, addItem, updateItem, deleteItem } = usePantryItems();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group items by category
  const groupedItems = PANTRY_CATEGORIES.reduce((acc, category) => {
    const categoryItems = filteredItems.filter(item => item.category === category.value);
    if (categoryItems.length > 0) {
      acc.push({ category, items: categoryItems });
    }
    return acc;
  }, [] as { category: typeof PANTRY_CATEGORIES[0]; items: typeof items }[]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">My Pantry</h1>
            <p className="text-muted-foreground">{items.length} staples</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pantry items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Items List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🥫</div>
            <h3 className="font-medium text-lg text-foreground mb-2">Your pantry is empty</h3>
            <p className="text-muted-foreground mb-4">
              Add long-term staples like flour, sugar, spices, and oils
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first item
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items match your search</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map(({ category, items: categoryItems }) => (
              <div key={category.value}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {category.label}
                </h2>
                <div className="space-y-3">
                  {categoryItems.map((item) => (
                    <PantryItemCard
                      key={item.id}
                      item={item}
                      onUpdateQuantity={(id, qty) => updateItem(id, { quantity: qty })}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <AddPantryItemDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onAdd={addItem}
        />
      </div>
    </AppLayout>
  );
}
