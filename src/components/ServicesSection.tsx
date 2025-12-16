import { 
  Palette, 
  Smartphone, 
  Code, 
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ServicesSection = () => {
  const services = [
    {
      icon: Palette,
      title: "UI/UX Design",
      description: "Beautiful, intuitive interfaces that users love. We create designs that are both stunning and functional.",
      features: ["User Research", "Wireframing", "Visual Design", "Prototyping"],
    },
    {
      icon: Smartphone,
      title: "App Prototyping",
      description: "Interactive prototypes that bring your vision to life. Test and validate ideas before development.",
      features: ["Interactive Mockups", "User Testing", "Iteration", "Handoff"],
    },
    {
      icon: Code,
      title: "App Development",
      description: "Full-stack mobile development for iOS and Android. From MVP to App Store launch.",
      features: ["Native & Cross-Platform", "API Integration", "Testing", "Deployment"],
    },
    {
      icon: MessageSquare,
      title: "Consultation",
      description: "Strategic guidance for your app journey. From ideation to market positioning.",
      features: ["Strategy Sessions", "Market Analysis", "Tech Stack Advice", "Growth Planning"],
    },
  ];

  return (
    <section id="services" className="section-padding bg-secondary/30">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold">Our Services</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mt-4 mb-6">
            Everything you need to{" "}
            <span className="gradient-text">launch your app</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From initial concept to App Store success, we provide comprehensive 
            design and development services tailored to your vision.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="glass-card p-8 hover-lift group"
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <service.icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-xl mb-3">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 bg-secondary rounded-full text-sm text-secondary-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button variant="hero" size="lg">
            View Our Process
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
