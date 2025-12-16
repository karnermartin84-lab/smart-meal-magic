import { Button } from "@/components/ui/button";
import { ArrowRight, Scan, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 md:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm opacity-0 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              <Sparkles size={16} />
              <span>App Design Agency</span>
            </div>
            
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight opacity-0 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              We craft{" "}
              <span className="gradient-text">intelligent apps</span>{" "}
              that users love
            </h1>
            
            <p 
              className="text-lg md:text-xl text-muted-foreground max-w-lg opacity-0 animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              Transform your vision into beautifully designed, user-friendly mobile experiences. 
              Meet SmartMeal — our featured AI-powered meal planning app.
            </p>
            
            <div 
              className="flex flex-wrap gap-4 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              <Button variant="hero" size="lg">
                Start Your Project
                <ArrowRight size={18} />
              </Button>
              <Button variant="heroOutline" size="lg">
                View Case Study
              </Button>
            </div>

            {/* Stats */}
            <div 
              className="flex gap-8 pt-8 border-t border-border opacity-0 animate-fade-up"
              style={{ animationDelay: "0.5s" }}
            >
              <div>
                <div className="text-3xl font-heading font-bold">50+</div>
                <div className="text-muted-foreground text-sm">Apps Launched</div>
              </div>
              <div>
                <div className="text-3xl font-heading font-bold">98%</div>
                <div className="text-muted-foreground text-sm">Client Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-heading font-bold">4.9★</div>
                <div className="text-muted-foreground text-sm">Average Rating</div>
              </div>
            </div>
          </div>

          {/* App Mockup */}
          <div 
            className="relative opacity-0 animate-slide-in-right"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="relative z-10 animate-float">
              {/* Phone Frame */}
              <div className="relative mx-auto w-[280px] md:w-[320px] h-[580px] md:h-[660px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden relative">
                  {/* Phone Screen Content */}
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-6 pt-4 text-xs text-muted-foreground">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-2 bg-foreground rounded-sm" />
                      </div>
                    </div>
                    
                    {/* App Header */}
                    <div className="px-6 pt-6">
                      <h3 className="font-heading font-bold text-lg">SmartMeal</h3>
                      <p className="text-muted-foreground text-sm">Scan & Suggest</p>
                    </div>

                    {/* Scan Area */}
                    <div className="px-6 pt-6">
                      <div className="relative aspect-square bg-secondary rounded-3xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                        <div className="absolute inset-4 border-2 border-primary/20 rounded-2xl animate-pulse" />
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Scan className="w-8 h-8 text-primary" />
                          </div>
                          <p className="text-sm font-medium">Tap to scan your fridge</p>
                          <p className="text-xs text-muted-foreground mt-1">AI will suggest meals</p>
                        </div>
                      </div>
                    </div>

                    {/* Suggested Meals Preview */}
                    <div className="px-6 pt-6">
                      <p className="text-sm font-medium mb-3">Recent suggestions</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-card rounded-xl">
                          <div className="w-12 h-12 rounded-lg bg-accent/20" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Greek Salad Bowl</p>
                            <p className="text-xs text-muted-foreground">320 cal • 25g protein</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-card rounded-xl">
                          <div className="w-12 h-12 rounded-lg bg-primary/20" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Veggie Stir Fry</p>
                            <p className="text-xs text-muted-foreground">280 cal • 18g protein</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -left-4 top-1/4 glass-card p-4 rounded-2xl animate-float-delayed hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Scan className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">AI Scanning</p>
                  <p className="text-xs text-muted-foreground">12 items detected</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/3 glass-card p-4 rounded-2xl animate-float hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-sm">5 Meals Found</p>
                  <p className="text-xs text-muted-foreground">Based on your items</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
