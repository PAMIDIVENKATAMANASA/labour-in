import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Index from "./pages/Index"
import LaborerDashboard from "./pages/LaborerDashboard"
import EmployerDashboard from "./pages/EmployerDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import CoordinatorDashboard from "./pages/CoordinatorDashboard"
import NotFound from "./pages/NotFound"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import FindWork from "./pages/FindWork"
import HireTalent from "./pages/HireTalent"
import About from "./pages/About"
import Contact from "./pages/Contact"
import Terms from "./pages/Terms"
import AdminSkillManagementPage from "./pages/AdminSkillManagementPage"
import AdminUserManagementPage from "./pages/AdminUserManagementPage"
import ApplyJob from "./pages/ApplyJob"
import ProtectedRoute from "./components/ProtectedRoute"
// --- NEW IMPORTS ---
import EmployerJobDetails from "./pages/EmployerJobDetails"
import EmployerApplicants from "./pages/EmployerApplicants"
// --- END NEW IMPORTS ---

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* --- PUBLIC & GENERAL ROUTES --- */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/find-work" element={<FindWork />} />
          <Route path="/hire-talent" element={<HireTalent />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/jobs/:id/apply" element={<ApplyJob />} />
          

          {/* --- PROTECTED ROUTES GROUP --- */}
          
          {/* COORDINATOR ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['COORDINATOR']} />}>
            <Route path="/dashboard/coordinator" element={<CoordinatorDashboard />} />
            {/* You would add other coordinator pages here: */}
            {/* <Route path="/coordinator/disputes" element={...} /> */}
          </Route>

          {/* EMPLOYER ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYER']} />}>
            <Route path="/dashboard/employer" element={<EmployerDashboard />} />
            <Route path="/dashboard/employer/jobs/:id" element={<EmployerJobDetails />} />
            <Route path="/dashboard/employer/applicants" element={<EmployerApplicants />} />
          </Route>
          
          {/* ADMIN ROUTES (Cleaned up and separated) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            {/* Main Admin Dashboard */}
            <Route path="/admin" element={<AdminDashboard />} /> 
            
            {/* User Management List and Detail View (FIXED DYNAMIC ROUTE) */}
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
            <Route path="/admin/users/:userId" element={<AdminUserManagementPage />} /> 

            <Route path="/admin/jobs" element={<div>Manage Job Posts Page (TBD)</div>} />
            <Route path="/admin/skills" element={<AdminSkillManagementPage />} />
          </Route>
          
          {/* LABORER ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['LABORER']} />}>
            <Route path="/dashboard/laborer" element={<LaborerDashboard />} />
          </Route>
          
          {/* --- END PROTECTED ROUTES GROUP --- */}
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App