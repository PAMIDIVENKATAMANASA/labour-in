import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, Users, DollarSign, AlertCircle, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { PostJobModal } from "@/components/PostJobModal"

// --- Type definition for dashboard overview data ---
type EmployerDashboardStats = {
  total_jobs: number
  active_jobs: number
  total_applications: number
  pending_applications: number
  completed_projects: number
  unread_notifications: number
}

// --- Type definition for job posting list ---
type JobPosting = {
  id: number
  job_title: string
  job_status: "OPEN" | "CLOSED" | "COMPLETED" | "DRAFT"
  applications_count: number
}

// --- Handles paginated responses ---
type PaginatedJobsResponse = {
  count: number
  next: string | null
  previous: string | null
  results: JobPosting[]
}

const EmployerDashboard = () => {
  const navigate = useNavigate()

  // --- 1. Fetch for "Overview" section ---
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<EmployerDashboardStats>({
    queryKey: ["employerDashboardStats"],
    queryFn: () => apiFetch<EmployerDashboardStats>("dashboard/"),
  })

  // --- 2. Fetch for "My Job Postings" section (handles paginated + array) ---
  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    error: jobsError,
  } = useQuery<JobPosting[] | PaginatedJobsResponse>({
    queryKey: ["employerJobs"],
    queryFn: () => apiFetch<JobPosting[] | PaginatedJobsResponse>("jobs/?my_jobs=true"),
  })

  // --- Helper: Render Stats ---
  const renderStats = () => {
    if (isLoadingStats) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground bg-muted h-5 w-1/3 rounded"></span>
              <span className="text-2xl font-bold text-foreground bg-muted h-8 w-1/4 rounded"></span>
            </div>
          ))}
        </div>
      )
    }

    if (statsError) {
      return (
        <div className="space-y-2 text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Failed to load stats</span>
          </div>
          <p className="text-xs text-muted-foreground">{statsError.message}</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Active Jobs</span>
          <span className="text-2xl font-bold text-primary">{stats?.active_jobs ?? 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Applicants</span>
          <span className="text-2xl font-bold text-foreground">{stats?.total_applications ?? 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Completed Projects</span>
          <span className="text-2xl font-bold text-secondary">{stats?.completed_projects ?? 0}</span>
        </div>
      </div>
    )
  }

  // --- Helper: Render Jobs Table ---
  const renderJobsTable = () => {
    // handle both array and paginated object
    const jobsList: JobPosting[] | undefined = Array.isArray(jobsData)
      ? jobsData
      : jobsData?.results

    if (isLoadingJobs) {
      return (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (jobsError) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p className="mt-2 font-medium">Failed to load jobs</p>
          <p className="text-sm text-muted-foreground">{jobsError.message}</p>
        </div>
      )
    }

    if (!jobsList || jobsList.length === 0) {
      return (
        <div className="text-center h-40 flex flex-col justify-center items-center">
          <p className="font-medium">No jobs posted yet.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Click "Post New Job" to get started.
          </p>
          <PostJobModal
            trigger={
              <Button variant="action" className="gap-2">
                <Plus className="h-4 w-4" />
                Post Your First Job
              </Button>
            }
          />
        </div>
      )
    }

    return (
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
          {jobsList.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.job_title}</TableCell>
              <TableCell>
                <Badge
                  variant={job.job_status === "OPEN" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {job.job_status.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{job.applications_count}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/employer/jobs/${job.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  // --- Return JSX ---
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          <h1 className="text-xl font-bold text-foreground">Employer Dashboard</h1>
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
        <div className="grid lg:grid-cols-[1fr,350px] gap-6">
          {/* Left: Job Listings */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">My Job Postings</h2>
              <PostJobModal
                trigger={
                  <Button variant="action" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Post New Job
                  </Button>
                }
              />
            </div>

            <Card className="shadow-card">
              <CardContent className="p-0">{renderJobsTable()}</CardContent>
            </Card>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Post Job CTA */}
            <Card className="shadow-card gradient-hero text-primary-foreground">
              <CardContent className="p-6 text-center space-y-4">
                <Plus className="h-12 w-12 mx-auto" />
                <h3 className="text-xl font-bold">Post a New Job</h3>
                <p className="text-sm opacity-90">
                  Find the perfect skilled worker for your next project
                </p>
                <PostJobModal
                  trigger={
                    <Button variant="secondary" size="lg" className="w-full">
                      Create Job Post
                    </Button>
                  }
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                  onClick={() => navigate("/dashboard/employer/applicants")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  View All Applicants
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Manage Payments (soon)
                </Button>
              </CardContent>
            </Card>

            {/* Overview Stats */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>{renderStats()}</CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployerDashboard
