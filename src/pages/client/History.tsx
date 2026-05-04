import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useClientRecord } from "@/hooks/useClientRecord";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, AlertCircle, Clock, Search, CalendarDays,
} from "lucide-react";
import { format, parseISO } from "date-fns";

type VisitRow = {
  id: string;
  visit_date: string;
  status: string;
  checkin_time: string | null;
  checkout_time: string | null;
  duration_minutes: number | null;
  location: { name: string; city: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed:   { label: "Completed",   color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  skipped:     { label: "Skipped",     color: "bg-amber-100 text-amber-700",  icon: AlertCircle  },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700",    icon: Clock        },
  pending:     { label: "Pending",     color: "bg-slate-100 text-slate-600",  icon: Clock        },
};

const ClientHistory = () => {
  const { data: clientRecord, isLoading: clientLoading } = useClientRecord();
  const [search, setSearch] = useState("");

  const clientId = clientRecord?.client_id;

  const { data: locationIds = [], isLoading: locLoading } = useQuery<string[]>({
    queryKey: ["client-location-ids", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("client_locations")
        .select("id")
        .eq("client_id", clientId!);
      return (data || []).map(l => l.id);
    },
    enabled: !!clientId,
  });

  const { data: visits = [], isLoading: visitsLoading } = useQuery<VisitRow[]>({
    queryKey: ["client-visit-history", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_visits")
        .select("id, visit_date, status, checkin_time, checkout_time, duration_minutes, location:client_locations(name, city)")
        .in("location_id", locationIds)
        .order("visit_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as VisitRow[];
    },
    enabled: locationIds.length > 0,
  });

  const filtered = visits.filter(v =>
    !search ||
    (v.location?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    v.visit_date.includes(search)
  );

  const grouped: Record<string, VisitRow[]> = {};
  filtered.forEach(v => {
    const key = format(parseISO(v.visit_date), "MMMM yyyy");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  });

  const isLoading = clientLoading || locLoading || visitsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Visit History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All service visits for your locations</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by location or date…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
            {search ? "No visits match your search." : "No visit history yet."}
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([month, monthVisits]) => (
          <div key={month} className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {month} · {monthVisits.length} visit{monthVisits.length !== 1 ? "s" : ""}
            </h2>
            {monthVisits.map(v => {
              const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <Card key={v.id} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{v.location?.name}</p>
                        <p className="text-xs text-muted-foreground">{v.location?.city}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                            <Icon className="h-3 w-3" /> {cfg.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(v.visit_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground space-y-0.5">
                        {v.checkin_time && (
                          <p>In: {format(new Date(v.checkin_time), "h:mm a")}</p>
                        )}
                        {v.checkout_time && (
                          <p>Out: {format(new Date(v.checkout_time), "h:mm a")}</p>
                        )}
                        {v.duration_minutes && (
                          <p className="font-medium text-foreground">{v.duration_minutes} min</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};

export default ClientHistory;
