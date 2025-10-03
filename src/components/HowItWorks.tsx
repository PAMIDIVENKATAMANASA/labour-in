import { Search, UserCheck, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Search,
    title: "Post/Find a Job",
    description: "Employers post opportunities. Laborers browse available jobs that match their skills.",
  },
  {
    icon: UserCheck,
    title: "Get Matched Instantly",
    description: "Our platform connects the right talent with the right opportunity in real-time.",
  },
  {
    icon: Zap,
    title: "Get to Work",
    description: "Start working on projects immediately. Fast, efficient, and reliable connections.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="shadow-card hover:shadow-hover transition-slow border-none gradient-card"
            >
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm mb-4">
                  {index + 1}
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
