import { Link } from 'react-router-dom';
import { 
  ShoppingBasket, 
  UtensilsCrossed, 
  ChefHat, 
  ScanLine, 
  CalendarDays,
  Package,
  TrendingUp,
  Clock,
  Flame,
  Apple
} from 'lucide-react';
import { AppLayout } from '@/components/app/AppLayout';
import { useFridgeItems } from '@/hooks/useFridgeItems';
import { useMeals } from '@/hooks/useMeals';
import { usePantryItems } from '@/hooks/usePantryItems';
import { cn } from '@/lib/utils';

export default function AppHome() {
  const { items: fridgeItems } = useFridgeItems();
  const { meals } = useMeals();
  const { items: pantryItems } = usePantryItems();

  // Calculate some stats
  const expiringItems = fridgeItems.filter(item => {
    if (!item.expires_at) return false;
    const daysUntilExpiry = Math.ceil((new Date(item.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  });

  const totalCaloriesAvailable = [...fridgeItems, ...pantryItems].reduce((sum, item) => {
    return sum + (item.calories_per_serving || 0) * (item.quantity || 1);
  }, 0);

  const quickActions = [
    { icon: ScanLine, label: 'Scan Item', path: '/app/fridge', color: 'from-primary to-primary/70' },
    { icon: ShoppingBasket, label: 'My Fridge', path: '/app/fridge', color: 'from-emerald-500 to-emerald-400' },
    { icon: ChefHat, label: 'AI Chef', path: '/app/chef', color: 'from-accent to-orange-400' },
    { icon: CalendarDays, label: 'Meal Plan', path: '/app/plan', color: 'from-violet-500 to-purple-400' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">
            Good {getTimeOfDay()}! 👋
          </h1>
          <p className="text-muted-foreground">Here's your kitchen overview</p>
        </div>

        {/* Stats Grid - 3 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fridge Status Widget */}
          <div className="widget-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <ShoppingBasket className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fridge Items</p>
                <p className="text-2xl font-bold text-foreground">{fridgeItems.length}</p>
              </div>
            </div>
            {expiringItems.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4" />
                <span>{expiringItems.length} item{expiringItems.length > 1 ? 's' : ''} expiring soon</span>
              </div>
            )}
          </div>

          {/* Pantry Status Widget */}
          <div className="widget-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pantry Items</p>
                <p className="text-2xl font-bold text-foreground">{pantryItems.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Apple className="w-4 h-4" />
              <span>Well stocked</span>
            </div>
          </div>

          {/* Meals Widget */}
          <div className="widget-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saved Meals</p>
                <p className="text-2xl font-bold text-foreground">{meals.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary">
              <TrendingUp className="w-4 h-4" />
              <span>Ready to cook</span>
            </div>
          </div>
        </div>

        {/* Calories Overview Widget - Full width */}
        <div className="widget-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Calories</p>
                <p className="text-3xl font-bold text-foreground">{totalCaloriesAvailable.toLocaleString()}</p>
              </div>
            </div>
            <Link 
              to="/app/suggestions" 
              className="text-sm text-primary hover:underline font-medium"
            >
              Get meal ideas →
            </Link>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalCaloriesAvailable / 10000) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Based on items in your fridge and pantry</p>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map(({ icon: Icon, label, path, color }) => (
              <Link key={label} to={path}>
                <div className="widget-card p-5 flex flex-col items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center transition-transform group-hover:scale-110",
                    color
                  )}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="font-medium text-foreground text-sm">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity / Tips Widget */}
        <div className="widget-card p-6">
          <h3 className="font-semibold text-foreground mb-3">💡 Smart Tip</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You have {fridgeItems.length + pantryItems.length} ingredients available. 
            Ask the AI Chef to create a delicious meal using what you already have!
          </p>
          <Link 
            to="/app/chef"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ChefHat className="w-4 h-4" />
            Talk to AI Chef
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
