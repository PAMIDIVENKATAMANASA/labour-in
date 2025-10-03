import { Link } from "react-router-dom";
import { Briefcase, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">Skilled Labor</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting skilled hands with local needs, instantly.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">For Workers</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/find-work" className="text-sm text-muted-foreground hover:text-primary transition-base">
                  Find Work
                </Link>
              </li>
              <li>
                <Link to="/dashboard/laborer" className="text-sm text-muted-foreground hover:text-primary transition-base">
                  Laborer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">For Employers</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/hire-talent" className="text-sm text-muted-foreground hover:text-primary transition-base">
                  Hire Talent
                </Link>
              </li>
              <li>
                <Link to="/dashboard/employer" className="text-sm text-muted-foreground hover:text-primary transition-base">
                  Employer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-base">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-base">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-base">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Skilled Labor Platform. All rights reserved.
          </p>
          
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-base">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-base">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-base">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-base">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
