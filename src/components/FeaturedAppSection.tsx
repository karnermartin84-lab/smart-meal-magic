import { 
  Scan, 
  Salad, 
  Calendar, 
  ShoppingCart, 
  Activity, 
  Recycle, 
  Share2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FeaturedAppSection = () => {
  const features = [
    {
      icon: Scan,
      title: "Scan & Suggest",
      description: "Point your camera at your fridge or pantry. Our AI instantly recognizes ingredients and suggests healthy meals you can make.",
      highlight: true,
    },
    {
      icon: Salad,
      title: "Nutrition Tracking",
      description: "Every meal shows macros, calories, and portion sizes. Stay on track with your health goals effortlessly.",
    },
    {
      icon: Calendar,
      title: "Weekly Meal Plans",
      description: "Automatically generated meal plans tailored to your preferences — vegan, keto, gluten-free, and more.",
    },
    {
      icon: ShoppingCart,
      title: "Smart Grocery Lists",
      description: "One tap creates a shopping list based on your selected meals. Never forget an ingredient again.",
    },
    {
      icon: Activity,
      title: "Fitness Integration",
      description: "Syncs with fitness trackers to recommend meals based on your activity level and calorie needs.",
    },
    {
      icon: Recycle,
      title: "Leftover Optimizer",
      description: "Don't waste food. Get creative recipes to use up remaining ingredients before they spoil.",
    },
  ];

  return (
    <section id="app" className="section-padding">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold">Featured App</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mt-4 mb-6">
            Meet <span className="gradient-text">SmartMeal</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            The intelligent meal planning app that transforms how you cook. 
            Simply scan what you have, and let AI handle the rest.
          </p>
        </div>

        {/* Main Feature Highlight */}
        <div className="glass-card p-8 md:p-12 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
          
          <div className="grid md:grid-cols-2 gap-8 items-center relative">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                <Scan size={14} />
                Core Feature
              </div>
              <h3 className="text-2xl md:text-3xl font-heading font-bold">
                Scan & Suggest Technology
              </h3>
              <p className="text-muted-foreground text-lg">
                Our proprietary AI can identify over 5,000 food items in real-time. 
                Just open your fridge, scan with your phone, and watch as SmartMeal 
                instantly generates personalized, healthy meal suggestions based 
                exactly on what you have available.
              </p>
              <ul className="space-y-3">
                {["Real-time ingredient recognition", "5,000+ food items in database", "Instant meal suggestions", "Dietary preference matching"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-primary" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="hero">
                See It In Action
              </Button>
            </div>

            {/* Scan Demo Visual */}
            <div className="relative">
              <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-secondary to-muted rounded-3xl p-8 relative overflow-hidden">
                {/* Scan lines animation */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute left-0 right-0 h-0.5 bg-primary/50 animate-pulse" style={{ top: '30%' }} />
                  <div className="absolute left-0 right-0 h-0.5 bg-primary/30 animate-pulse" style={{ top: '50%', animationDelay: '0.5s' }} />
                  <div className="absolute left-0 right-0 h-0.5 bg-primary/50 animate-pulse" style={{ top: '70%', animationDelay: '1s' }} />
                </div>

                {/* Food items */}
                <div className="relative h-full flex flex-wrap items-center justify-center gap-4">
                  {["🥬", "🍅", "🥕", "🧀", "🥚", "🍗"].map((emoji, i) => (
                    <div 
                      key={i}
                      className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center text-3xl shadow-lg animate-float"
                      style={{ animationDelay: `${i * 0.3}s` }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>

                {/* Results popup */}
                <div className="absolute bottom-4 left-4 right-4 glass-card p-4 rounded-2xl">
                  <p className="text-sm font-medium mb-2">6 ingredients detected!</p>
                  <p className="text-xs text-muted-foreground">3 healthy meals available</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`glass-card p-6 hover-lift ${
                feature.highlight ? "ring-2 ring-primary/20" : ""
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                feature.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              }`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Social Feature */}
        <div className="mt-12 glass-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
              <Share2 className="w-8 h-8 text-accent" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-heading font-bold text-xl mb-2">
                Share Your Creations
              </h3>
              <p className="text-muted-foreground">
                Proud of a meal you made? Share your recipes and photos with friends, 
                or discover new favorites from the SmartMeal community.
              </p>
            </div>
            <Button variant="accent" className="shrink-0">
              Join Community
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedAppSection;
