"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Job = {
  id: number
  job_title: string
  location: string
  payment_type: string
  budget_min?: number
  budget_max?: number
  employer?: { user?: { username?: string } | null } | null
}

export default function JobsTable() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        // Public endpoint (GET) does not require auth
        const data = await apiFetch<{ results: Job[] }>("jobs/")
        const list = Array.isArray(data) ? data : data?.results || []
        if (!cancel) setJobs(list)
      } catch (e: unknown) {
        if (!cancel) {
          const errorMessage = e instanceof Error ? e.message : "Failed to load jobs"
          setError(errorMessage)
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => {
      cancel = true
    }
  }, [])

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Jobs (Table View)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && !loading && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && (
          <Table>
            <TableCaption>Latest job postings</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No jobs available
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.job_title}</TableCell>
                    <TableCell>{job.employer?.user?.username || "Employer"}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>{job.payment_type}</TableCell>
                    <TableCell className="text-right">
                      {job.budget_min != null || job.budget_max != null
                        ? `${job.budget_min ?? "-"} - ${job.budget_max ?? "-"}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
