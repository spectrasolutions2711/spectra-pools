import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Users, ClipboardCheck, AlertTriangle, Package } from "lucide-react";
import { format } from "date-fns";

const useDashboardStats = () => {
  const today = format(new Date(), "yyyy-MM-dd");

  const clients = useQuery({
    queryKey: ["dash-clients"],
    queryFn: async () => {
      const { count } = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("active", true);
      return count ?? 0;
    },
  });

  const locations = useQuery({
    queryKey: ["dash-locations"],
    queryFn: async () => {
      const { count } = await supabase.from("client_locations").select("*", { count: "exact", head: true }).eq("active", true);
      return count ?? 0;
    },
  });

  const technicians = useQuery({
    queryKey: ["dash-technicians"],
    queryFn: async () => {
      const { count } = await supabase.from("technicians").select("*", { count: "exact", head: true }).eq("active", true);
      return count ?? 0;
    },
  });

  const visitsToday = useQuery({
    queryKey: ["dash-visits-today", today],
    queryFn: async () => {
      const { count } = await supabase.from("service_visits").select("*", { count: "exact", head: true }).eq("visit_date", today);
      return count ?? 0;
    },
  });

  const alerts = useQuery({
    queryKey: ["dash-alerts"],
    queryFn: async () => {
      const { count } = await supabase
        .from("work_orders")
        .select("*", { count: "exact", head: true })
        .in("priority", ["high", "urgent"])
        .neq("status", "completed");
      return count ?? 0;
    },
  });

  const lowStock = useQuery({
    queryKey: ["dash-low-stock"],
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory")
        .select("quantity_on_hand, low_stock_threshold")
        .not("low_stock_threshold", "is", null);
      return (data || []).filter(i => i.quantity_on_hand < (i.low_stock_threshold ?? 0)).length;
    },
  });

  return { clients, locations, technicians, visitsToday, alerts, lowStock };
};

const StatCard = ({
  label, value, icon: Icon, color, bg, loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  loading: boolean;
}) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-10 mb-1" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { clients, locations, technicians, visitsToday, alerts, lowStock } = useDashboardStats();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const isSetupDone = (clients.data ?? 0) > 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {profile?.first_name || "Admin"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Active Clients"  value={clients.data ?? 0}     icon={Building2}     color="text-blue-600"   bg="bg-blue-50"   loading={clients.isLoading} />
        <StatCard label="Locations"       value={locations.data ?? 0}   icon={MapPin}         color="text-teal-600"   bg="bg-teal-50"   loading={locations.isLoading} />
        <StatCard label="Technicians"     value={technicians.data ?? 0} icon={Users}          color="text-purple-600" bg="bg-purple-50" loading={technicians.isLoading} />
        <StatCard label="Visits Today"    value={visitsToday.data ?? 0} icon={ClipboardCheck} color="text-green-600"  bg="bg-green-50"  loading={visitsToday.isLoading} />
        <StatCard label="Active Alerts"   value={alerts.data ?? 0}      icon={AlertTriangle}  color="text-amber-600"  bg="bg-amber-50"  loading={alerts.isLoading} />
        <StatCard label="Low Stock Items" value={lowStock.data ?? 0}    icon={Package}        color="text-red-600"    bg="bg-red-50"    loading={lowStock.isLoading} />
      </div>

      {/* Alert badges */}
      {((alerts.data ?? 0) > 0 || (lowStock.data ?? 0) > 0) && (
        <div className="flex gap-2 flex-wrap">
          {(alerts.data ?? 0) > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {alerts.data} urgent work order{(alerts.data ?? 0) !== 1 ? "s" : ""}
            </Badge>
          )}
          {(lowStock.data ?? 0) > 0 && (
            <Badge variant="outline" className="border-red-300 text-red-600 gap-1">
              <Package className="h-3 w-3" />
              {lowStock.data} item{(lowStock.data ?? 0) !== 1 ? "s" : ""} low on stock
            </Badge>
          )}
        </div>
      )}

      {/* Setup guide if no clients */}
      {!clients.isLoading && !isSetupDone && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              🚀 Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Complete the initial setup to start managing your pool service operations:</p>
            <ol className="list-decimal list-inside space-y-1 text-foreground">
              <li>Add your first <strong>Client</strong> (e.g. EOS Fitness) in the Clients section</li>
              <li>Add <strong>Locations</strong> for each gym</li>
              <li>Configure <strong>Pool Areas</strong> (Pool, SPA, Tank) per location</li>
              <li>Create <strong>Technician</strong> accounts via the Technicians section</li>
              <li>Set up <strong>Routes</strong> and assign technicians</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
