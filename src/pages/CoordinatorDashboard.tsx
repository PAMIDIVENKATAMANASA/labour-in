import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Users, Briefcase, Settings, Clock, AlertCircle, Loader2, Zap, ShieldCheck, ClipboardList, TrendingUp, X, CheckCircle, XCircle, Search, FileText, MapPin, Calendar, DollarSign, Home } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api"; 
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- 1. Type Definitions matching the enhanced Django API response ---
type CoordinatorDashboardStats = {
  total_users: number
  total_jobs: number
  total_applications: number
  total_laborers: number
  total_employers: number
  total_coordinators: number
  
  // Coordinator-Specific Stats
  disputed_projects: number
  pending_employer_verification: number
  long_pending_applications: number
  
  unread_notifications: number
}

// --- 2. Type for Pending Employer Verification ---
type PendingEmployer = {
  user: number | { id: number; username?: string; email?: string; [key: string]: any };
  company_name: string;
  business_type: string;
  established_year: number | null;
  company_size: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  user_details?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  }
}

type PaginatedEmployerResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PendingEmployer[];
}

// --- 3. Type for Disputed Projects ---
type DisputedProject = {
  id: number;
  job_posting?: {
    id?: number;
    job_title?: string;
    location?: string;
  };
  laborer?: {
    user?: {
      id?: number;
      username?: string;
      email?: string;
    };
    id?: number;
  };
  laborer_name?: string; // From serializer method field
  employer?: {
    user?: {
      id?: number;
      username?: string;
      email?: string;
    };
    company_name?: string;
    id?: number;
  };
  employer_name?: string; // From serializer method field
  job_title?: string; // From serializer method field
  work_status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  started_at: string;
  amount_paid: number | null;
  employer_review: string;
  laborer_review: string;
}

// --- 4. Type for Long Pending Applications ---
type LongPendingApplication = {
  id: number;
  job_posting?: {
    id?: number;
    job_title?: string;
    employer?: {
      company_name?: string;
    };
  };
  laborer?: {
    user?: {
      username?: string;
      email?: string;
    };
    id?: number;
  };
  job_title?: string; // From serializer method field
  employer_name?: string; // From serializer method field
  laborer_name?: string; // From serializer method field
  application_status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  applied_at: string;
  proposed_rate: number;
  cover_letter: string;
}

// --- 5. Type for Notifications ---
type NotificationItem = {
  id: number;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  status?: string;
}

// --- Component for Pending Employer Verification List ---
const PendingVerificationList = () => {
    const queryClient = useQueryClient();
    const [selectedEmployer, setSelectedEmployer] = useState<PendingEmployer | null>(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const { data: employersResponse, isLoading, error, refetch } = useQuery<PaginatedEmployerResponse | PendingEmployer[]>({
        queryKey: ["coordinatorPendingEmployers"],
        queryFn: async () => {
            const response = await apiFetch<PaginatedEmployerResponse | PendingEmployer[]>("employers/");
            // Filter for PENDING status if response is array
            if (Array.isArray(response)) {
                return response.filter((e: PendingEmployer) => e.verification_status === 'PENDING').slice(0, 5);
            } else {
                // If paginated, filter results
                const filtered = {
                    ...response,
                    results: response.results.filter((e: PendingEmployer) => e.verification_status === 'PENDING').slice(0, 5)
                };
                return filtered;
            }
        },
        retry: 1,
        refetchOnWindowFocus: false,
    });

    // Helper function to get employer user ID
    const getEmployerUserId = (employer: PendingEmployer): number => {
        if (typeof employer.user === 'number') {
            return employer.user;
        } else if (employer.user && typeof employer.user === 'object' && 'id' in employer.user) {
            return employer.user.id;
        } else if (employer.user_details?.id) {
            return employer.user_details.id;
        }
        throw new Error('Unable to determine employer user ID');
    };

    const approveMutation = useMutation({
        mutationFn: async (employerUserId: number) => {
            // Employer primary key is the user ID
            return apiFetch(`employers/${employerUserId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ verification_status: 'VERIFIED' }),
            });
        },
        onSuccess: () => {
            toast.success("Employer verified successfully");
            queryClient.invalidateQueries({ queryKey: ["coordinatorPendingEmployers"] });
            queryClient.invalidateQueries({ queryKey: ["coordinatorDashboardStats"] });
            setReviewDialogOpen(false);
            setSelectedEmployer(null);
        },
        onError: (error: Error) => {
            toast.error(`Failed to verify employer: ${error.message}`);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ employerUserId, reason }: { employerUserId: number; reason: string }) => {
            return apiFetch(`employers/${employerUserId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ verification_status: 'REJECTED' }),
            });
        },
        onSuccess: () => {
            toast.success("Employer verification rejected");
            queryClient.invalidateQueries({ queryKey: ["coordinatorPendingEmployers"] });
            queryClient.invalidateQueries({ queryKey: ["coordinatorDashboardStats"] });
            setReviewDialogOpen(false);
            setSelectedEmployer(null);
            setRejectReason("");
        },
        onError: (error: Error) => {
            toast.error(`Failed to reject employer: ${error.message}`);
        },
    });

    const handleReview = (employer: PendingEmployer) => {
        setSelectedEmployer(employer);
        setReviewDialogOpen(true);
    };

    const handleApprove = () => {
        if (selectedEmployer) {
            try {
                const userId = getEmployerUserId(selectedEmployer);
                approveMutation.mutate(userId);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to get employer ID");
            }
        }
    };

    const handleReject = () => {
        if (selectedEmployer && rejectReason.trim()) {
            try {
                const userId = getEmployerUserId(selectedEmployer);
                rejectMutation.mutate({ employerUserId: userId, reason: rejectReason });
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to get employer ID");
            }
        } else {
            toast.error("Please provide a reason for rejection");
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    if (error) return <div className="text-center p-4 text-destructive"><AlertCircle className="h-5 w-5 mx-auto"/>Failed to load pending verifications.</div>;
    
    const pendingList = Array.isArray(employersResponse) 
        ? employersResponse 
        : employersResponse?.results || [];

    if (pendingList.length === 0) {
        return (
          <div className="text-center p-4 text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mx-auto text-green-500 mb-2"/>
            <p className="font-medium">All employers verified.</p>
          </div>
        );
    }

    return (
        <>
        <div className="space-y-3">
            {pendingList.map((employer) => {
                const employerKey = typeof employer.user === 'number' ? employer.user : (employer.user?.id || employer.user_details?.id || 0);
                return (
                <div key={employerKey} className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                        <h4 className="font-semibold">{employer.company_name}</h4>
                        <p className="text-xs text-muted-foreground">{employer.business_type}</p>
                        {employer.established_year && (
                            <p className="text-xs text-muted-foreground">Est. {employer.established_year}</p>
                        )}
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleReview(employer)}
                    >
                        Review
                    </Button>
                </div>
                );
            })}
        </div>

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Review Employer Verification</DialogTitle>
                    <DialogDescription>
                        Review employer details and approve or reject verification
                    </DialogDescription>
                </DialogHeader>
                {selectedEmployer && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Company Name</label>
                                <p className="text-sm">{selectedEmployer.company_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Business Type</label>
                                <p className="text-sm">{selectedEmployer.business_type}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Company Size</label>
                                <p className="text-sm">{selectedEmployer.company_size || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Established Year</label>
                                <p className="text-sm">{selectedEmployer.established_year || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="mt-1"
                            />
                        </div>
                    </div>
                )}
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setReviewDialogOpen(false);
                            setRejectReason("");
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={rejectMutation.isPending || !rejectReason.trim()}
                    >
                        {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                    >
                        {approveMutation.isPending ? "Approving..." : "Approve"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};

// --- Component for Disputed Projects List ---
const DisputedProjectsList = () => {
    const queryClient = useQueryClient();
    const [selectedProject, setSelectedProject] = useState<DisputedProject | null>(null);
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [resolutionNote, setResolutionNote] = useState("");

    const { data: projects, isLoading, error } = useQuery<DisputedProject[]>({
        queryKey: ["coordinatorDisputedProjects"],
        queryFn: async () => {
            const response = await apiFetch<{ results: DisputedProject[] }>("work-history/?work_status=DISPUTED");
            return response.results || [];
        },
        retry: 1,
        refetchOnWindowFocus: false,
    });

    const resolveMutation = useMutation({
        mutationFn: async ({ projectId, newStatus, note }: { projectId: number; newStatus: 'COMPLETED' | 'CANCELLED'; note: string }) => {
            return apiFetch(`work-history/${projectId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ 
                    work_status: newStatus,
                    // You might want to store resolution note in a separate field
                }),
            });
        },
        onSuccess: () => {
            toast.success("Dispute resolved successfully");
            queryClient.invalidateQueries({ queryKey: ["coordinatorDisputedProjects"] });
            queryClient.invalidateQueries({ queryKey: ["coordinatorDashboardStats"] });
            setResolveDialogOpen(false);
            setSelectedProject(null);
            setResolutionNote("");
        },
        onError: (error: Error) => {
            toast.error(`Failed to resolve dispute: ${error.message}`);
        },
    });

    const handleResolve = (project: DisputedProject) => {
        setSelectedProject(project);
        setResolveDialogOpen(true);
    };

    const handleResolveSubmit = (status: 'COMPLETED' | 'CANCELLED') => {
        if (selectedProject) {
            resolveMutation.mutate({ 
                projectId: selectedProject.id, 
                newStatus: status,
                note: resolutionNote 
            });
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    if (error) return <div className="text-center p-4 text-destructive"><AlertCircle className="h-5 w-5 mx-auto"/>Failed to load disputed projects.</div>;
    
    const disputedList = projects || [];

    if (disputedList.length === 0) {
        return (
          <div className="text-center p-4 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2"/>
            <p className="font-medium">No disputed projects.</p>
          </div>
        );
    }

    return (
        <>
        <div className="space-y-3">
            {disputedList.slice(0, 5).map((project) => {
                // Handle different possible data structures from API
                const laborerUsername = project.laborer_name || 
                                       project.laborer?.user?.username || 
                                       project.laborer?.user?.id?.toString() || 
                                       'Unknown Laborer';
                const employerName = project.employer_name || 
                                    project.employer?.company_name || 
                                    'Unknown Employer';
                const jobTitle = project.job_title || 
                               project.job_posting?.job_title || 
                               'Unknown Job';
                const location = project.job_posting?.location || 'Location not specified';
                
                return (
                    <div key={project.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h4 className="font-semibold">{jobTitle}</h4>
                                <p className="text-xs text-muted-foreground">
                                    {employerName} • {laborerUsername}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    {location}
                                </p>
                            </div>
                            <Badge variant="destructive">DISPUTED</Badge>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleResolve(project)}
                            >
                                Resolve
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>

        <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Resolve Dispute</DialogTitle>
                    <DialogDescription>
                        Review dispute details and resolve the issue
                    </DialogDescription>
                </DialogHeader>
                {selectedProject && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Job Title</label>
                                <p className="text-sm">{selectedProject.job_title || 
                                                         selectedProject.job_posting?.job_title || 
                                                         'Unknown Job'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Location</label>
                                <p className="text-sm">{selectedProject.job_posting?.location || 'Location not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Employer</label>
                                <p className="text-sm">{selectedProject.employer_name || 
                                                         selectedProject.employer?.company_name || 
                                                         'Unknown Employer'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Laborer</label>
                                <p className="text-sm">{selectedProject.laborer_name || 
                                                         selectedProject.laborer?.user?.username || 
                                                         selectedProject.laborer?.user?.id?.toString() || 
                                                         'Unknown Laborer'}</p>
                            </div>
                            {selectedProject.amount_paid && (
                                <div>
                                    <label className="text-sm font-medium">Amount Paid</label>
                                    <p className="text-sm">${selectedProject.amount_paid}</p>
                                </div>
                            )}
                        </div>
                        {selectedProject.employer_review && (
                            <div>
                                <label className="text-sm font-medium">Employer Review</label>
                                <p className="text-sm text-muted-foreground">{selectedProject.employer_review}</p>
                            </div>
                        )}
                        {selectedProject.laborer_review && (
                            <div>
                                <label className="text-sm font-medium">Laborer Review</label>
                                <p className="text-sm text-muted-foreground">{selectedProject.laborer_review}</p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium">Resolution Note</label>
                            <Textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Enter resolution notes..."
                                className="mt-1"
                            />
                        </div>
                    </div>
                )}
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setResolveDialogOpen(false);
                            setResolutionNote("");
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => handleResolveSubmit('CANCELLED')}
                        disabled={resolveMutation.isPending}
                    >
                        {resolveMutation.isPending ? "Resolving..." : "Mark as Cancelled"}
                    </Button>
                    <Button
                        onClick={() => handleResolveSubmit('COMPLETED')}
                        disabled={resolveMutation.isPending}
                    >
                        {resolveMutation.isPending ? "Resolving..." : "Mark as Completed"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};

// --- Component for Long Pending Applications List ---
const LongPendingApplicationsList = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: applications, isLoading, error } = useQuery<LongPendingApplication[]>({
        queryKey: ["coordinatorLongPendingApplications"],
        queryFn: async () => {
            const response = await apiFetch<{ results: LongPendingApplication[] }>("applications/?application_status=PENDING");
            const allPending = response.results || [];
            // Filter for applications older than 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return allPending.filter(app => {
                const appliedDate = new Date(app.applied_at);
                return appliedDate < sevenDaysAgo;
            }).slice(0, 10);
        },
        retry: 1,
        refetchOnWindowFocus: false,
    });

    const sendReminderMutation = useMutation({
        mutationFn: async (applicationId: number) => {
            return apiFetch<{ message: string }>("notifications/send_reminder/", {
                method: "POST",
                body: JSON.stringify({ application_id: applicationId }),
            });
        },
        onSuccess: (data) => {
            toast.success(data.message || "Reminder sent successfully");
            queryClient.invalidateQueries({ queryKey: ["coordinatorLongPendingApplications"] });
        },
        onError: (error: Error) => {
            const errorMsg = error.message || "Failed to send reminder";
            toast.error(errorMsg);
        },
    });

    if (isLoading) return <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    if (error) return <div className="text-center p-4 text-destructive"><AlertCircle className="h-5 w-5 mx-auto"/>Failed to load applications.</div>;
    
    const applicationsList = applications || [];
    const filteredApplications = searchQuery
        ? applicationsList.filter(app => {
            const jobTitle = (app.job_title || app.job_posting?.job_title || '').toLowerCase();
            const laborerName = (app.laborer_name || app.laborer?.user?.username || '').toLowerCase();
            const employerName = (app.employer_name || app.job_posting?.employer?.company_name || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return jobTitle.includes(query) || laborerName.includes(query) || employerName.includes(query);
          })
        : applicationsList;

    if (applicationsList.length === 0) {
        return (
          <div className="text-center p-4 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2"/>
            <p className="font-medium">No long-pending applications.</p>
          </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search applications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredApplications.map((app) => {
                    const daysPending = Math.floor((new Date().getTime() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24));
                    const jobTitle = app.job_title || app.job_posting?.job_title || 'Unknown Job';
                    const laborerName = app.laborer_name || app.laborer?.user?.username || 'Unknown Laborer';
                    const employerName = app.employer_name || app.job_posting?.employer?.company_name || 'Unknown Employer';
                    
                    return (
                        <div key={app.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-semibold">{jobTitle}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {laborerName} → {employerName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <Calendar className="h-3 w-3 inline mr-1" />
                                        Applied {daysPending} days ago • ${app.proposed_rate}/hr
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-orange-600">
                                        {daysPending} days
                                    </Badge>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => sendReminderMutation.mutate(app.id)}
                                        disabled={sendReminderMutation.isPending}
                                    >
                                        Send Reminder
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- User Search Component ---
type SearchUser = {
    id: number;
    username: string;
    email: string;
    user_type: string;
    first_name?: string;
    last_name?: string;
}

const UserSearchComponent = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await apiFetch<{ users?: SearchUser[] }>(`search/?q=${encodeURIComponent(searchQuery)}&type=all`);
            setSearchResults(results.users || []);
        } catch (error) {
            toast.error("Failed to search users");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" /> User Search
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Search by username, email, name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                    </Button>
                </div>
                {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {searchResults.map((user) => (
                            <div key={user.id} className="border rounded p-2">
                                <p className="font-medium">{user.username}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                <Badge variant="outline" className="mt-1">{user.user_type}</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// --- Notifications Component ---
const NotificationsComponent = () => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { data: notifications, isLoading } = useQuery<{ results: NotificationItem[] }>({
        queryKey: ["coordinatorNotifications"],
        queryFn: () => apiFetch<{ results: NotificationItem[] }>("notifications/"),
        enabled: notificationsOpen,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => apiFetch("notifications/mark_all_read/", { method: "POST" }),
        onSuccess: () => {
            toast.success("All notifications marked as read");
        },
    });

    return (
        <>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setNotificationsOpen(true)}>
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>
            <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Notifications</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => markAllReadMutation.mutate()}
                            >
                                Mark All Read
                            </Button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            ) : notifications?.results?.length === 0 ? (
                                <p className="text-center text-muted-foreground">No notifications</p>
                            ) : (
                                notifications?.results?.map((notif: NotificationItem) => (
                                    <div key={notif.id} className="border rounded p-3">
                                        <p className="text-sm font-medium">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(notif.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

const CoordinatorDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'disputes' | 'applications'>('overview');
  
  // Debug: Log when component mounts
  useEffect(() => {
    console.log("CoordinatorDashboard component mounted");
  }, []);
  
  // --- 3. Fetch Coordinator Dashboard Stats ---
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<CoordinatorDashboardStats>({
    queryKey: ["coordinatorDashboardStats"],
    queryFn: async () => {
      try {
        return await apiFetch<CoordinatorDashboardStats>("dashboard/");
      } catch (error) {
        console.error("Dashboard API error:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds
  })

  // Helper to render stat cards
  const renderStatCard = (title: string, value: number, Icon: React.ElementType, colorClass: string, secondaryText?: string, onClick?: () => void) => (
    <Card 
      className={`shadow-lg transition-shadow duration-300 border-l-4 border-primary/50 ${onClick ? 'cursor-pointer hover:shadow-xl' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoadingStats ? (
              <div className="bg-muted h-9 w-24 rounded mt-1 animate-pulse"></div>
            ) : (
              <p className="text-4xl font-extrabold text-foreground mt-1">{value.toLocaleString()}</p>
            )}
          </div>
          <Icon className={`h-10 w-10 opacity-70 ${colorClass}`} />
        </div>
        {secondaryText && <p className="text-xs mt-3 text-muted-foreground">{secondaryText}</p>}
      </CardContent>
    </Card>
  );

  // Show loading state only on initial load (but still render the structure)
  // This ensures the dashboard is always visible

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar (Header) */}
      <nav className="border-b bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Coordinator Oversight Hub</h1>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsComponent />
            {stats && stats.unread_notifications > 0 && (
              <span className="absolute top-3 right-12 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        
        {statsError && (
            <div className="p-4 mb-6 border border-red-300 bg-red-50 dark:bg-red-900/20 text-destructive rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5"/>
                <div className="flex-1">
                    <p className="text-sm font-medium">Error loading dashboard stats</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {statsError instanceof Error ? statsError.message : 'Failed to load data. Please refresh the page.'}
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                >
                    Refresh
                </Button>
            </div>
        )}
        
        {/* KEY OVERSIGHT METRICS GRID */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {renderStatCard(
              "Pending Employer Verifications", 
              stats?.pending_employer_verification ?? 0, 
              ShieldCheck, 
              "text-yellow-600", 
              "Employers awaiting document approval.",
              () => setActiveTab('verifications')
            )}
            {renderStatCard(
              "Disputed Projects", 
              stats?.disputed_projects ?? 0, 
              X, 
              "text-red-500", 
              "Current projects flagged for review or dispute.",
              () => setActiveTab('disputes')
            )}
            {renderStatCard(
              "Long Pending Applications", 
              stats?.long_pending_applications ?? 0, 
              Clock, 
              "text-blue-500", 
              "Applications stuck in PENDING status (> 7 days).",
              () => setActiveTab('applications')
            )}
            {renderStatCard(
              "Total Users", 
              stats?.total_users ?? 0, 
              Users, 
              "text-gray-500", 
              "Total accounts registered on the platform."
            )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'verifications'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Verifications
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'disputes'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Disputes
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'applications'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Long Pending Applications
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Column 1-3: Main Content Area (3/4th width) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* 1. Pending Employer Verifications List */}
                <Card className="shadow-lg bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <ShieldCheck className="h-5 w-5 text-yellow-600" /> Employer Verification Queue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PendingVerificationList />
                  </CardContent>
                </Card>

                {/* 2. Disputed Projects Overview */}
                <Card className="shadow-lg bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <ClipboardList className="h-5 w-5 text-red-500" /> Projects Requiring Intervention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DisputedProjectsList />
                  </CardContent>
                </Card>

                {/* 3. Long Pending Applications */}
                <Card className="shadow-lg bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Clock className="h-5 w-5 text-blue-500" /> Long Pending Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LongPendingApplicationsList />
                  </CardContent>
                </Card>
              </>
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <Card className="shadow-lg bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                      <ShieldCheck className="h-5 w-5 text-yellow-600" /> Employer Verification Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PendingVerificationList />
                </CardContent>
              </Card>
            )}

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
              <Card className="shadow-lg bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                      <ClipboardList className="h-5 w-5 text-red-500" /> Dispute Resolution Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DisputedProjectsList />
                </CardContent>
              </Card>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <Card className="shadow-lg bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                      <Clock className="h-5 w-5 text-blue-500" /> Long Pending Applications Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LongPendingApplicationsList />
                </CardContent>
              </Card>
            )}

          </div>

          {/* Column 4: Sidebar (Management & Breakdown) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* User Search */}
            <UserSearchComponent />

            {/* Management Links (Coordinator Tools) */}
            <Card className="shadow-lg bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-base py-3 hover:bg-gray-100" 
                  onClick={() => setActiveTab('disputes')}
                >
                  <X className="mr-3 h-5 w-5 text-red-500" />
                  Manage Disputes
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-base py-3 hover:bg-gray-100" 
                  onClick={() => setActiveTab('verifications')}
                >
                  <ShieldCheck className="mr-3 h-5 w-5 text-yellow-500" />
                  Review Verifications
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-base py-3 hover:bg-gray-100" 
                  onClick={() => setActiveTab('applications')}
                >
                  <Clock className="mr-3 h-5 w-5 text-blue-500" />
                  Long Pending Apps
                </Button>
              </CardContent>
            </Card>

            {/* Platform Statistics */}
            <Card className="shadow-lg bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Platform Statistics</CardTitle>
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
                      <span className="text-sm font-medium">Total Jobs</span>
                      <span className="font-bold text-purple-600">{(stats?.total_jobs ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-sm font-medium">Total Applications</span>
                      <span className="font-bold text-indigo-600">{(stats?.total_applications ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-sm font-medium">Laborers</span>
                      <span className="font-bold text-blue-600">{(stats?.total_laborers ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-sm font-medium">Employers</span>
                      <span className="font-bold text-green-600">{(stats?.total_employers ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-sm font-medium">Coordinators</span>
                      <span className="font-bold text-purple-600">{(stats?.total_coordinators ?? 0).toLocaleString()}</span>
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

export default CoordinatorDashboard;