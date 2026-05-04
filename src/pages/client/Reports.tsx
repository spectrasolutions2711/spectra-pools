import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useClientRecord } from "@/hooks/useClientRecord";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, AlertTriangle, CheckCircle2, Droplets } from "lucide-react";
import { format, parseISO } from "date-fns";

type Location = { id: string; name: string };
type PoolArea = { id: string; name: string; area_type: string };
type Reading = {
  id: string;
  recorded_at: string;
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  orp: number | null;
  alkalinity: number | null;
  stabilizer_cya: number | null;
  total_hardness: number | null;
  temperature: number | null;
};

const RANGES: Record<string, { min: number; max: number; label: string; unit: string; color: string }> = {
  ph:             { min: 7.2, max: 7.8,  label: "pH",           unit: "",    color: "#3b82f6" },
  free_chlorine:  { min: 1.0, max: 3.0,  label: "Free Cl",      unit: "ppm", color: "#10b981" },
  orp:            { min: 600, max: 800,  label: "ORP",           unit: "mV",  color: "#8b5cf6" },
  alkalinity:     { min: 80,  max: 120,  label: "Alkalinity",    unit: "ppm", color: "#f59e0b" },
  stabilizer_cya: { min: 30,  max: 50,   label: "CYA",           unit: "ppm", color: "#ef4444" },
  total_hardness: { min: 200, max: 400,  label: "Hardness",      unit: "ppm", color: "#14b8a6" },
};

const inRange = (val: number | null, key: string) => {
  if (val == null) return null;
  const r = RANGES[key];
  if (!r) return null;
  return val >= r.min && val <= r.max;
};

const StatusDot = ({ ok }: { ok: boolean | null }) => {
  if (ok === null) return <span className="text-muted-foreground">—</span>;
  return ok
    ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" />
    : <AlertTriangle className="h-4 w-4 text-amber-500 inline" />;
};

const ClientReports = () => {
  const { data: clientRecord, isLoading: clientLoading } = useClientRecord();
  const [locationId, setLocationId] = useState<string>("");
  const [areaId, setAreaId] = useState<string>("");
  const [chartParam, setChartParam] = useState<string>("ph");

  const clientId = clientRecord?.client_id;

  const { data: locations = [], isLoading: locLoading } = useQuery<Location[]>({
    queryKey: ["client-report-locations", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("client_locations")
        .select("id, name")
        .eq("client_id", clientId!)
        .eq("active", true)
        .order("name");
      return (data || []) as Location[];
    },
    enabled: !!clientId,
  });

  const { data: areas = [] } = useQuery<PoolArea[]>({
    queryKey: ["client-report-areas", locationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("pool_areas")
        .select("id, name, area_type")
        .eq("location_id", locationId)
        .eq("active", true)
        .in("area_type", ["POOL", "SPA"])
        .order("name");
      return (data || []) as PoolArea[];
    },
    enabled: !!locationId,
  });

  const { data: readings = [], isLoading: readingsLoading } = useQuery<Reading[]>({
    queryKey: ["client-report-readings", areaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_readings")
        .select("id, recorded_at, ph, free_chlorine, total_chlorine, orp, alkalinity, stabilizer_cya, total_hardness, temperature")
        .eq("area_id", areaId)
        .eq("reading_section", "TEST")
        .order("recorded_at", { ascending: true })
        .limit(30);
      if (error) throw error;
      return (data || []) as Reading[];
    },
    enabled: !!areaId,
  });

  const chartData = readings.map(r => ({
    date: format(parseISO(r.recorded_at), "MM/dd"),
    ph: r.ph,
    free_chlorine: r.free_chlorine,
    orp: r.orp,
    alkalinity: r.alkalinity,
    stabilizer_cya: r.stabilizer_cya,
    total_hardness: r.total_hardness,
  }));

  const latestReading = readings.at(-1);

  const range = RANGES[chartParam];

  if (clientLoading || locLoading) return (
    <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Water Quality Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Chemical parameter trends for your pools</p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Location</p>
          <Select value={locationId} onValueChange={v => { setLocationId(v); setAreaId(""); }}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Select location…" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {areas.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Pool / Spa</p>
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select area…" />
              </SelectTrigger>
              <SelectContent>
                {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.area_type})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {areaId && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Chart parameter</p>
            <Select value={chartParam} onValueChange={setChartParam}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RANGES).map(([k, r]) => (
                  <SelectItem key={k} value={k}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!locationId && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground text-sm">
            <Droplets className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Select a location and pool area to view water quality data.
          </CardContent>
        </Card>
      )}

      {locationId && !areaId && areas.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            Select a pool or spa area above to view its readings.
          </CardContent>
        </Card>
      )}

      {areaId && (
        <>
          {/* Trend chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {range?.label} Trend
                <span className="text-xs font-normal text-muted-foreground">
                  (target {range?.min}–{range?.max} {range?.unit})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {readingsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : readings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No readings recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip
                      formatter={(v: number) => [`${v} ${range?.unit || ""}`, range?.label]}
                      labelStyle={{ fontSize: 12 }}
                      contentStyle={{ fontSize: 12 }}
                    />
                    {range && (
                      <>
                        <ReferenceLine y={range.min} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} label={{ value: `Min ${range.min}`, fontSize: 10, fill: "#10b981" }} />
                        <ReferenceLine y={range.max} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: `Max ${range.max}`, fontSize: 10, fill: "#ef4444" }} />
                      </>
                    )}
                    <Line
                      type="monotone"
                      dataKey={chartParam}
                      stroke={range?.color || "#3b82f6"}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Latest reading summary */}
          {latestReading && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Latest Reading — {format(parseISO(latestReading.recorded_at), "MMM d, yyyy · h:mm a")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(RANGES).map(([key, r]) => {
                    const val = latestReading[key as keyof Reading] as number | null;
                    const ok = inRange(val, key);
                    return (
                      <div key={key} className={`rounded-lg border p-3 ${ok === false ? "border-amber-200 bg-amber-50" : ok === true ? "border-green-200 bg-green-50/50" : ""}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground font-medium">{r.label}</span>
                          <StatusDot ok={ok} />
                        </div>
                        <p className={`text-lg font-bold ${ok === false ? "text-amber-700" : ok === true ? "text-green-700" : "text-muted-foreground"}`}>
                          {val != null ? `${val}` : "—"}
                          {val != null && r.unit && <span className="text-xs font-normal ml-0.5">{r.unit}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {r.min}–{r.max} {r.unit}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reading history table */}
          {readings.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reading History</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Date</th>
                      {Object.entries(RANGES).map(([k, r]) => (
                        <th key={k} className="text-right text-xs font-medium text-muted-foreground pb-2 px-2">
                          {r.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...readings].reverse().map(r => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                          {format(parseISO(r.recorded_at), "MMM d")}
                        </td>
                        {(["ph", "free_chlorine", "orp", "alkalinity", "stabilizer_cya", "total_hardness"] as const).map(key => {
                          const val = r[key];
                          const ok = inRange(val, key);
                          return (
                            <td key={key} className={`py-2 px-2 text-right font-mono text-xs ${ok === false ? "text-amber-600 font-semibold" : ok === true ? "text-green-700" : "text-muted-foreground"}`}>
                              {val != null ? val : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ClientReports;
