import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ChefHat, CalendarPlus, Loader2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAIChefChat, ChatMessage, MealData } from '@/hooks/useAIChefChat';
import { FridgeItem } from '@/hooks/useFridgeItems';
import { PantryItem } from '@/hooks/usePantryItems';
import { cn } from '@/lib/utils';

interface AIChefChatProps {
  open: boolean;
  onClose: () => void;
  fridgeItems: FridgeItem[];
  pantryItems: PantryItem[];
  onAddToMealPlan: (meal: MealData) => void;
}

function MealCard({ meal, onAddToPlan }: { meal: MealData; onAddToPlan: () => void }) {
  return (
    <Card className="p-4 mt-3 bg-card/50 border-primary/20">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-semibold text-foreground">{meal.name}</h4>
          <p className="text-sm text-muted-foreground">{meal.description}</p>
        </div>
        <Badge variant="secondary">{meal.cookingStyle}</Badge>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          🔥 {meal.totalMacros.calories} kcal
        </Badge>
        <Badge variant="outline" className="text-xs">
          💪 {meal.totalMacros.protein}g protein
        </Badge>
        <Badge variant="outline" className="text-xs">
          🍞 {meal.totalMacros.carbs}g carbs
        </Badge>
        <Badge variant="outline" className="text-xs">
          🧈 {meal.totalMacros.fat}g fat
        </Badge>
      </div>

      <details className="mb-3">
        <summary className="text-sm font-medium cursor-pointer text-primary hover:underline">
          View ingredients & instructions
        </summary>
        <div className="mt-2 space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Ingredients</p>
            <ul className="text-sm list-disc list-inside">
              {meal.ingredients.map((ing, i) => (
                <li key={i}>{ing.quantity} {ing.unit} {ing.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Instructions</p>
            <ol className="text-sm list-decimal list-inside">
              {meal.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </details>

      <Button onClick={onAddToPlan} size="sm" className="w-full">
        <CalendarPlus className="w-4 h-4 mr-2" />
        Add to Meal Plan
      </Button>
    </Card>
  );
}

function MessageBubble({
  message,
  onAddToPlan,
}: {
  message: ChatMessage;
  onAddToPlan: (meal: MealData) => void;
}) {
  const isUser = message.role === 'user';

  // Remove the JSON block from displayed content if meal data was extracted
  const displayContent = message.mealData
    ? message.content.replace(/```json\n?[\s\S]*?\n?```/, '').trim()
    : message.content;

  return (
    <div className={cn('flex gap-3 mb-4', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-primary' : 'bg-gradient-to-br from-orange-400 to-red-500'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <ChefHat className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={cn('max-w-[80%]', isUser && 'text-right')}>
        <div className={cn(
          'rounded-2xl px-4 py-2 inline-block',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}>
          <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
        </div>

        {message.mealData && (
          <MealCard meal={message.mealData} onAddToPlan={() => onAddToPlan(message.mealData!)} />
        )}

        <p className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export function AIChefChat({ open, onClose, fridgeItems, pantryItems, onAddToMealPlan }: AIChefChatProps) {
  const { messages, isLoading, sendMessage, clearMessages } = useAIChefChat();
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage(input.trim(), fridgeItems, pantryItems);
    setInput('');
  };

  const handleAddToPlan = (meal: MealData) => {
    onAddToMealPlan(meal);
  };

  const quickPrompts = [
    "Make me a 1000 calorie lunch using chicken",
    "What can I make for dinner tonight?",
    "Give me a high-protein breakfast idea",
    "I want something indulgent and hearty",
  ];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-left">Personal Chef AI</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about cooking!
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearMessages}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Hi! I'm your Personal Chef AI</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Tell me what you're craving, your calorie goals, or just ask for ideas. I can see your fridge ({fridgeItems.length} items) and pantry ({pantryItems.length} items)!
              </p>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickPrompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onAddToPlan={handleAddToPlan}
              />
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="px-6 py-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about meals, recipes, or cooking tips..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
