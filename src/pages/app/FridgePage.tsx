import { useState } from 'react';
import { Plus, ScanLine, Search, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { FridgeItemCard } from '@/components/app/FridgeItemCard';
import { BarcodeScanner } from '@/components/app/BarcodeScanner';
import { FoodSearchDialog } from '@/components/app/FoodSearchDialog';
import { AddItemDialog } from '@/components/app/AddItemDialog';
import { useFridgeItems } from '@/hooks/useFridgeItems';
import { lookupBarcode, convertToFridgeItem } from '@/lib/openFoodFacts';
import { useToast } from '@/hooks/use-toast';

export default function FridgePage() {
  const { items, loading, addItem, updateItem, deleteItem } = useFridgeItems();
  const { toast } = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scannedItem, setScannedItem] = useState<ReturnType<typeof convertToFridgeItem> | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const handleBarcodeScan = async (barcode: string) => {
    setLookingUp(true);
    setAddDialogOpen(true);
    
    const product = await lookupBarcode(barcode);
    setLookingUp(false);
    
    if (product) {
      setScannedItem(convertToFridgeItem(product));
    } else {
      toast({
        title: 'Product not found',
        description: 'You can add it manually',
        variant: 'destructive'
      });
      setScannedItem({ barcode, name: '', brand: null, quantity: 1, unit: 'serving', calories_per_serving: 0, protein_per_serving: 0, carbs_per_serving: 0, fat_per_serving: 0, serving_size: '100g', image_url: null, expires_at: null });
    }
  };

  const handleAddItem = async (item: any) => {
    await addItem(item);
    setScannedItem(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">My Fridge</h1>
            <p className="text-muted-foreground">{items.length} items</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={() => setScannerOpen(true)} className="flex-1">
            <ScanLine className="w-4 h-4 mr-2" />
            Scan Barcode
          </Button>
          <Button variant="outline" onClick={() => setSearchOpen(true)}>
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => { setScannedItem(null); setAddDialogOpen(true); }}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your fridge is empty</p>
            <Button onClick={() => setScannerOpen(true)}>
              <ScanLine className="w-4 h-4 mr-2" />
              Scan your first item
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <FridgeItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={(id, qty) => updateItem(id, { quantity: qty })}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}

        <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleBarcodeScan} />
        <FoodSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={(item) => { setScannedItem(item); setAddDialogOpen(true); setSearchOpen(false); }} />
        <AddItemDialog open={addDialogOpen} onClose={() => { setAddDialogOpen(false); setScannedItem(null); }} onAdd={handleAddItem} initialData={scannedItem || undefined} loading={lookingUp} />
      </div>
    </AppLayout>
  );
}
