import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import TechnicianLayout from "@/layouts/TechnicianLayout";
import ClientLayout from "@/layouts/ClientLayout";

// Pages
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/admin/Dashboard";
import TechnicianDashboard from "@/pages/technician/Dashboard";
import ClientDashboard from "@/pages/client/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
});

const RoleRedirect = () => {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "technician") return <Navigate to="/technician" replace />;
  if (role === "client") return <Navigate to="/client" replace />;
  return <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <SonnerToaster />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            {/* Future admin pages will be added here */}
            <Route path="clients" element={<div className="p-6 text-muted-foreground">Clients — coming in Phase 2</div>} />
            <Route path="locations" element={<div className="p-6 text-muted-foreground">Locations — coming in Phase 2</div>} />
            <Route path="technicians" element={<div className="p-6 text-muted-foreground">Technicians — coming in Phase 2</div>} />
            <Route path="routes" element={<div className="p-6 text-muted-foreground">Routes — coming in Phase 2</div>} />
            <Route path="visits" element={<div className="p-6 text-muted-foreground">Visits — coming in Phase 2</div>} />
            <Route path="inventory" element={<div className="p-6 text-muted-foreground">Inventory — coming in Phase 4</div>} />
            <Route path="invoices" element={<div className="p-6 text-muted-foreground">Invoices — coming in Phase 6</div>} />
            <Route path="reports" element={<div className="p-6 text-muted-foreground">Reports — coming in Phase 6</div>} />
            <Route path="settings" element={<div className="p-6 text-muted-foreground">Settings — coming soon</div>} />
          </Route>

          {/* Technician routes */}
          <Route
            path="/technician"
            element={
              <ProtectedRoute allowedRoles={["technician"]}>
                <TechnicianLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TechnicianDashboard />} />
            <Route path="history" element={<div className="p-4 text-muted-foreground">Visit History — coming in Phase 3</div>} />
          </Route>

          {/* Client routes */}
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="history" element={<div className="text-muted-foreground">Visit History — coming in Phase 5</div>} />
            <Route path="reports" element={<div className="text-muted-foreground">Reports — coming in Phase 5</div>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
