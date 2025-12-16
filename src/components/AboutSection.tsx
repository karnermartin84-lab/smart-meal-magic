import { Lightbulb, Users, Zap } from "lucide-react";

const AboutSection = () => {
  const features = [
    {
      icon: Lightbulb,
      title: "Innovation First",
      description: "We push boundaries with cutting-edge AI and intuitive design patterns.",
    },
    {
      icon: Users,
      title: "User-Centered",
      description: "Every decision is guided by deep user research and testing.",
    },
    {
      icon: Zap,
      title: "Rapid Delivery",
      description: "From concept to App Store in weeks, not months.",
    },
  ];

  return (
    <section id="about" className="section-padding bg-secondary/30">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-6">
            <span className="text-primary font-semibold">About Smart Meal</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading">
              We design apps that{" "}
              <span className="gradient-text">solve real problems</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Smart Meal is a boutique app design agency specializing in intelligent, 
              user-friendly mobile experiences. We combine stunning visual design 
              with powerful AI capabilities to create apps that genuinely improve 
              people's lives.
            </p>
            <p className="text-muted-foreground">
              Our team of designers, developers, and AI specialists work closely 
              with clients to transform ambitious ideas into polished, market-ready 
              applications. SmartMeal is our flagship showcase — demonstrating how 
              we blend innovative technology with delightful user experiences.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card p-6 hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
