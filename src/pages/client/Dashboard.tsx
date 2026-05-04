import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useClientRecord } from "@/hooks/useClientRecord";
import { supabase } from "@/integrations/supabase/client";
import {
  Waves, CheckCircle2, AlertTriangle, Calendar, ChevronRight,
  MapPin, Clock, Building2,
} from "lucide-react";
import { format, startOfMonth, parseISO } from "date-fns";

type Location = { id: string; name: string; city: string; active: boolean };
type RecentVisit = {
  id: string;
  visit_date: string;
  status: string;
  duration_minutes: number | null;
  location: { name: string; city: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  completed:   "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  skipped:     "bg-amber-100 text-amber-700",
  pending:     "bg-slate-100 text-slate-600",
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: clientRecord, isLoading: clientLoading } = useClientRecord();

  const clientId = clientRecord?.client_id;

  const { data: locations = [], isLoading: locLoading } = useQuery<Location[]>({
    queryKey: ["client-locations", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_locations")
        .select("id, name, city, active")
        .eq("client_id", clientId!)
        .eq("active", true);
      if (error) throw error;
      return (data || []) as Location[];
    },
    enabled: !!clientId,
  });

  const locationIds = locations.map(l => l.id);

  const { data: recentVisits = [], isLoading: visitsLoading } = useQuery<RecentVisit[]>({
    queryKey: ["client-recent-visits", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_visits")
        .select("id, visit_date, status, duration_minutes, location:client_locations(name, city)")
        .in("location_id", locationIds)
        .order("visit_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as RecentVisit[];
    },
    enabled: locationIds.length > 0,
  });

  const { data: visitsThisMonth = 0 } = useQuery<number>({
    queryKey: ["client-visits-month", clientId],
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const { count } = await supabase
        .from("service_visits")
        .select("id", { count: "exact", head: true })
        .in("location_id", locationIds)
        .eq("status", "completed")
        .gte("visit_date", monthStart);
      return count || 0;
    },
    enabled: locationIds.length > 0,
  });

  const { data: openAlerts = 0 } = useQuery<number>({
    queryKey: ["client-alerts", clientId],
    queryFn: async () => {
      const { count } = await supabase
        .from("items_needed")
        .select("id", { count: "exact", head: true })
        .in("location_id", locationIds)
        .eq("resolved", false);
      return count || 0;
    },
    enabled: locationIds.length > 0,
  });

  const isLoading = clientLoading || locLoading;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (isLoading) return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );

  if (!clientRecord) return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Pool Service Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{greeting}, {profile?.first_name}</p>
      </div>
      <Card className="border-dashed border-amber-300 bg-amber-50">
        <CardContent className="p-6 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          Your account is not yet linked to a client. Contact your administrator.
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pool Service Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {greeting}, {profile?.first_name} — {format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{locations.length}</p>
              <p className="text-xs text-muted-foreground">Active Locations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              {visitsLoading ? <Skeleton className="h-8 w-8" /> : <p className="text-2xl font-bold">{visitsThisMonth}</p>}
              <p className="text-xs text-muted-foreground">Visits This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${openAlerts > 0 ? "bg-amber-50" : "bg-slate-50"}`}>
              <AlertTriangle className={`h-5 w-5 ${openAlerts > 0 ? "text-amber-600" : "text-slate-400"}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${openAlerts > 0 ? "text-amber-600" : ""}`}>{openAlerts}</p>
              <p className="text-xs text-muted-foreground">Open Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Your Locations
        </h2>
        {locations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No locations configured yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map(loc => (
              <Card key={loc.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Waves className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{loc.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" /> {loc.city}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent visits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Visits</h2>
          <button onClick={() => navigate("/client/history")} className="text-xs text-primary hover:underline">
            View all
          </button>
        </div>
        {visitsLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : recentVisits.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              <Calendar className="h-6 w-6 mx-auto mb-2 opacity-30" />
              No recent visits yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentVisits.map(v => (
              <Card key={v.id} className="border shadow-sm">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.location?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[v.status] || STATUS_COLOR.pending}`}>
                        {v.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(v.visit_date), "MMM d, yyyy")}
                      </span>
                      {v.duration_minutes && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {v.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
