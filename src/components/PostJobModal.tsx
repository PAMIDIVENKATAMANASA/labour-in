import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { useState } from "react"
import { Plus } from "lucide-react"

// --- FIX #1: This schema now matches your models.py ---
const jobPostSchema = z.object({
  job_title: z.string().min(5, "Title must be at least 5 characters"),
  job_description: z.string().min(20, "Description must be at least 20 characters"),
  
  // These are the choices from your models.py
  work_type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"]), 
  
  location: z.string().min(3, "Location is required"),
  budget_min: z.coerce.number().min(0, "Minimum budget must be 0 or more"),
  budget_max: z.coerce.number().min(0, "Maximum budget must be 0 or more"),
  
  // start_date is REQUIRED in your models.py (no null=True)
  start_date: z.string()
    .min(1, "Start date is required") // Ensures it's not empty
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Date must be in YYYY-MM-DD format",
    }),
    
  // end_date is OPTIONAL (null=True, blank=True)
  end_date: z.string()
    .refine((val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Date must be in YYYY-MM-DD format",
    })
    .nullable()
    .optional()
    .transform(val => (val === "" ? null : val)), // Send null if empty
    
}).refine(data => data.budget_max >= data.budget_min, {
  message: "Maximum budget must be greater than or equal to minimum budget",
  path: ["budget_max"],
})
// --- END FIX #1 ---

type JobPostFormData = z.infer<typeof jobPostSchema>

type JobPosting = {
  id: number
  job_title: string
}

type PostJobModalProps = {
  trigger: React.ReactNode
}

export function PostJobModal({ trigger }: PostJobModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobPostFormData>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: {
      job_title: "",
      job_description: "",
      // --- FIX #2: Default value now matches your models.py default ---
      work_type: "CONTRACT", // <-- CHANGED
      location: "",
      budget_min: 0,
      budget_max: 0,
      start_date: "", // Will be caught by validation if not filled
      end_date: "",
    },
  })

  const mutation = useMutation<JobPosting, Error, JobPostFormData>({
    mutationFn: (newJob) => {
      console.log("[PostJobModal] Submitting data:", newJob) // Debug log
      return apiFetch<JobPosting>("jobs/", {
        method: "POST",
        body: JSON.stringify(newJob),
      })
    },
    onSuccess: (data) => {
      toast.success(`Job "${data.job_title}" posted successfully!`)
      // Invalidate all related queries to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ["employerJobs"] })
      queryClient.invalidateQueries({ queryKey: ["employerDashboardStats"] })
      setIsOpen(false)
      reset()
    },
    onError: (error) => {
      console.error("[PostJobModal] Server returned an error:", error.message)
      try {
        const errJson = JSON.parse(error.message);
        const formattedError = Object.entries(errJson)
          .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(' ') : msg}`)
          .join('\n');
        toast.error("Failed to post job", {
          description: formattedError,
          duration: 10000, // Show for 10 seconds
        });
      } catch {
         toast.error("Failed to post job", {
           description: error.message,
           duration: 10000,
         });
      }
    },
  })

  const onSubmit = (data: JobPostFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a New Job</DialogTitle>
          <DialogDescription>
            Fill in the details below to find the perfect skilled worker.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              {...register("job_title")}
              placeholder="e.g., Senior Plumber for residential project"
            />
            {errors.job_title && <p className="text-sm text-red-500">{errors.job_title.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="job_description">Job Description</Label>
            <Textarea
              id="job_description"
              {...register("job_description")}
              placeholder="Describe the responsibilities, requirements, and project details..."
              className="min-h-[100px]"
            />
            {errors.job_description && <p className="text-sm text-red-500">{errors.job_description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="work_type">Work Type</Label>
              <Controller
                name="work_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="work_type">
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                    {/* --- FIX #3: Options now match your models.py --- */}
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="TEMPORARY">Temporary</SelectItem>
                    </SelectContent>
                    {/* --- END FIX --- */}
                  </Select>
                )}
              />
              {errors.work_type && <p className="text-sm text-red-500">{errors.work_type.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="e.g., Kadapa, Andhra Pradesh"
              />
              {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budget_min">Minimum Budget ($)</Label>
              <Input
                id="budget_min"
                type="number"
                {...register("budget_min")}
                placeholder="0"
              />
              {errors.budget_min && <p className="text-sm text-red-500">{errors.budget_min.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget_max">Maximum Budget ($)</Label>
              <Input
                id="budget_max"
                type="number"
                {...register("budget_max")}
                placeholder="1000"
              />
              {errors.budget_max && <p className="text-sm text-red-500">{errors.budget_max.message}</p>}
            </div>
          </div>
          
           <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              {/* --- FIX #4: Removed (Optional) --- */}
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date" 
                {...register("start_date")}
              />
              {errors.start_date && <p className="text-sm text-red-500">{errors.start_date.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date" 
                {...register("end_date")}
              />
              {errors.end_date && <p className="text-sm text-red-500">{errors.end_date.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Posting..." : "Post Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

