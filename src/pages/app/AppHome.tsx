import { Link } from 'react-router-dom';
import { ShoppingBasket, UtensilsCrossed, ChefHat, ScanLine } from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useFridgeItems } from '@/hooks/useFridgeItems';
import { useMeals } from '@/hooks/useMeals';

export default function AppHome() {
  const { items } = useFridgeItems();
  const { meals } = useMeals();

  const quickActions = [
    { icon: ScanLine, label: 'Scan Item', path: '/app/fridge', color: 'bg-primary/10 text-primary' },
    { icon: ShoppingBasket, label: 'My Fridge', path: '/app/fridge', color: 'bg-accent/10 text-accent-foreground' },
    { icon: UtensilsCrossed, label: 'My Meals', path: '/app/meals', color: 'bg-secondary/10 text-secondary-foreground' },
    { icon: ChefHat, label: 'Get Ideas', path: '/app/suggestions', color: 'bg-green-500/10 text-green-600' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome Back!</h1>
          <p className="text-muted-foreground">What would you like to do today?</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{items.length}</p>
              <p className="text-sm text-muted-foreground">Items in Fridge</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent-foreground">{meals.length}</p>
              <p className="text-sm text-muted-foreground">Saved Meals</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map(({ icon: Icon, label, path, color }) => (
            <Link key={label} to={path}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-foreground">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
