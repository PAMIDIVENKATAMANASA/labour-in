// src/pages/AdminUserManagementPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useParams } from 'react-router-dom'; 

// --- REQUIRED UI COMPONENT IMPORTS ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// IMPORTS NEEDED FOR THE EDIT MODAL:
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { 
    Loader2, Trash2, Edit, CheckCircle, Clock, AlertCircle, X, ArrowLeft
} from "lucide-react";


// --- TYPE DEFINITIONS ---
export type UserData = {
  id: number;
  username: string;
  email: string;
  user_type: 'ADMIN' | 'COORDINATOR' | 'EMPLOYER' | 'LABORER';
  is_active: boolean;
  date_joined: string;
};

type PaginatedUserResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: UserData[];
}


// --- API Fetch and Mutation Functions ---
const fetchSingleUser = (userId: string) => {
    return apiFetch<UserData>(`users/profile/${userId}/`);
}

const fetchAllUsers = (searchTerm: string) => {
  const url = `users/profile/?search=${searchTerm}`;
  return apiFetch<PaginatedUserResponse>(url);
};

const updateUserStatus = ({ userId, isActive }: { userId: number; isActive: boolean }) => {
  return apiFetch<UserData>(`users/profile/${userId}/activate_deactivate/`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
};

const deleteUser = (userId: number) => {
  return apiFetch<void>(`users/profile/${userId}/`, {
    method: 'DELETE',
  });
};

const editUser = ({ userId, data }: { userId: number, data: Partial<UserData> }) => {
    return apiFetch<UserData>(`users/profile/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};


const AdminUserManagementPage = () => {
  const queryClient = useQueryClient();
  const { userId: urlUserId } = useParams<{ userId: string }>(); // Use a distinct name for the URL parameter
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<UserData | null>(null);

  // --- MAIN DATA QUERY LOGIC ---
  // Determine if we are in single view mode by checking if urlUserId is a non-empty string
  const isSingleUserView = !!urlUserId; 
  const queryKey = isSingleUserView ? ["adminSingleUser", urlUserId] : ["adminAllUsers", searchTerm];
  
  const { data, isLoading, error } = useQuery<PaginatedUserResponse | UserData>({
    queryKey: queryKey,
    // The query function changes based on the presence of urlUserId
    queryFn: () => isSingleUserView
        ? fetchSingleUser(urlUserId as string) 
        : fetchAllUsers(searchTerm),
        
    // --- FINAL FIX: STRICT ENABLED FLAG ---
    // If we are in single view, query is only enabled if urlUserId is a truthy string.
    // If we are in list view, query is always enabled.
    enabled: isSingleUserView ? !!urlUserId : true,
  });
  
  // Adapt data structure: List of users vs. single user wrapped in an array
  const userList: UserData[] = isSingleUserView 
    ? (data as UserData) ? [data as UserData] : [] // Single user mode
    : (data as PaginatedUserResponse)?.results || []; // List mode
    
  // Get the single user data for display if in single-view mode
  const singleUser = userList.length > 0 ? userList[0] : null;


  // --- MUTATIONS (omitted for brevity, assume they are the same) ---
  const statusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: (updatedUserData) => {
      queryClient.invalidateQueries({ queryKey: ["adminSingleUser", String(updatedUserData.id)], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"], refetchType: 'all' }); 
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
    },
    onError: (err) => {
      console.error("Failed to update user status:", err);
      alert("Failed to update user status. Check console for details.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"] });
      alert("User deleted successfully!");
    },
    onError: (err) => {
        console.error("Failed to delete user:", err);
        alert("Failed to delete user. Check console for details.");
    }
  });

  const editMutation = useMutation({
    mutationFn: editUser,
    onSuccess: (updatedUserData) => {
        queryClient.setQueryData(["adminSingleUser", String(updatedUserData.id)], updatedUserData);
        queryClient.setQueryData(
            ["adminAllUsers", searchTerm],
            (oldData: PaginatedUserResponse | undefined) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                results: oldData.results.map(user => 
                  user.id === updatedUserData.id ? updatedUserData : user
                ),
              };
            }
          );
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"], refetchType: 'all' }); 
      queryClient.invalidateQueries({ queryKey: ["adminSingleUser", String(updatedUserData.id)], refetchType: 'all' });
      setIsEditModalOpen(false);
      setCurrentUserToEdit(null);
      alert("User profile updated successfully!");
    },
    onError: (err) => {
      console.error("Failed to edit user:", err);
      alert("Failed to edit user. Check console for details.");
    }
  });


  // --- HANDLERS (omitted for brevity, assume they are the same) ---
  const handleStatusToggle = (user: UserData) => {
    if (confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'approve'} ${user.username}?`)) {
        const newStatus = !user.is_active;
        statusMutation.mutate({ userId: user.id, isActive: newStatus });
    }
  };
  
  const handleDeleteUser = (user: UserData) => {
    if (confirm(`Are you sure you want to PERMANENTLY delete the user ${user.username} (${user.user_type})? This action cannot be undone.`)) {
        deleteMutation.mutate(user.id);
    }
  };

  const handleEditClick = (user: UserData) => {
    setCurrentUserToEdit(user);
    setIsEditModalOpen(true);
  };
  
  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUserToEdit) return;
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const updatedData: Partial<UserData> = {
          username: formData.get('username') as string,
          email: formData.get('email') as string,
          user_type: formData.get('user_type') as UserData['user_type'],
      };
      editMutation.mutate({ userId: currentUserToEdit.id, data: updatedData });
  };


  if (error)
    return (
      <div className="text-center p-8 text-destructive">
        <AlertCircle className="h-6 w-6 inline mr-2" />
        Error loading user data.
      </div>
    );

  // --- RENDER LOGIC for Single View Status ---

  if (isSingleUserView && isLoading) {
      return (
        <div className="flex justify-center p-10 h-screen items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className='ml-2 text-primary'>Loading User Profile...</p>
        </div>
      )
  }
  
  if (isSingleUserView && !singleUser && !isLoading) {
      return (
          <div className="text-center p-8">
              <AlertCircle className="h-6 w-6 inline mr-2" />
              User with ID "{urlUserId}" not found or unauthorized.
              <div className='mt-4'>
                 <Button onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
                 </Button>
              </div>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dynamic Title and Back Button */}
      <div className="flex items-center mb-6">
        {isSingleUserView && (
          <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-3xl font-bold">
            {isSingleUserView ? `Profile: ${singleUser?.username}` : 'Manage All Users'}
        </h1>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {isSingleUserView ? 'User Details' : 'User Directory'}
          </CardTitle>
          <div className="mt-4">
            {/* Show Search Input only in list view */}
            
            {/* Display single user metadata if in view profile mode */}
            {isSingleUserView && singleUser && (
                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <p><strong>ID:</strong> {singleUser.id}</p>
                    <p><strong>Email:</strong> {singleUser.email}</p>
                    <p><strong>Type:</strong> {singleUser.user_type}</p>
                    <p><strong>Status:</strong> {singleUser.is_active ? 'Active' : 'Pending'}</p>
                    <p><strong>Joined:</strong> {new Date(singleUser.date_joined).toLocaleDateString()}</p>
                </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        {isSingleUserView ? `User ID ${urlUserId} not found.` : 'No users found matching your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    userList.map((user) => (
                      <TableRow key={user.id} className={isSingleUserView ? 'bg-blue-50/50 hover:bg-blue-100/50' : ''}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.user_type}</TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600">
                              <Clock className="h-4 w-4 mr-1" /> Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                        {/* Status Toggle Button (Restored for single view actions) */}
                        

                        {/* EDIT BUTTON (Click Handler is here) */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Edit Profile"
                            onClick={() => handleEditClick(user)}
                            disabled={deleteMutation.isPending || editMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        
                        {/* DELETE BUTTON (Functional) */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Delete User"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
                          >
                            {deleteMutation.isPending && deleteMutation.variables === user.id ? (
                                <Loader2 className="h-4 w-4 text-destructive animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* --- CORRECTED EDIT MODAL JSX --- */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit User: {currentUserToEdit?.username}</DialogTitle>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-4 top-4" 
                    onClick={() => setIsEditModalOpen(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" defaultValue={currentUserToEdit?.username} required />
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={currentUserToEdit?.email} required />
                </div>
                <div>
                    <Label htmlFor="user_type">User Type</Label>
                    <select 
                        id="user_type" 
                        name="user_type" 
                        defaultValue={currentUserToEdit?.user_type} 
                        required
                        className="block w-full p-2 border border-gray-300 rounded-md focus:border-primary focus:ring focus:ring-primary/50"
                    >
                        <option value="ADMIN">ADMIN</option>
                        <option value="COORDINATOR">COORDINATOR</option>
                        <option value="EMPLOYER">EMPLOYER</option>
                        <option value="LABORER">LABORER</option>
                    </select>
                </div>
                <Button type="submit" disabled={editMutation.isPending}>
                    {editMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Save Changes"}
                </Button>
            </form>
        </DialogContent>
      </Dialog>
      {/* --- END OF CORRECTED MODAL JSX --- */}

    </div>
  );
};

export default AdminUserManagementPage;