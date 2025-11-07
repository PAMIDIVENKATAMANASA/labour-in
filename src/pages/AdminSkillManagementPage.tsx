// src/pages/AdminUserManagementPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, Edit, CheckCircle, Clock, AlertCircle } from "lucide-react";

type UserData = {
  id: number;
  username: string;
  email: string;
  user_type: string;
  is_active: boolean;
  date_joined: string;
};

type PaginatedUserResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: UserData[];
}

// --- API Fetch Function ---
const fetchAllUsers = (searchTerm: string) => {
  const url = `users/profile/?search=${searchTerm}`;
  return apiFetch<PaginatedUserResponse>(url);
};

// --- Update User Status Function (Deactivate/Approve) ---
const updateUserStatus = ({ userId, isActive }: { userId: number; isActive: boolean }) => {
    return apiFetch<UserData>(`users/profile/${userId}/activate_deactivate/`, {    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
};

// --- NEW: Delete User Function ---
const deleteUser = (userId: number) => {
  return apiFetch<void>(`users/profile/${userId}/`, {
    method: 'DELETE',
  });
};

const AdminUserManagementPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // Initialize navigate

  const { data: userData, isLoading, error } = useQuery<PaginatedUserResponse>({
    queryKey: ["adminAllUsers", searchTerm],
    queryFn: () => fetchAllUsers(searchTerm),
  });
  
  const userList: UserData[] = userData?.results || [];

  // Mutation for Deactivate/Approve
  const statusMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
    },
    onError: (err) => {
      console.error("Failed to update user status:", err);
      alert("Failed to update user status. Check console for details.");
    },
  });

  // NEW: Mutation for Delete
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
    },
    onError: (err) => {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user. Check console for details.");
    },
  });


  const handleStatusToggle = (user: UserData) => {
    const newStatus = !user.is_active;
    statusMutation.mutate({ userId: user.id, isActive: newStatus });
  };
  
  const handleDelete = (userId: number) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
        deleteMutation.mutate(userId);
    }
  };

  if (error)
    return (
      <div className="text-center p-8 text-destructive">
        <AlertCircle className="h-6 w-6 inline mr-2" />
        Error loading user data.
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Manage All Users</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            User Directory
          </CardTitle>
          
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
                        No users found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    userList.map((user) => (
                      <TableRow key={user.id}>
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
                          {/* Deactivate/Approve Button */}
                          

                          {/* Edit Icon - Navigates to a detailed edit page */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Edit Profile"
                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* Delete Icon - Calls the new delete mutation */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Delete User"
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
                          >
                            {deleteMutation.isPending && deleteMutation.variables === user.id ? 
                                <Loader2 className="h-4 w-4 animate-spin text-destructive"/> : 
                                <Trash2 className="h-4 w-4 text-destructive" />
                            }
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
    </div>
  );
};

export default AdminUserManagementPage;