import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Users, Briefcase, Settings, CheckCircle, Clock } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr,350px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold text-foreground">5,247</p>
                    </div>
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Jobs</p>
                      <p className="text-3xl font-bold text-foreground">1,032</p>
                    </div>
                    <Briefcase className="h-10 w-10 text-secondary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Approvals</p>
                      <p className="text-3xl font-bold text-foreground">23</p>
                    </div>
                    <Clock className="h-10 w-10 text-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Approvals */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Pending Profile Approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold text-foreground">John Doe</h4>
                      <p className="text-sm text-muted-foreground">Plumber • Applied 2 hours ago</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Job Postings */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Job Postings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 border-l-4 border-l-primary rounded">
                    <div>
                      <h4 className="font-medium text-foreground">Electrical Wiring Project</h4>
                      <p className="text-sm text-muted-foreground">ABC Construction • Posted 3 hours ago</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Management Links */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>System Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Manage Job Posts
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Button>
              </CardContent>
            </Card>

            {/* Platform Statistics */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Laborers</span>
                    <span className="font-semibold">4,523</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Employers</span>
                    <span className="font-semibold">724</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Coordinators</span>
                    <span className="font-semibold">45</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
