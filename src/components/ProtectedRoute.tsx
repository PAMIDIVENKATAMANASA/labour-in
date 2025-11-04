// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from "@/lib/auth"; // Utility to check auth state

type UserRole = 'LABORER' | 'EMPLOYER' | 'COORDINATOR' | 'ADMIN';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  // 1. Check if ANY user is logged in
  const user = getCurrentUser();

  if (!user || !user.user_type) {
    // If no user/token found, redirect to Login
    return <Navigate to={`/login?next=${window.location.pathname}`} replace />;
  }

  // 2. Check if the logged-in user has an allowed role
  const userRole = user.user_type.toUpperCase() as UserRole;

  if (!allowedRoles.includes(userRole)) {
    // If user is logged in but not allowed, redirect to their dashboard
    const dashboardPath = user.user_type
      ? `/dashboard/${user.user_type.toLowerCase()}`
      : "/";

    return <Navigate to={dashboardPath} replace />;
  }

  // 3. If authorized, render the child component
  return <Outlet />;
};

export default ProtectedRoute;
