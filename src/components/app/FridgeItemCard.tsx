import { useState } from 'react';
import { Trash2, Minus, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FridgeItem } from '@/hooks/useFridgeItems';
import { cn } from '@/lib/utils';

interface FridgeItemCardProps {
  item: FridgeItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (item: FridgeItem) => void;
}

export function FridgeItemCard({
  item,
  onUpdateQuantity,
  onDelete,
  selectable,
  selected,
  onSelect
}: FridgeItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (delta: number) => {
    const newQuantity = Math.max(0.1, item.quantity + delta);
    setIsUpdating(true);
    await onUpdateQuantity(item.id, newQuantity);
    setIsUpdating(false);
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        selectable && 'cursor-pointer hover:border-primary',
        selected && 'border-primary bg-primary/5'
      )}
      onClick={() => selectable && onSelect?.(item)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-16 h-16 rounded-lg object-cover bg-muted flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{item.name}</h3>
            {item.brand && (
              <p className="text-sm text-muted-foreground truncate">{item.brand}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {item.calories_per_serving} kcal
              </span>
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground">
                P: {item.protein_per_serving}g
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary-foreground">
                C: {item.carbs_per_serving}g
              </span>
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                F: {item.fat_per_serving}g
              </span>
            </div>
          </div>

          {!selectable && (
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!selectable && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Qty: {item.quantity} {item.unit}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(-0.5);
                }}
                disabled={isUpdating}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-12 text-center font-medium">{item.quantity}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(0.5);
                }}
                disabled={isUpdating}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
