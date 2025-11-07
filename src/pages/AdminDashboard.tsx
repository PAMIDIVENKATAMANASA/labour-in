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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

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
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            System Admin Hub
          </h1>
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
          {/* Other content sections can go here */}

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
