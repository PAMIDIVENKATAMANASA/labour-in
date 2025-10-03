import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, UserPlus, Users, Activity } from "lucide-react";

const CoordinatorDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Coordinator Dashboard</h1>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr,350px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Search Bar */}
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for laborers you manage..."
                      className="pl-10"
                    />
                  </div>
                  <Button variant="default">Search</Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    laborer: "John Smith",
                    action: "Applied to Plumbing Installation job",
                    time: "2 hours ago"
                  },
                  {
                    laborer: "Sarah Johnson",
                    action: "Profile updated with new certification",
                    time: "5 hours ago"
                  },
                  {
                    laborer: "Mike Wilson",
                    action: "Completed Electrical Wiring project",
                    time: "1 day ago"
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-base">
                    <Activity className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{activity.laborer}</h4>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Managed Laborers */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Managed Laborers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "John Smith", skill: "Plumber", status: "Active", jobs: 12 },
                  { name: "Sarah Johnson", skill: "Electrician", status: "Active", jobs: 8 },
                  { name: "Mike Wilson", skill: "Carpenter", status: "Available", jobs: 15 },
                  { name: "Emily Brown", skill: "Painter", status: "On Project", jobs: 6 }
                ].map((laborer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{laborer.name}</h4>
                        <p className="text-sm text-muted-foreground">{laborer.skill} • {laborer.jobs} jobs completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary font-medium">
                        {laborer.status}
                      </span>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Register New Laborer CTA */}
            <Card className="shadow-card gradient-hero text-primary-foreground">
              <CardContent className="p-6 text-center space-y-4">
                <UserPlus className="h-12 w-12 mx-auto" />
                <h3 className="text-xl font-bold">Register New Laborer</h3>
                <p className="text-sm opacity-90">
                  Add a new skilled worker to your managed group
                </p>
                <Button variant="secondary" size="lg" className="w-full">
                  Register Laborer
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  View Managed Profiles
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Activity className="mr-2 h-4 w-4" />
                  Activity Report
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Your Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Managed Laborers</span>
                  <span className="text-2xl font-bold text-primary">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Workers</span>
                  <span className="text-2xl font-bold text-secondary">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Applications</span>
                  <span className="text-2xl font-bold text-foreground">156</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
