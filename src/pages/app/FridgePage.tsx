import { useState } from 'react';
import { Plus, ScanLine, Search, Loader2, Camera, Receipt } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { FridgeItemCard } from '@/components/app/FridgeItemCard';
import { BarcodeScanner } from '@/components/app/BarcodeScanner';
import { FoodSearchDialog } from '@/components/app/FoodSearchDialog';
import { AddItemDialog } from '@/components/app/AddItemDialog';
import { FridgePhotoScanner } from '@/components/app/FridgePhotoScanner';
import { FridgeSuggestionsDialog } from '@/components/app/FridgeSuggestionsDialog';
import { ReceiptScanner } from '@/components/app/ReceiptScanner';
import { useFridgeItems } from '@/hooks/useFridgeItems';
import { usePantryItems } from '@/hooks/usePantryItems';
import { lookupBarcode, convertToFridgeItem } from '@/lib/openFoodFacts';
import { useToast } from '@/hooks/use-toast';

interface FoodSuggestion {
  name: string;
  confidence: number;
  quantity: number;
  unit: string;
}

export default function FridgePage() {
  const { items, loading, addItem, updateItem, deleteItem } = useFridgeItems();
  const { addItem: addPantryItem } = usePantryItems();
  const { toast } = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [photoScannerOpen, setPhotoScannerOpen] = useState(false);
  const [receiptScannerOpen, setReceiptScannerOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [photoSuggestions, setPhotoSuggestions] = useState<FoodSuggestion[]>([]);
  const [photoNotes, setPhotoNotes] = useState<string | null>(null);
  const [scannedItem, setScannedItem] = useState<ReturnType<typeof convertToFridgeItem> | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const handleAddToFridge = async (receiptItems: Array<{ name: string; quantity: number; unit: string }>) => {
    for (const item of receiptItems) {
      await addItem({
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
      await addPantryItem({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
      });
    }
  };

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

  const handlePhotoSuggestions = (suggestions: FoodSuggestion[], notes: string | null) => {
    setPhotoSuggestions(suggestions);
    setPhotoNotes(notes);
    setSuggestionsOpen(true);
  };

  const handleConfirmSuggestions = async (fridgeItems: any[]) => {
    let addedCount = 0;
    for (const item of fridgeItems) {
      const result = await addItem(item);
      if (result) addedCount++;
    }
    setSuggestionsOpen(false);
    setPhotoSuggestions([]);
    setPhotoNotes(null);
    
    if (addedCount > 0) {
      toast({
        title: `Added ${addedCount} item${addedCount !== 1 ? 's' : ''}`,
        description: 'Items have been added to your fridge'
      });
    }
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
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setReceiptScannerOpen(true)} className="flex-1">
            <Receipt className="w-4 h-4 mr-2" />
            Scan Receipt
          </Button>
          <Button variant="outline" onClick={() => setPhotoScannerOpen(true)} className="flex-1">
            <Camera className="w-4 h-4 mr-2" />
            Photo Scan
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)} className="flex-1">
            <ScanLine className="w-4 h-4 mr-2" />
            Barcode
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
        <FridgePhotoScanner 
          open={photoScannerOpen} 
          onClose={() => setPhotoScannerOpen(false)} 
          onSuggestionsReceived={handlePhotoSuggestions} 
        />
        <FridgeSuggestionsDialog
          open={suggestionsOpen}
          onClose={() => { setSuggestionsOpen(false); setPhotoSuggestions([]); setPhotoNotes(null); }}
          suggestions={photoSuggestions}
          notes={photoNotes}
          onConfirm={handleConfirmSuggestions}
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
