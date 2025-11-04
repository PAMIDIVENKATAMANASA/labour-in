import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Users, Briefcase, Settings, Clock, AlertCircle, Loader2, DollarSign, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api"; // Your existing API client
import { useNavigate } from "react-router-dom"; // For navigation links

// --- 1. Type Definitions matching the enhanced Django API response ---
type AdminDashboardStats = {
  total_users: number
  total_jobs: number
  total_applications: number
  active_jobs: number
  total_laborers: number
  total_employers: number
  total_coordinators: number
  pending_approvals: number 
  unread_notifications: number
}

// --- 2. Hypothetical Type for a Pending Laborer for the table ---
// This assumes the /laborers/ endpoint is updated to include basic user/skill info.
type PendingLaborer = {
  id: number;
  user_id: number;
  user: {
    first_name: string;
    last_name: string;
    username: string;
  };
  primary_skill_name: string; 
  created_at: string; 
}

// --- Component to handle Pending Approvals List (dynamic data) ---
const PendingApprovalsTable = () => {
  const navigate = useNavigate();

  // NOTE: Assuming the /laborers/ endpoint supports an 'is_approved=false' filter.
  const { data: laborers, isLoading, error } = useQuery<PendingLaborer[]>({
    queryKey: ["adminPendingLaborers"],
    // MODIFIED FILTER: Use the filter for inactive users to represent "pending"
    queryFn: () => apiFetch<PendingLaborer[]>("laborers/?user__is_active=false&page_size=5"), 
  });
  
  if (isLoading) return <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center p-4 text-destructive"><AlertCircle className="h-5 w-5 mx-auto"/>Failed to load approvals.</div>;
  
  const approvalsList = laborers || [];

  if (approvalsList.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2"/>
        <p className="font-medium">No pending profile approvals at this time.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {approvalsList.map((laborer) => (
        <div key={laborer.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-semibold text-foreground">
              {laborer.user.first_name || laborer.user.username}
            </h4>
            <p className="text-sm text-muted-foreground">
              {laborer.primary_skill_name || "Unspecified Skill"} • 
              Applied {new Date(laborer.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {/* Navigates to a detailed view for approval action */}
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/laborers/${laborer.user_id}/view`)}>
              View Profile
            </Button>
          </div>
        </div>
      ))}
      <div className="text-center pt-2">
        <Button variant="link" onClick={() => navigate("/admin/users?status=pending")}>
            View All Pending
        </Button>
      </div>
    </div>
  )
}


const AdminDashboard = () => {
  const navigate = useNavigate()
  
  // --- 3. Fetch Admin Dashboard Stats ---
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<AdminDashboardStats>({
    queryKey: ["adminDashboardStats"],
    queryFn: () => apiFetch<AdminDashboardStats>("dashboard/"),
  })

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar (made dynamic for notifications) */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          <Button variant="ghost" size="icon">
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
          {/* Left: Main Metrics & Approvals */}
          <div className="space-y-6">
            {/* Stats Grid (now dynamic) */}
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {renderStatCard("Total Users", stats?.total_users ?? 0, Users, "text-primary")}
              {renderStatCard("Total Jobs", stats?.total_jobs ?? 0, Briefcase, "text-secondary")}
              {renderStatCard("Active Jobs", stats?.active_jobs ?? 0, DollarSign, "text-green-500")}
              {renderStatCard("Pending Approvals", stats?.pending_approvals ?? 0, Clock, "text-red-500")}
            </div>

            {/* Pending Approvals Section (using the new component) */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Pending Laborer Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingApprovalsTable />
              </CardContent>
            </Card>

            {/* Recent Job Postings (Placeholder, showing the link to manage) */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Job Postings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">Recent job listing integration coming soon. For now, use the 'Manage Job Posts' link in the sidebar to view all jobs.</p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Management Links (now with navigation) */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>System Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate('/admin/users')}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage All Users
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate('/admin/jobs')}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Manage Job Posts
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate('/admin/skills')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Skills/Categories
                </Button>
              </CardContent>
            </Card>

            {/* Platform Statistics (now dynamic) */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>User Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingStats ? (
                  <div className="space-y-2">
                    <div className="bg-muted h-4 w-full rounded animate-pulse"></div>
                    <div className="bg-muted h-4 w-full rounded animate-pulse"></div>
                    <div className="bg-muted h-4 w-1/2 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Laborers</span>
                      <span className="font-semibold">{stats?.total_laborers.toLocaleString() ?? 0}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Employers</span>
                      <span className="font-semibold">{stats?.total_employers.toLocaleString() ?? 0}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Coordinators</span>
                      <span className="font-semibold">{stats?.total_coordinators.toLocaleString() ?? 0}</span>
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

export default AdminDashboard;