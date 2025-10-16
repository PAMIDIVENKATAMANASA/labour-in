"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Bell, User, Wrench, FileText, Briefcase, History } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { apiFetch } from "@/lib/api"
import { getCurrentUser, type AuthUser as AuthUserFromLib } from "@/lib/auth"
import { Toaster as Sonner, toast } from "@/components/ui/sonner"
import { Badge } from "@/components/ui/badge"

// --- Type Definitions ---

type AuthUser = AuthUserFromLib & {
  id: number;
}

interface ApiJob {
  id: number
  job_title: string
  employer_name: string
  location: string
  budget_max: number
  has_applied: boolean
}

type UserProfileData = {
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
  address?: string
}

type LaborerProfile = {
  user?: UserProfileData
  skills?: LaborerSkill[]
  experience_level?: string
  is_available?: boolean
  hourly_rate?: number | string | null
  years_experience?: number | null
  bio?: string
  max_travel_distance_km?: number | null
}

type SkillOption = { id: number; skill_name: string; category?: string }
type LaborerSkill = {
  id: number
  skill: { id: number; skill_name: string }
  proficiency_level: string
  years_experience: number
}

type NotificationItem = {
  id: number
  notification_type: string
  message: string
  is_read: boolean
  created_at: string
}

type AppliedJob = {
  id: number
  job_posting: number
  job_title: string
  application_status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN"
  applied_at: string
}

type WorkHistoryItem = {
  id: number
  job_title: string
  employer_name: string
  work_status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED"
  completed_at: string | null
  employer_rating: number | null
}

const LaborerDashboard = () => {
  // --- State ---
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser() as AuthUser | null)
  const [profile, setProfile] = useState<LaborerProfile | null>(null)
  const [jobs, setJobs] = useState<ApiJob[]>([])
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([])
  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>([])
  const [skillsList, setSkillsList] = useState<LaborerSkill[]>([])
  const [allSkills, setAllSkills] = useState<SkillOption[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isAvailable, setIsAvailable] = useState(true)
  const [profileCompleteness, setProfileCompleteness] = useState<number>(0)

  // Dialog states
  const [notifOpen, setNotifOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(false)

  // Loading/Saving states
  const [loading, setLoading] = useState({ page: true, profile: false, jobs: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states for adding a new skill
  const [newSkillId, setNewSkillId] = useState("")
  const [newSkillProf, setNewSkillProf] = useState("BEGINNER")
  const [newSkillYears, setNewSkillYears] = useState("0")
  
  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => localStorage.getItem("laborer-avatar") || null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // --- Effects ---
  useEffect(() => {
    const init = async () => {
      setLoading({ ...loading, page: true })
      setError(null)

      try {
        if (!user) return;

        const [profData, jobsData, appliedData, historyData, skillsOptions] = await Promise.all([
          apiFetch<LaborerProfile[]>(`laborers/?user_id=${user.id}`),
          apiFetch<{ results: ApiJob[] }>("jobs/?ordering=-created_at&limit=10"),
          apiFetch<{ results: AppliedJob[] }>("applications/"),
          apiFetch<{ results: WorkHistoryItem[] }>("work-history/"),
          apiFetch<{ results: SkillOption[] }>("skills/?ordering=skill_name"),
        ])
        
        const userProfile = profData?.[0] || null
        if (userProfile) {
          setProfile(userProfile)
          setSkillsList(userProfile.skills || [])
          setIsAvailable(userProfile.is_available ?? true)
        }
        
        setJobs(jobsData?.results || [])
        setAppliedJobs(appliedData?.results || [])
        setWorkHistory(historyData?.results || [])
        setAllSkills(skillsOptions?.results || [])

      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard data.")
        console.error("[v0] Dashboard init error:", e)
      } finally {
        setLoading({ ...loading, page: false })
      }
    }
    init()
  }, [user])
  
  useEffect(() => {
    recomputeCompleteness(profile, skillsList, Boolean(avatarUrl))
  }, [profile, skillsList, avatarUrl])

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.is_read).length)
  }, [notifications])

  // --- Functions ---
  const recomputeCompleteness = (p?: LaborerProfile | null, skills?: LaborerSkill[] | null, hasAvatar?: boolean) => {
    const total = 6
    let score = 0
    if (p?.bio && p.bio.trim().length > 0) score++
    if (p?.experience_level && p.experience_level !== "") score++
    if (typeof p?.years_experience === "number" && p.years_experience > 0) score++
    if (p?.hourly_rate !== null && p?.hourly_rate !== undefined && String(p.hourly_rate) !== "") score++
    if (Array.isArray(skills) && skills.length > 0) score++
    if (hasAvatar) score++
    const percent = Math.min(100, Math.round((score / total) * 100))
    setProfileCompleteness(percent)
  }

  const handleAvailabilityChange = async (val: boolean) => {
    setIsAvailable(val)
    if (!user?.id) return
    try {
      await apiFetch(`laborers/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_available: val }),
      })
      toast.success(`Availability set to: ${val ? "Available" : "Not Available"}`)
    } catch (e) {
      toast.error("Failed to update availability.")
    }
  }

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const payload = {
      user: {
        first_name: String(form.get("first_name") || ""),
        last_name: String(form.get("last_name") || ""),
        phone_number: String(form.get("phone_number") || ""),
      },
      bio: String(form.get("bio") || ""),
      experience_level: String(form.get("experience_level") || ""),
      years_experience: Number(form.get("years_experience") || 0),
      hourly_rate: form.get("hourly_rate") ? String(form.get("hourly_rate")) : null,
      max_travel_distance_km: form.get("max_travel_distance_km") ? Number(form.get("max_travel_distance_km")) : null,
    }

    try {
      const updated = await apiFetch<LaborerProfile>(`laborers/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      setProfile((p) => ({ ...(p || {}), ...updated }))
      toast.success("Profile updated successfully.")
      setEditOpen(false)
    } catch (e) {
      console.error("[v0] save profile error", e)
      toast.error("Could not update profile. Please check the fields and try again.")
    } finally {
      setSaving(false)
    }
  }
  
  const handleAddSkill = async () => {
    if (!newSkillId) return
    setSaving(true)
    try {
      const created = await apiFetch<LaborerSkill>(`laborer-skills/`, {
        method: "POST",
        body: JSON.stringify({
          skill_id: Number(newSkillId),
          proficiency_level: newSkillProf,
          years_experience: Number(newSkillYears || 0),
        }),
      })
      setSkillsList((s) => [created, ...s])
      setNewSkillId("")
      setNewSkillProf("BEGINNER")
      setNewSkillYears("0")
      toast.success("Skill added successfully.")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not add skill. Please try again."
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSkill = async (id: number) => {
    setSaving(true)
    try {
      await apiFetch(`laborer-skills/${id}/`, { method: "DELETE" })
      setSkillsList((s) => s.filter((x) => x.id !== id))
      toast.success("Skill removed.")
    } catch (e) {
      toast.error("Could not remove skill.")
    } finally {
      setSaving(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const data = await apiFetch<{ results: NotificationItem[] }>(`notifications/`)
      setNotifications(data.results || [])
    } catch (e) {
      console.error("[v0] load notifications error", e)
    }
  }

  const handleOpenNotifications = async (open: boolean) => {
    setNotifOpen(open)
    if (open) await loadNotifications()
  }

  const handleMarkAllRead = async () => {
    try {
      await apiFetch(`notifications/mark_all_read/`, { method: "POST" })
      await loadNotifications()
      toast.success("All notifications marked as read.")
    } catch (e) {
      toast.error("Could not mark all as read.")
    }
  }

  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
        const b64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = (error) => reject(error)
            reader.readAsDataURL(file)
        })
        localStorage.setItem("laborer-avatar", b64)
        setAvatarUrl(b64)
        toast.success("Profile image updated.")
    } catch (error) {
        toast.error("Failed to upload image.")
    }
  }

  const initials = (user?.username || "U").slice(0, 2).toUpperCase()

  if (loading.page) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <p>Loading Dashboard...</p>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Laborer Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={() => handleOpenNotifications(true)} className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} unread notifications`}
                className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
              >
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr,350px] gap-6">
          {/* Main Content */}
          <div>
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="new"><Briefcase className="w-4 h-4 mr-2"/>New Jobs</TabsTrigger>
                <TabsTrigger value="applied"><FileText className="w-4 h-4 mr-2"/>Applied Jobs</TabsTrigger>
                <TabsTrigger value="history"><History className="w-4 h-4 mr-2"/>Work History</TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <CardTitle>{job.job_title}</CardTitle>
                      <CardDescription>{job.employer_name} - {job.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                      <div className="text-lg font-bold text-primary">${job.budget_max}/hr</div>
                      {job.has_applied ? (
                         <Button disabled variant="outline">Already Applied</Button>
                      ) : (
                         <Button asChild><Link to={`/apply/${job.id}`}>Apply Now</Link></Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="applied">
                 <Card>
                    <CardHeader><CardTitle>My Applications</CardTitle></CardHeader>
                    <CardContent>
                      {appliedJobs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">You have not applied to any jobs yet.</p>
                      ) : (
                        <ul className="space-y-3">
                          {appliedJobs.map(app => (
                            <li key={app.id} className="flex justify-between items-center p-3 border rounded-md">
                               <div>
                                  <p className="font-semibold">{app.job_title}</p>
                                  <p className="text-sm text-muted-foreground">Applied on: {new Date(app.applied_at).toLocaleDateString()}</p>
                               </div>
                               <Badge variant={app.application_status === 'ACCEPTED' ? 'default' : 'secondary'}>{app.application_status}</Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader><CardTitle>My Work History</CardTitle></CardHeader>
                    <CardContent>
                      {workHistory.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No completed or ongoing jobs found.</p>
                      ) : (
                        <ul className="space-y-3">
                           {workHistory.map(hist => (
                            <li key={hist.id} className="flex justify-between items-center p-3 border rounded-md">
                               <div>
                                  <p className="font-semibold">{hist.job_title}</p>
                                  <p className="text-sm text-muted-foreground">With: {hist.employer_name}</p>
                               </div>
                               <Badge variant={hist.work_status === 'COMPLETED' ? 'default' : 'outline'}>{hist.work_status}</Badge>
                            </li>
                           ))}
                        </ul>
                      )}
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <label htmlFor="avatar-input" className="cursor-pointer">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={avatarUrl || `https://avatar.vercel.sh/${user?.username}.svg?text=${initials}`}
                        alt="Profile"
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    ref={fileInputRef}
                    onChange={onAvatarFileChange}
                  />
                  <h3 className="font-semibold text-foreground mt-2">{profile?.user?.first_name || user?.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.experience_level ? profile.experience_level.replace(/_/g, ' ') : "Set your experience"}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Profile Completeness</span>
                    <span className="font-medium text-primary">{profileCompleteness}%</span>
                  </div>
                  <Progress value={profileCompleteness} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="availability" className="text-base font-semibold">
                      Availability
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isAvailable ? "Available for work" : "Not available"}
                    </p>
                  </div>
                  <Switch id="availability" checked={isAvailable} onCheckedChange={handleAvailabilityChange} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="lg"
                  onClick={() => setEditOpen(true)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="lg"
                  onClick={() => setSkillsOpen(true)}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Manage Skills
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="lg"
                  onClick={() => handleOpenNotifications(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="first_name">First Name</Label>
                 <Input id="first_name" name="first_name" defaultValue={profile?.user?.first_name || ""} />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="last_name">Last Name</Label>
                 <Input id="last_name" name="last_name" defaultValue={profile?.user?.last_name || ""} />
               </div>
            </div>
             <div className="grid gap-2">
               <Label htmlFor="phone_number">Phone Number</Label>
               <Input id="phone_number" name="phone_number" defaultValue={profile?.user?.phone_number || ""} />
             </div>
            <div className="grid gap-3">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={profile?.bio || ""}
                placeholder="Tell employers about your experience..."
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="experience_level">Experience Level</Label>
              <Select name="experience_level" defaultValue={profile?.experience_level || "JUNIOR"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JUNIOR">Junior</SelectItem>
                  <SelectItem value="MID">Mid-level</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="years_experience">Years Experience</Label>
                <Input
                  id="years_experience"
                  name="years_experience"
                  type="number"
                  min={0}
                  defaultValue={profile?.years_experience ?? 0}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={profile?.hourly_rate ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_travel_distance_km">Max Travel (km)</Label>
                <Input
                  id="max_travel_distance_km"
                  name="max_travel_distance_km"
                  type="number"
                  min={0}
                  defaultValue={profile?.max_travel_distance_km ?? 25}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Manage Skills Dialog */}
      <Dialog open={skillsOpen} onOpenChange={setSkillsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Skills</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Add Skill</Label>
                <Select value={newSkillId} onValueChange={setNewSkillId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose skill" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {allSkills.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.skill_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Proficiency</Label>
                <Select value={newSkillProf} onValueChange={setNewSkillProf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Years</Label>
                <Input type="number" min={0} value={newSkillYears} onChange={(e) => setNewSkillYears(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddSkill} disabled={saving || !newSkillId}>
                {saving ? "Adding..." : "Add Skill"}
              </Button>
            </div>

            <div className="space-y-3">
              {skillsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {skillsList.map((s) => (
                    <li key={s.id} className="flex items-center justify-between border rounded-md p-3">
                      <div>
                        <div className="font-medium">{s.skill?.skill_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.proficiency_level} • {s.years_experience} yrs
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveSkill(s.id)} disabled={saving}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={notifOpen} onOpenChange={handleOpenNotifications}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleMarkAllRead}>Mark all read</Button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">You're all caught up.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`border rounded-md p-3 ${!n.is_read ? 'bg-muted/50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{n.notification_type.replace(/_/g, " ")}</span>
                      {!n.is_read && <Badge variant="destructive">New</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-foreground">{n.message}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Sonner />
    </div>
  )
}

export default LaborerDashboard