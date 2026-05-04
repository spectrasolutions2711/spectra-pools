import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTechnician } from "@/hooks/useTechnician";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, AlertCircle, Clock, Search, ChevronRight, CalendarDays,
} from "lucide-react";
import { format, parseISO } from "date-fns";

type VisitSummary = {
  id: string;
  visit_date: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  checkin_time: string | null;
  checkout_time: string | null;
  duration_minutes: number | null;
  location: { name: string; city: string } | null;
};

const STATUS_CONFIG = {
  completed:   { label: "Completed",   color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  skipped:     { label: "Skipped",     color: "bg-amber-100 text-amber-700",  icon: AlertCircle  },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700",    icon: Clock        },
  pending:     { label: "Pending",     color: "bg-slate-100 text-slate-600",  icon: Clock        },
} as const;

const TechnicianHistory = () => {
  const navigate = useNavigate();
  const { data: technician, isLoading: techLoading } = useTechnician();
  const [search, setSearch] = useState("");

  const { data: visits = [], isLoading } = useQuery<VisitSummary[]>({
    queryKey: ["my-visit-history", technician?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_visits")
        .select("id, visit_date, status, checkin_time, checkout_time, duration_minutes, location:client_locations(name, city)")
        .eq("technician_id", technician!.id)
        .in("status", ["completed", "skipped"])
        .order("visit_date", { ascending: false })
        .limit(120);
      if (error) throw error;
      return (data || []) as VisitSummary[];
    },
    enabled: !!technician,
  });

  const filtered = visits.filter(v =>
    !search || v.location?.name.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.city.toLowerCase().includes(search.toLowerCase()) ||
    v.visit_date.includes(search)
  );

  // Group by month
  const grouped: Record<string, VisitSummary[]> = {};
  filtered.forEach(v => {
    const key = format(parseISO(v.visit_date), "MMMM yyyy");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  });

  const isPageLoading = techLoading || isLoading;

  return (
    <div className="p-4 space-y-4 animate-fade-in pb-24">
      <div>
        <h1 className="text-xl font-bold text-foreground">Visit History</h1>
        <p className="text-sm text-muted-foreground">Your completed and skipped visits</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by location or date…"
          className="pl-9"
        />
      </div>

      {isPageLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
            {search ? "No visits match your search." : "No visit history yet."}
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([month, monthVisits]) => (
          <div key={month} className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
              {month} · {monthVisits.length} visit{monthVisits.length !== 1 ? "s" : ""}
            </h2>
            {monthVisits.map(v => {
              const cfg = STATUS_CONFIG[v.status];
              const Icon = cfg.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => navigate(`/technician/visit/${v.id}`)}
                  className="w-full text-left"
                >
                  <Card className="border shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{v.location?.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{v.location?.city}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(v.visit_date), "MMM d, yyyy")}
                            </span>
                            {v.duration_minutes && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {v.duration_minutes} min
                              </span>
                            )}
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
        ))
      )}
    </div>
  );
};

export default TechnicianHistory;
