import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Bell, User, Wrench, FileText } from "lucide-react";
import JobCard from "@/components/JobCard";

const mockJobs = [
  {
    jobTitle: "Plumbing Installation",
    companyName: "ABC Construction Co.",
    location: "New York, NY",
    paymentType: "Hourly",
    budgetMax: 45,
    postedTime: "2 hours ago"
  },
  {
    jobTitle: "Electrical Wiring",
    companyName: "Tech Builders Inc.",
    location: "Brooklyn, NY",
    paymentType: "Project",
    budgetMax: 2500,
    postedTime: "5 hours ago"
  },
  {
    jobTitle: "House Painting",
    companyName: "Home Improvement LLC",
    location: "Queens, NY",
    paymentType: "Hourly",
    budgetMax: 35,
    postedTime: "1 day ago"
  }
];

const LaborerDashboard = () => {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Laborer Dashboard</h1>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr,350px] gap-6">
          {/* Main Content */}
          <div>
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="new">New Jobs</TabsTrigger>
                <TabsTrigger value="applied">Applied Jobs</TabsTrigger>
                <TabsTrigger value="history">Work History</TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="space-y-4">
                {mockJobs.map((job, index) => (
                  <JobCard key={index} {...job} />
                ))}
              </TabsContent>

              <TabsContent value="applied" className="space-y-4">
                <Card className="shadow-card">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No applications yet</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card className="shadow-card">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No work history</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-3">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-foreground">John Doe</h3>
                  <p className="text-sm text-muted-foreground">Plumber</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Profile Completeness</span>
                    <span className="font-medium text-primary">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Availability Toggle */}
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="availability" className="text-base font-semibold">
                      Availability
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isAvailable ? "Available for work" : "Not available"}
                    </p>
                  </div>
                  <Switch
                    id="availability"
                    checked={isAvailable}
                    onCheckedChange={setIsAvailable}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Wrench className="mr-2 h-4 w-4" />
                  Manage Skills
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <FileText className="mr-2 h-4 w-4" />
                  View Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaborerDashboard;
