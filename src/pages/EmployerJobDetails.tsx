import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


// Type for JobApplicationListSerializer
type JobApplication = {
  id: number
  laborer_name: string
  applied_at: string
  application_status: "PENDING" | "ACCEPTED" | "REJECTED"
  proposed_rate: number
  job_title: string
}

// Type for JobPostingSerializer (detailed view)
type JobPostingDetails = {
  id: number
  job_title: string
  job_description: string
  work_type: "ON_SITE" | "HYBRID" | "REMOTE"
  budget_min: number
  budget_max: number
  location: string
  start_date: string | null
  end_date: string | null
  job_status: "OPEN" | "CLOSED" | "COMPLETED" | "DRAFT"
  created_at: string
  employer_name: string
}

// Type for the application status mutation
type UpdateApplicationPayload = {
  id: number
  application_status: "ACCEPTED" | "REJECTED"
}

export default function EmployerJobDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 1. Fetch detailed info for this specific job
  const {
    data: job,
    isLoading: isLoadingJob,
    error: jobError,
  } = useQuery<JobPostingDetails>({
    queryKey: ["jobDetails", id],
    queryFn: () => apiFetch<JobPostingDetails>(`jobs/${id}/`),
  })

  // 2. Fetch applicants for this specific job
  const {
    data: applications,
    isLoading: isLoadingApps,
    error: appsError,
  } = useQuery<JobApplication[]>({
    queryKey: ["jobApplicants", id],
    queryFn: () => apiFetch<JobApplication[]>(`jobs/${id}/applications/`),
    // Only run this query if the job query was successful
    enabled: !!job,
  })

  // 3. Mutation to update job status
  const updateJobStatus = useMutation<
    JobPostingDetails,
    Error,
    { job_status: string }
  >({
    mutationFn: (payload) => {
      return apiFetch<JobPostingDetails>(`jobs/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    onSuccess: (data) => {
      toast.success(`Job status updated to ${data.job_status}`)
      // Update the cache for this job
      queryClient.setQueryData(["jobDetails", id], data)
      // Invalidate the main job list to show updated status
      queryClient.invalidateQueries({ queryKey: ["employerJobs"] })
      queryClient.invalidateQueries({ queryKey: ["employerDashboardStats"] })
    },
    onError: (error) => toast.error("Failed to update status", { description: error.message }),
  })
  
  // 4. Mutation to delete a job
  const deleteJob = useMutation<void, Error, void>({
    mutationFn: () => {
      return apiFetch<void>(`jobs/${id}/`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      toast.success("Job post deleted successfully.")
      // Invalidate queries and navigate back
      queryClient.invalidateQueries({ queryKey: ["employerJobs"] })
      queryClient.invalidateQueries({ queryKey: ["employerDashboardStats"] })
      navigate("/dashboard/employer")
    },
    onError: (error) => toast.error("Failed to delete job", { description: error.message }),
  })


  // 5. Mutation to update application status (Approve/Reject)
  const updateApplication = useMutation<JobApplication, Error, UpdateApplicationPayload>({
    mutationFn: ({ id, ...payload }) => {
      return apiFetch<JobApplication>(`applications/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    onSuccess: (data) => {
      toast.success(
        `Application for ${data.job_title} ${
          data.application_status === "ACCEPTED" ? "accepted" : "rejected"
        }.`
      )
      // Refetch applicants for this job
      queryClient.invalidateQueries({ queryKey: ["jobApplicants", id] })
      // Refetch dashboard stats (pending count)
      queryClient.invalidateQueries({ queryKey: ["employerDashboardStats"] })
      // Refetch all employer applications
      queryClient.invalidateQueries({ queryKey: ["employerApplications"] })
    },
    onError: (error) => toast.error("Failed to update application", { description: error.message }),
  })

  if (isLoadingJob) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (jobError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-destructive">
        <AlertCircle className="h-12 w-12" />
        <p className="mt-4 text-lg font-medium">Failed to load job details</p>
        <p className="text-muted-foreground">{jobError.message}</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }
  
  if (!job) return null // Should be covered by error state

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Navbar */}
      <nav className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/employer")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground ml-2 truncate">{job.job_title}</h1>
          </div>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleteJob.isPending}>
                {deleteJob.isPending ? "Deleting..." : "Delete Job"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the "{job.job_title}" job post and all its applications. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteJob.mutate()} className="bg-destructive hover:bg-destructive/90">
                  Yes, delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr,400px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{job.job_title}</CardTitle>
              <CardDescription>
                Posted on {new Date(job.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2">Job Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {job.job_description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applicants</CardTitle>
              <CardDescription>
                {isLoadingApps && "Loading applicants..."}
                {appsError && <span className="text-destructive">Failed to load applicants</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No applicants yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {applications?.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.laborer_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            app.application_status === "ACCEPTED"
                              ? "default"
                              : app.application_status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {app.application_status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                         {app.application_status === "PENDING" && (
                           <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => updateApplication.mutate({ id: app.id, application_status: "ACCEPTED" })}
                              disabled={updateApplication.isPending}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => updateApplication.mutate({ id: app.id, application_status: "REJECTED" })}
                              disabled={updateApplication.isPending}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                           </>
                         )}
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
          <Card>
            <CardHeader>
              <CardTitle>Job Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={job.job_status}
                onValueChange={(value) => updateJobStatus.mutate({ job_status: value })}
                disabled={updateJobStatus.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open (Accepting Applicants)</SelectItem>
                  <SelectItem value="CLOSED">Closed (Not Accepting)</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
               {updateJobStatus.isPending && (
                 <div className="flex items-center text-sm text-muted-foreground">
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Updating...
                 </div>
                )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-3 text-muted-foreground" />
                <span className="text-sm">
                  ${job.budget_min} - ${job.budget_max}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                <span className="text-sm">{job.location}</span>
              </div>
              <div className="flex items-center">
                <Badge variant="secondary" className="capitalize">
                  {job.work_type.replace("_", " ").toLowerCase()}
                </Badge>
              </div>
              {job.start_date && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span className="text-sm">
                    Starts: {new Date(job.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}