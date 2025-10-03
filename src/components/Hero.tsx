import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Briefcase } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-5"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Connecting Skilled Hands with{" "}
            <span className="text-primary">Local Needs</span>, Instantly
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Real-time job alerts for laborers and reliable talent for employers.
            Start connecting today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full sm:w-auto"
              asChild
            >
              <Link to="/dashboard/laborer" className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                I'm a Laborer, Find a Job
              </Link>
            </Button>
            
            <Button 
              variant="action" 
              size="lg" 
              className="w-full sm:w-auto"
              asChild
            >
              <Link to="/dashboard/employer" className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                I'm an Employer, Post a Job
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">1000+</div>
              <div className="text-sm text-muted-foreground">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">5000+</div>
              <div className="text-sm text-muted-foreground">Skilled Workers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">98%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
