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
import AdminClients from "@/pages/admin/Clients";
import AdminLocations from "@/pages/admin/Locations";
import AdminTechnicians from "@/pages/admin/Technicians";
import AdminRoutes from "@/pages/admin/Routes";
import AdminInventory from "@/pages/admin/Inventory";
import AdminInvoices from "@/pages/admin/Invoices";
import TechnicianDashboard from "@/pages/technician/Dashboard";
import TechnicianVisit from "@/pages/technician/Visit";
import TechnicianHistory from "@/pages/technician/History";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientHistory from "@/pages/client/History";
import ClientReports from "@/pages/client/Reports";

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
            <Route path="clients" element={<AdminClients />} />
            <Route path="locations" element={<AdminLocations />} />
            <Route path="technicians" element={<AdminTechnicians />} />
            <Route path="routes" element={<AdminRoutes />} />
            <Route path="visits" element={<div className="p-6 text-muted-foreground">Visits — coming in Phase 3</div>} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="reports" element={<div className="p-6 text-muted-foreground">Reports — coming in Phase 6</div>} />
            <Route path="settings" element={<div className="p-6 text-muted-foreground">Settings — coming soon</div>} />
          </Route>

          {/* Technician visit — full-screen, no layout shell */}
          <Route
            path="/technician/visit/:visitId"
            element={
              <ProtectedRoute allowedRoles={["technician"]}>
                <TechnicianVisit />
              </ProtectedRoute>
            }
          />

          {/* Technician routes — with layout */}
          <Route
            path="/technician"
            element={
              <ProtectedRoute allowedRoles={["technician"]}>
                <TechnicianLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TechnicianDashboard />} />
            <Route path="history" element={<TechnicianHistory />} />
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
            <Route path="history" element={<ClientHistory />} />
            <Route path="reports" element={<ClientReports />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
