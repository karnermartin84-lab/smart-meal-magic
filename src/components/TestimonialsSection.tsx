import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CEO, FitLife",
      company: "FitLife App",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      content: "Smart Meal transformed our fitness app vision into reality. The AI integration was seamless, and our user engagement increased by 340% after launch. Truly exceptional work.",
      rating: 5,
    },
    {
      name: "Marcus Johnson",
      role: "Founder",
      company: "GreenCart",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "Working with Smart Meal felt like having an extension of our own team. They understood our eco-friendly mission and delivered an app that our customers absolutely love.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Product Lead",
      company: "MindfulMe",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "The attention to detail in both design and functionality was outstanding. Smart Meal delivered ahead of schedule and exceeded all our expectations. Highly recommend!",
      rating: 5,
    },
  ];

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="section-padding">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold">Testimonials</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mt-4 mb-6">
            Trusted by{" "}
            <span className="gradient-text">innovative teams</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it. Here's what our clients say about 
            working with Smart Meal.
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-12 relative">
            {/* Quote mark */}
            <div className="absolute top-8 left-8 text-8xl font-heading text-primary/10 leading-none">
              "
            </div>

            <div className="relative">
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Content */}
              <p className="text-xl md:text-2xl text-foreground mb-8 leading-relaxed">
                "{testimonials[activeIndex].content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonials[activeIndex].image}
                  alt={testimonials[activeIndex].name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <p className="font-heading font-bold">
                    {testimonials[activeIndex].name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {testimonials[activeIndex].role} at {testimonials[activeIndex].company}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-8 border-t border-border">
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === activeIndex ? "bg-primary" : "bg-border"
                    }`}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevTestimonial}
                  className="rounded-full"
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextTestimonial}
                  className="rounded-full"
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Client Logos */}
        <div className="mt-16">
          <p className="text-center text-muted-foreground mb-8">
            Trusted by forward-thinking companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50">
            {["TechCorp", "InnovateCo", "FutureApps", "DigitalFirst", "SmartSolutions"].map((company) => (
              <div key={company} className="font-heading font-bold text-xl text-muted-foreground">
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
