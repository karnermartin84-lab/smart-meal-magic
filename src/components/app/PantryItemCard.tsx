import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PantryItem, PANTRY_CATEGORIES } from '@/hooks/usePantryItems';

interface PantryItemCardProps {
  item: PantryItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onDelete: (id: string) => void;
}

export function PantryItemCard({ item, onUpdateQuantity, onDelete }: PantryItemCardProps) {
  const categoryLabel = PANTRY_CATEGORIES.find(c => c.value === item.category)?.label || 'Other';

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-12 h-12 rounded-lg object-cover bg-muted"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xl">
            🥫
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-foreground truncate">{item.name}</h3>
              {item.brand && (
                <p className="text-xs text-muted-foreground">{item.brand}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {categoryLabel}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {item.quantity} {item.unit}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {item.calories_per_serving} kcal/{item.serving_size}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {item.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
