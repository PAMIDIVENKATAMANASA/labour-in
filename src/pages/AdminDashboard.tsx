import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Users,
  Briefcase,
  Settings,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  UserCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { PostJobModal } from "@/components/PostJobModal";
import { Link } from "react-router-dom";

// --- 1. Type Definitions matching the enhanced Django API response ---
type AdminDashboardStats = {
  total_users: number;
  total_jobs: number;
  total_applications: number;
  active_jobs: number;
  total_laborers: number;
  total_employers: number;
  total_coordinators: number;
  pending_approvals: number;
  unread_notifications: number;
};

type JobPosting = {
  id: number;
  job_title: string;
  job_status: "OPEN" | "CLOSED" | "COMPLETED" | "DRAFT";
  applications_count: number;
  employer_name: string;
  location: string;
};

type JobApplication = {
  id: number;
  job_title: string;
  laborer_name: string;
  applied_at: string;
  application_status: "PENDING" | "ACCEPTED" | "REJECTED";
  proposed_rate: number;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  // --- 2. Fetch Admin Dashboard Stats ---
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<AdminDashboardStats>({
    queryKey: ["adminDashboardStats"],
    queryFn: () => apiFetch<AdminDashboardStats>("dashboard/"),
  });

  // --- Fetch Recent Jobs ---
  const {
    data: recentJobs,
    isLoading: isLoadingJobs,
  } = useQuery<{ results: JobPosting[] }>({
    queryKey: ["adminRecentJobs"],
    queryFn: () => apiFetch<{ results: JobPosting[] }>("jobs/?ordering=-created_at&limit=5"),
  });

  // --- Fetch Recent Applications ---
  const {
    data: recentApplications,
    isLoading: isLoadingApplications,
  } = useQuery<{ results: JobApplication[] }>({
    queryKey: ["adminRecentApplications"],
    queryFn: () => apiFetch<{ results: JobApplication[] }>("applications/?ordering=-applied_at&limit=5"),
  });

  // --- 3. Helper to render stat cards ---
  const renderStatCard = (
    title: string,
    value: number,
    Icon: React.ElementType,
    colorClass: string,
    secondaryText?: string
  ) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-primary/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoadingStats ? (
              <div className="bg-muted h-9 w-24 rounded mt-1 animate-pulse"></div>
            ) : (
              <p className="text-4xl font-extrabold text-foreground mt-1">
                {value.toLocaleString()}
              </p>
            )}
          </div>
          <Icon className={`h-10 w-10 opacity-70 ${colorClass}`} />
        </div>
        {secondaryText && (
          <p className="text-xs mt-3 text-muted-foreground">{secondaryText}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* --- Navbar (Header) --- */}
      <nav className="border-b bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              System Admin Hub
            </h1>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/skills">
                  <Settings className="mr-2 h-4 w-4" />
                  Skills
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/find-work">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Jobs
                </Link>
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            {stats && stats.unread_notifications > 0 && (
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Button>
        </div>
      </nav>

      {/* --- Main Content Area --- */}
      <div className="container mx-auto px-4 py-8">
        {statsError && (
          <div className="p-4 mb-6 border border-red-300 bg-red-50 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Error loading dashboard stats: {statsError.message}
            </p>
          </div>
        )}

        {/* --- Stats Grid --- */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {renderStatCard(
            "Total Users",
            stats?.total_users ?? 0,
            Users,
            "text-blue-500",
            "Total accounts registered on the platform."
          )}
          {renderStatCard(
            "Active Jobs",
            stats?.active_jobs ?? 0,
            Briefcase,
            "text-green-500",
            "Currently open job posts actively seeking laborers."
          )}
          {renderStatCard(
            "Total Jobs Posted",
            stats?.total_jobs ?? 0,
            DollarSign,
            "text-purple-500",
            "Total jobs posted since inception."
          )}
          {renderStatCard(
            "Pending Approvals",
            stats?.pending_approvals ?? 0,
            Clock,
            "text-red-500",
            "Laborer profiles awaiting activation."
          )}
        </div>

        {/* --- Full Width Section for Management + Breakdown --- */}
        <div className="space-y-6">
          {/* Recent Jobs and Applications */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Jobs Card */}
            <Card className="shadow-lg bg-white dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Job Postings</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/find-work">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingJobs ? (
                  <div className="space-y-3">
                    <div className="bg-muted h-4 w-full rounded animate-pulse"></div>
                    <div className="bg-muted h-4 w-full rounded animate-pulse"></div>
                  </div>
                ) : recentJobs?.results && recentJobs.results.length > 0 ? (
                  <div className="space-y-3">
                    {recentJobs.results.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{job.job_title}</p>
                          <p className="text-xs text-muted-foreground">{job.employer_name} • {job.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{job.applications_count} applicants</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No jobs posted yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Applications Card */}
            <Card className="shadow-lg bg-white dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Applications</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/employer/applicants")}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingApplications ? (
                  <div className="space-y-3">
                    <div className="bg-muted h-4 w-full rounded animate-pulse"></div>
                    <div className="bg-muted h-4 w-full rounded animate-pulse"></div>
                  </div>
                ) : recentApplications?.results && recentApplications.results.length > 0 ? (
                  <div className="space-y-3">
                    {recentApplications.results.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{app.laborer_name}</p>
                          <p className="text-xs text-muted-foreground">{app.job_title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium">${app.proposed_rate}/hr</p>
                          <p className="text-xs text-muted-foreground">{app.application_status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No applications yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 2-Column layout for System Management & User Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* --- System Management Card --- */}
            <Card className="shadow-lg bg-white dark:bg-gray-800 w-full">
              <CardHeader>
                <CardTitle className="text-lg">System Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-base py-3"
                  onClick={() => navigate("/admin/users")}
                >
                  <Users className="mr-3 h-5 w-5 text-blue-500" />
                  Manage All Users
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-base py-3"
                  onClick={() => navigate("/admin/skills")}
                >
                  <Settings className="mr-3 h-5 w-5 text-purple-500" />
                  Manage Skills
                </Button>
                <PostJobModal
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full justify-start text-base py-3"
                    >
                      <Plus className="mr-3 h-5 w-5 text-green-500" />
                      Post a Job
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            {/* --- User Breakdown Card --- */}
            <Card className="shadow-lg bg-white dark:bg-gray-800 w-full">
              <CardHeader>
                <CardTitle className="text-lg">User Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-3">
                    <div className="bg-muted h-4 w-full rounded animate-pulse"></div>
                    <div className="bg-muted h-4 w-full rounded animate-pulse"></div>
                    <div className="bg-muted h-4 w-1/2 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-sm font-medium">Laborers</span>
                      <span className="font-bold text-blue-600">
                        {stats?.total_laborers.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-sm font-medium">Employers</span>
                      <span className="font-bold text-green-600">
                        {stats?.total_employers.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-sm font-medium">Coordinators</span>
                      <span className="font-bold text-purple-600">
                        {stats?.total_coordinators.toLocaleString() ?? 0}
                      </span>
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
