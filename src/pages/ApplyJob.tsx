"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import Navbar from "@/components/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth"

type JobDetail = {
  id: number
  job_title: string
  employer_name?: string
  location?: string
  budget_min?: number
  budget_max?: number
}

export default function ApplyJob() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [proposedRate, setProposedRate] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Guard: must be a logged-in LABORER
  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.user_type !== "LABORER") {
      const next = encodeURIComponent(location.pathname + location.search)
      navigate(`/login?next=${next}`, { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  // Fetch job detail for context
  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        if (!id) return
        const data = await apiFetch<JobDetail>(`jobs/${id}/`)
        if (!ignore) setJob(data)
      } catch {
        // silent; form still works without details
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [id])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const rate = Number(proposedRate)
      if (!id) throw new Error("Missing job id")
      if (!rate || rate <= 0) throw new Error("Enter a valid proposed rate")

      await apiFetch("applications/", {
        method: "POST",
        body: JSON.stringify({
          job_posting: Number(id),
          proposed_rate: rate.toFixed(2),
          cover_letter: coverLetter,
        }),
      })
      setSuccess("Submitted successfully and will reach you out soon")
      setTimeout(() => navigate("/", { replace: true }), 900)
    } catch (err: unknown) {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message) as unknown
          if (parsed && typeof parsed === "object") {
            const msgs: string[] = []
            for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
              if (Array.isArray(v)) {
                msgs.push(`${k}: ${v.join(", ")}`)
              } else if (typeof v === "string") {
                msgs.push(`${k}: ${v}`)
              } else {
                msgs.push(`${k}: ${JSON.stringify(v)}`)
              }
            }
            const friendly = msgs.join(" | ")

            if (friendly.toLowerCase().includes("unique") || friendly.toLowerCase().includes("already")) {
              setError("You have already applied to this job.")
            } else if (friendly.toLowerCase().includes("laborer")) {
              setError("Only laborers can apply. Please log in as a laborer.")
            } else {
              setError(friendly || "Failed to submit application")
            }
          } else {
            setError(err.message)
          }
        } catch {
          setError(err.message)
        }
      } else {
        setError("Failed to submit application")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              Apply for {job?.job_title ? `"${job.job_title}"` : "Job"}{" "}
              {job?.employer_name ? `at ${job.employer_name}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Proposed rate"
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
              />
              <Textarea
                placeholder="Cover letter (optional)"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting…" : "Submit Application"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
