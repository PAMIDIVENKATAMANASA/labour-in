import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell,Users, Briefcase, Settings, AlertCircle, Loader2, MessageSquare, Clock, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api"; 
import { useNavigate } from "react-router-dom";

// --- 1. Type Definitions matching the enhanced Coordinator API response ---
type CoordinatorDashboardStats = {
  total_users: number
  total_jobs: number
  total_laborers: number
  total_employers: number
  disputed_projects: number
  pending_employer_verification: number
  long_pending_applications: number
  unread_notifications: number
}

// --- Component Definition ---
const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  
  // --- 2. Fetch Coordinator Dashboard Stats ---
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<CoordinatorDashboardStats>({
    queryKey: ["coordinatorDashboardStats"],
    queryFn: () => apiFetch<CoordinatorDashboardStats>("dashboard/"),
  });

  // Helper to render stat cards
  const renderStatCard = (title: string, value: number, Icon: React.ElementType, colorClass: string) => (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoadingStats ? (
              <div className="bg-muted h-8 w-16 rounded mt-1 animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
            )}
          </div>
          <Icon className={`h-10 w-10 ${colorClass}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoadingStats) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-3 text-lg text-foreground">Loading Coordinator Dashboard...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          <h1 className="text-xl font-bold text-foreground">Coordinator Dashboard</h1>
          <Button variant="ghost" size="icon">
             {/* Dynamic Notification Bell - Assuming you have this component logic */}
             <Bell className="h-5 w-5" />
             {stats && stats.unread_notifications > 0 && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {statsError && (
            <div className="p-4 mb-4 border border-destructive bg-red-50 text-destructive rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5"/>
                <p className="text-sm font-medium">Error loading dashboard stats: {statsError.message}</p>
            </div>
        )}
        
        <div className="grid lg:grid-cols-[1fr,350px] gap-6">
          {/* Left: Support Metrics & Tasks */}
          <div className="space-y-6">
            {/* Critical Oversight Stats Grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {renderStatCard("Disputed Projects", stats?.disputed_projects ?? 0, MessageSquare, "text-red-500")}
              {renderStatCard("Pending Verification", stats?.pending_employer_verification ?? 0, ShieldCheck, "text-yellow-500")}
              {renderStatCard("Long Pending Apps", stats?.long_pending_applications ?? 0, Clock, "text-orange-500")}
            </div>

            {/* Task List: Disputed Projects (Placeholder for a table/list component) */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Projects Requiring Mediation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    Your primary tasks involve resolving disputes ({stats?.disputed_projects.toLocaleString() ?? 0} currently) and following up on long-pending applications.
                  </p>
                  <Button variant="action" onClick={() => navigate('/coordinator/disputes')}>
                    View All Disputes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Task List: Verification Queue (Placeholder for a table/list component) */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Employer Verification Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    {stats?.pending_employer_verification.toLocaleString() ?? 0} employer profiles are awaiting verification to ensure platform trust.
                  </p>
                  <Button variant="action" onClick={() => navigate('/coordinator/verification')}>
                    Review Employers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Quick Management Links */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Oversight Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate('/coordinator/users/laborer')}>
                  <Users className="mr-2 h-4 w-4" />
                  Laborer Directory
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate('/coordinator/jobs/all')}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  All Job Posts Overview
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate('/coordinator/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Support Settings
                </Button>
              </CardContent>
            </Card>

            {/* Platform Statistics (for context) */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Platform Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingStats ? (
                  <div className="space-y-2"><div className="bg-muted h-4 w-full rounded animate-pulse"></div></div>
                ) : (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Laborers</span>
                      <span className="font-semibold">{stats?.total_laborers.toLocaleString() ?? 0}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Employers</span>
                      <span className="font-semibold">{stats?.total_employers.toLocaleString() ?? 0}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Jobs Posted</span>
                      <span className="font-semibold">{stats?.total_jobs.toLocaleString() ?? 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;