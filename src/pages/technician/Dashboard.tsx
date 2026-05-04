import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTechnician } from "@/hooks/useTechnician";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Clock, CheckCircle2, PlayCircle, ChevronRight,
  Waves, CalendarDays, AlertCircle,
} from "lucide-react";
import { format, isToday } from "date-fns";
import { toast } from "sonner";

type RouteStop = {
  id: string;
  stop_order: number;
  estimated_service_minutes: number | null;
  location: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
};

type VisitStatus = "pending" | "in_progress" | "completed" | "skipped";

type TodayVisit = {
  id: string;
  location_id: string;
  status: VisitStatus;
  checkin_time: string | null;
  checkout_time: string | null;
};

const STATUS_CONFIG: Record<VisitStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:     { label: "Not Started", color: "bg-slate-100 text-slate-600",   icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700",     icon: PlayCircle },
  completed:   { label: "Completed",   color: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  skipped:     { label: "Skipped",     color: "bg-amber-100 text-amber-700",   icon: AlertCircle },
};

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { profile } = useAuth();
  const { data: technician, isLoading: techLoading } = useTechnician();

  const today = new Date();
  const todayName = format(today, "EEEE");
  const todayDate = format(today, "yyyy-MM-dd");

  // Find today's route for this technician
  const { data: routeStops = [], isLoading: stopsLoading } = useQuery<RouteStop[]>({
    queryKey: ["my-route-stops", technician?.id, todayName],
    queryFn: async () => {
      if (!technician) return [];
      // Find active route for today's day
      const { data: routes } = await supabase
        .from("routes")
        .select("id")
        .eq("technician_id", technician.id)
        .eq("active", true)
        .contains("day_of_week", [todayName]);

      if (!routes?.length) return [];
      const routeId = routes[0].id;

      const { data: stops, error } = await supabase
        .from("route_stops")
        .select(`
          id, stop_order, estimated_service_minutes,
          location:client_locations(id, name, address, city, state)
        `)
        .eq("route_id", routeId)
        .order("stop_order");

      if (error) throw error;
      return (stops || []) as RouteStop[];
    },
    enabled: !!technician,
  });

  // Load today's visits for each stop location
  const { data: todayVisits = [] } = useQuery<TodayVisit[]>({
    queryKey: ["my-visits-today", technician?.id, todayDate],
    queryFn: async () => {
      if (!technician) return [];
      const { data, error } = await supabase
        .from("service_visits")
        .select("id, location_id, status, checkin_time, checkout_time")
        .eq("technician_id", technician.id)
        .eq("visit_date", todayDate);
      if (error) throw error;
      return (data || []) as TodayVisit[];
    },
    enabled: !!technician,
  });

  const startVisit = useMutation({
    mutationFn: async (locationId: string) => {
      if (!technician) throw new Error("No technician record");
      // Check if visit already exists
      const existing = todayVisits.find(v => v.location_id === locationId);
      if (existing) return existing.id;
      // Create new visit
      const { data, error } = await supabase
        .from("service_visits")
        .insert({
          location_id: locationId,
          technician_id: technician.id,
          visit_date: todayDate,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (visitId) => {
      qc.invalidateQueries({ queryKey: ["my-visits-today"] });
      navigate(`/technician/visit/${visitId}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visitFor = (locationId: string) => todayVisits.find(v => v.location_id === locationId);

  const completedCount = routeStops.filter(s => visitFor(s.location.id)?.status === "completed").length;
  const totalMinutes = routeStops.reduce((acc, s) => acc + (s.estimated_service_minutes || 30), 0);
  const isLoading = techLoading || stopsLoading;

  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 space-y-4 animate-fade-in pb-24">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">{format(today, "EEEE, MMMM d")}</p>
        <h1 className="text-xl font-bold text-foreground">
          {greeting}, {profile?.first_name || "Technician"}
        </h1>
      </div>

      {/* Progress card */}
      <Card className="bg-primary text-primary-foreground border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">Today's Progress</p>
              {isLoading ? (
                <Skeleton className="h-10 w-20 mt-1 bg-white/20" />
              ) : (
                <p className="text-4xl font-bold mt-1">
                  {completedCount}
                  <span className="text-2xl text-primary-foreground/70">/{routeStops.length}</span>
                </p>
              )}
              <p className="text-primary-foreground/80 text-sm mt-1">pools completed</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary-foreground/80 text-sm justify-end">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
              </div>
              <p className="text-primary-foreground/60 text-xs mt-1">est. total time</p>
              <div className="flex items-center gap-1 text-primary-foreground/80 text-sm justify-end mt-2">
                <CalendarDays className="h-4 w-4" />
                <span>{todayName}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {routeStops.length > 0 && (
            <div className="mt-3 bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${(completedCount / routeStops.length) * 100}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync status */}
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>All changes are synced</span>
      </div>

      {/* Route stops */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : !technician ? (
        <Card className="border-dashed border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Your account is not linked to a technician record. Contact your administrator.
          </CardContent>
        </Card>
      ) : routeStops.length === 0 ? (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              <Waves className="h-4 w-4" /> No route for today
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No service stops are scheduled for {todayName}. Check back or contact your supervisor.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Route — {routeStops.length} stop{routeStops.length !== 1 ? "s" : ""}
          </h2>
          {routeStops.map((stop, idx) => {
            const visit = visitFor(stop.location.id);
            const status: VisitStatus = visit?.status || "pending";
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            const isCompleted = status === "completed";

            return (
              <button
                key={stop.id}
                onClick={() => startVisit.mutate(stop.location.id)}
                disabled={startVisit.isPending}
                className="w-full text-left"
              >
                <Card className={`border transition-all active:scale-[0.98] ${isCompleted ? "opacity-70" : "shadow-sm hover:shadow-md"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Stop number */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isCompleted ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{stop.location.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span>{stop.location.address}, {stop.location.city}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ~{stop.estimated_service_minutes || 30} min
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
