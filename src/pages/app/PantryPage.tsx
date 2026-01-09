import { useState } from 'react';
import { Plus, Loader2, Search, Receipt } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PantryItemCard } from '@/components/app/PantryItemCard';
import { AddPantryItemDialog } from '@/components/app/AddPantryItemDialog';
import { ReceiptScanner } from '@/components/app/ReceiptScanner';
import { usePantryItems, PANTRY_CATEGORIES } from '@/hooks/usePantryItems';
import { useFridgeItems } from '@/hooks/useFridgeItems';

export default function PantryPage() {
  const { items, loading, addItem, updateItem, deleteItem } = usePantryItems();
  const { addItem: addFridgeItem } = useFridgeItems();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [receiptScannerOpen, setReceiptScannerOpen] = useState(false);
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

  const handleAddToFridge = async (receiptItems: Array<{ name: string; quantity: number; unit: string }>) => {
    for (const item of receiptItems) {
      await addFridgeItem({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        barcode: null,
        brand: null,
        calories_per_serving: 0,
        protein_per_serving: 0,
        carbs_per_serving: 0,
        fat_per_serving: 0,
        serving_size: '100g',
        image_url: null,
        expires_at: null,
      });
    }
  };

  const handleAddToPantry = async (receiptItems: Array<{ name: string; quantity: number; unit: string; category: string }>) => {
    for (const item of receiptItems) {
      await addItem({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">My Pantry</h1>
            <p className="text-muted-foreground">{items.length} staples</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReceiptScannerOpen(true)}>
              <Receipt className="w-4 h-4 mr-2" />
              Scan Receipt
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
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
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setReceiptScannerOpen(true)}>
                <Receipt className="w-4 h-4 mr-2" />
                Scan Receipt
              </Button>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add manually
              </Button>
            </div>
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
        <ReceiptScanner
          open={receiptScannerOpen}
          onClose={() => setReceiptScannerOpen(false)}
          onAddToFridge={handleAddToFridge}
          onAddToPantry={handleAddToPantry}
        />
      </div>
    </AppLayout>
  );
}
