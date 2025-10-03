import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Clock } from "lucide-react";

interface JobCardProps {
  jobTitle: string;
  companyName: string;
  location: string;
  paymentType: string;
  budgetMax: number;
  postedTime?: string;
  jobStatus?: string;
}

const JobCard = ({
  jobTitle,
  companyName,
  location,
  paymentType,
  budgetMax,
  postedTime = "2 hours ago",
  jobStatus = "active"
}: JobCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-hover transition-slow border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {jobTitle}
            </h3>
            <p className="text-sm text-muted-foreground">{companyName}</p>
          </div>
          <Badge variant={jobStatus === "active" ? "default" : "secondary"}>
            {jobStatus}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            {location}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 text-secondary" />
            Up to ${budgetMax.toLocaleString()} • {paymentType}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Posted {postedTime}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0">
        <Button variant="default" className="w-full">
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
