import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, AlertCircle, UserCheck, UserX } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

// Type for JobApplicationListSerializer
type JobApplication = {
  id: number
  job_title: string
  laborer_name: string
  applied_at: string
  application_status: "PENDING" | "ACCEPTED" | "REJECTED"
  proposed_rate: number
}

// Type for the mutation
type UpdateApplicationPayload = {
  id: number
  application_status: "ACCEPTED" | "REJECTED"
}

export default function EmployerApplicants() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [jobFilter, setJobFilter] = useState("")

  const { data: applicationsData, isLoading, error } = useQuery<JobApplication[] | { results: JobApplication[] }>({
    queryKey: ["employerApplications"],
    queryFn: async () => {
      const response = await apiFetch<JobApplication[] | { results: JobApplication[] }>("applications/");
      // Handle both array and paginated response
      return Array.isArray(response) ? response : response.results || [];
    },
  })
  
  // Extract applications from response (handle both array and paginated)
  const applications = Array.isArray(applicationsData) 
    ? applicationsData 
    : applicationsData?.results || []

  const mutation = useMutation<JobApplication, Error, UpdateApplicationPayload>({
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
      // Refetch the applications list
      queryClient.invalidateQueries({ queryKey: ["employerApplications"] })
      // Also refetch dashboard stats (pending count) and job list (applicant count)
      queryClient.invalidateQueries({ queryKey: ["employerDashboardStats"] })
      queryClient.invalidateQueries({ queryKey: ["employerJobs"] })
    },
    onError: (error) => {
      toast.error("Failed to update application", {
        description: error.message,
      })
    },
  })

  const handleUpdateStatus = (id: number, status: "ACCEPTED" | "REJECTED") => {
    mutation.mutate({ id, application_status: status })
  }

  const filteredApplications = applications
    ?.filter((app) =>
      statusFilter === "ALL" ? true : app.application_status === statusFilter
    )
    .filter((app) =>
      jobFilter === ""
        ? true
        : app.job_title.toLowerCase().includes(jobFilter.toLowerCase())
    )

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-destructive">
          <AlertCircle className="h-12 w-12" />
          <p className="mt-4 text-lg font-medium">Failed to load applications</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      )
    }
    if (!applications || applications.length === 0) {
      return (
         <div className="text-center h-64 flex flex-col justify-center items-center">
           <p className="text-lg font-medium">No applications found.</p>
           <p className="text-muted-foreground">When laborers apply to your jobs, they will appear here.</p>
         </div>
      )
    }
     if (filteredApplications?.length === 0) {
      return (
         <div className="text-center h-64 flex flex-col justify-center items-center">
           <p className="text-lg font-medium">No applications match your filters.</p>
         </div>
      )
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Applicant</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Proposed Rate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredApplications?.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="font-medium">{app.laborer_name}</TableCell>
              <TableCell>{app.job_title}</TableCell>
              <TableCell className="font-semibold text-primary">${app.proposed_rate}/hr</TableCell>
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
              <TableCell>{new Date(app.applied_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {app.application_status === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => handleUpdateStatus(app.id, "ACCEPTED")}
                        disabled={mutation.isPending}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                        disabled={mutation.isPending}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {app.application_status !== "PENDING" && (
                    <span className="text-sm text-muted-foreground italic">
                      {app.application_status === "ACCEPTED" ? "Approved" : "Rejected"}
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Navbar */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/employer")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground ml-2">All Applicants</h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Filter Applicants</CardTitle>
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <Input
                placeholder="Filter by job title..."
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </div>
    </div>
  )
}