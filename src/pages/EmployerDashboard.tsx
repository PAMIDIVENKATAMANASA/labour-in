import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Users, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockJobPostings = [
  {
    id: 1,
    jobTitle: "Plumbing Installation",
    jobStatus: "active",
    applicants: 12
  },
  {
    id: 2,
    jobTitle: "Electrical Wiring",
    jobStatus: "active",
    applicants: 8
  },
  {
    id: 3,
    jobTitle: "House Painting",
    jobStatus: "closed",
    applicants: 15
  }
];

const EmployerDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Employer Dashboard</h1>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr,350px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">My Job Postings</h2>
              <Button variant="action" className="gap-2">
                <Plus className="h-4 w-4" />
                Post New Job
              </Button>
            </div>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Applicants</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockJobPostings.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.jobTitle}</TableCell>
                        <TableCell>
                          <Badge variant={job.jobStatus === "active" ? "default" : "secondary"}>
                            {job.jobStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{job.applicants}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post Job CTA */}
            <Card className="shadow-card gradient-hero text-primary-foreground">
              <CardContent className="p-6 text-center space-y-4">
                <Plus className="h-12 w-12 mx-auto" />
                <h3 className="text-xl font-bold">Post a New Job</h3>
                <p className="text-sm opacity-90">
                  Find the perfect skilled worker for your next project
                </p>
                <Button variant="secondary" size="lg" className="w-full">
                  Create Job Post
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  View Applicants
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Manage Payments
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Jobs</span>
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Applicants</span>
                  <span className="text-2xl font-bold text-foreground">20</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed Projects</span>
                  <span className="text-2xl font-bold text-secondary">5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
