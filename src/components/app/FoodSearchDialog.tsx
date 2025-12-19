import { useState } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { searchFoods, FoodProduct, convertToFridgeItem } from '@/lib/openFoodFacts';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FoodSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: ReturnType<typeof convertToFridgeItem>) => void;
}

export function FoodSearchDialog({ open, onClose, onSelect }: FoodSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const products = await searchFoods(query);
      setResults(products);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: FoodProduct) => {
    const item = convertToFridgeItem(product);
    onSelect(item);
    onClose();
    setQuery('');
    setResults([]);
  };

  const handleClose = () => {
    onClose();
    setQuery('');
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Foods
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search for a food item..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          {results.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">
              {query ? 'No results found. Try a different search.' : 'Enter a food name to search'}
            </p>
          )}

          <div className="space-y-2">
            {results.map((product, index) => (
              <div
                key={`${product.code}-${index}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="w-12 h-12 rounded object-cover bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {product.product_name || 'Unknown Product'}
                  </p>
                  {product.brands && (
                    <p className="text-xs text-muted-foreground truncate">{product.brands}</p>
                  )}
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{Math.round(product.nutriments?.['energy-kcal_100g'] || 0)} kcal</span>
                    <span>•</span>
                    <span>{Math.round(product.nutriments?.proteins_100g || 0)}g protein</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSelect(product)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
