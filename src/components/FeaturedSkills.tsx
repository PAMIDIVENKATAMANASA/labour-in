import { Wrench, Zap, PaintBucket, HardHat, Hammer, Pipette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const skills = [
  { icon: Wrench, name: "Plumbing", count: "250+ Jobs" },
  { icon: Zap, name: "Electrical", count: "180+ Jobs" },
  { icon: PaintBucket, name: "Painting", count: "150+ Jobs" },
  { icon: HardHat, name: "Construction", count: "320+ Jobs" },
  { icon: Hammer, name: "Carpentry", count: "200+ Jobs" },
  { icon: Pipette, name: "HVAC", count: "140+ Jobs" },
];

const FeaturedSkills = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Popular Skills in Demand
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse thousands of opportunities across various skilled trades
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          {skills.map((skill, index) => (
            <Card 
              key={index}
              className="shadow-card hover:shadow-hover transition-slow cursor-pointer border-2 hover:border-primary"
            >
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <skill.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {skill.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {skill.count}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSkills;
