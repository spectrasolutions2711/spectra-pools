import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Route as RouteIcon, Plus, Pencil, ListOrdered, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const routeSchema = z.object({
  name: z.string().min(1, "Route name is required"),
  technician_id: z.string().optional(),
  day_of_week: z.array(z.string()).min(1, "Select at least one day"),
});

type RouteFormValues = z.infer<typeof routeSchema>;

type RouteRow = {
  id: string;
  name: string;
  technician_id: string | null;
  day_of_week: string[] | null;
  active: boolean;
  created_at: string;
  technician?: {
    profile: { first_name: string | null; last_name: string | null } | null;
  } | null;
  stop_count?: number;
};

type Technician = {
  id: string;
  user_id: string;
  profile: { first_name: string | null; last_name: string | null } | null;
};

type RouteStop = {
  id: string;
  route_id: string;
  location_id: string;
  stop_order: number;
  estimated_service_minutes: number | null;
  location?: { name: string; city: string; state: string } | null;
};

type Location = { id: string; name: string; city: string; state: string };

const AdminRoutes = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stopsOpen, setStopsOpen] = useState(false);
  const [editing, setEditing] = useState<RouteRow | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteRow | null>(null);

  const { data: routes = [], isLoading } = useQuery<RouteRow[]>({
    queryKey: ["routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routes")
        .select(`
          id, name, technician_id, day_of_week, active, created_at,
          technician:technicians(profile:profiles!technicians_user_id_fkey(first_name, last_name))
        `)
        .order("name");
      if (error) throw error;
      // Fetch stop counts
      const ids = (data || []).map((r: RouteRow) => r.id);
      let counts: Record<string, number> = {};
      if (ids.length) {
        const { data: stops } = await supabase
          .from("route_stops")
          .select("route_id")
          .in("route_id", ids);
        (stops || []).forEach((s: { route_id: string }) => {
          counts[s.route_id] = (counts[s.route_id] || 0) + 1;
        });
      }
      return (data || []).map((r: RouteRow) => ({ ...r, stop_count: counts[r.id] || 0 }));
    },
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["technicians-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technicians")
        .select("id, user_id, profile:profiles!technicians_user_id_fkey(first_name, last_name)")
        .eq("active", true);
      if (error) throw error;
      return (data || []) as Technician[];
    },
  });

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: { day_of_week: [] },
  });

  const selectedDays = watch("day_of_week") || [];

  const upsertMutation = useMutation({
    mutationFn: async (values: RouteFormValues & { id?: string }) => {
      const payload = {
        name: values.name,
        technician_id: values.technician_id || null,
        day_of_week: values.day_of_week,
      };
      if (values.id) {
        const { error } = await supabase.from("routes").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("routes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] });
      toast.success(editing ? "Route updated" : "Route created");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("routes").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", technician_id: "", day_of_week: [] });
    setDialogOpen(true);
  };

  const openEdit = (route: RouteRow) => {
    setEditing(route);
    reset({
      name: route.name,
      technician_id: route.technician_id || "",
      day_of_week: route.day_of_week || [],
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const techName = (tech: Technician) =>
    `${tech.profile?.first_name || ""} ${tech.profile?.last_name || ""}`.trim() || "Unknown";

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RouteIcon className="h-6 w-6 text-primary" /> Routes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage service routes and stop sequences</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Route
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : routes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No routes yet. Create your first service route.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Name</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map(route => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">{route.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {route.technician?.profile
                      ? `${route.technician.profile.first_name || ""} ${route.technician.profile.last_name || ""}`.trim()
                      : <span className="italic text-sm">Unassigned</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(route.day_of_week || []).map(d => (
                        <Badge key={d} variant="outline" className="text-xs px-1.5">{d.slice(0, 3)}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{route.stop_count} stop{route.stop_count !== 1 ? "s" : ""}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={route.active}
                        onCheckedChange={checked => toggleMutation.mutate({ id: route.id, active: checked })}
                      />
                      <Badge variant={route.active ? "default" : "secondary"}>
                        {route.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(route)} title="Edit route">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedRoute(route); setStopsOpen(true); }} title="Manage stops">
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Route Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Route" : "New Route"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(v => upsertMutation.mutate({ ...v, id: editing?.id }))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Route Name *</Label>
              <Input {...register("name")} placeholder="e.g. Monday North Phoenix" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Technician</Label>
              <Controller
                name="technician_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— Unassigned —</SelectItem>
                      {technicians.map(t => (
                        <SelectItem key={t.id} value={t.id}>{techName(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Service Days *</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {DAYS.map(day => {
                  const checked = selectedDays.includes(day);
                  return (
                    <label key={day} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={v => {
                          const next = v ? [...selectedDays, day] : selectedDays.filter(d => d !== day);
                          setValue("day_of_week", next);
                        }}
                      />
                      <span className="text-sm">{day.slice(0, 3)}</span>
                    </label>
                  );
                })}
              </div>
              {errors.day_of_week && <p className="text-xs text-destructive">{errors.day_of_week.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Create Route"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stops Management Dialog */}
      {selectedRoute && (
        <StopsDialog
          route={selectedRoute}
          open={stopsOpen}
          onClose={() => setStopsOpen(false)}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// Route Stops management
// ──────────────────────────────────────────────────────────

const StopsDialog = ({ route, open, onClose }: { route: RouteRow; open: boolean; onClose: () => void }) => {
  const qc = useQueryClient();
  const [addingStop, setAddingStop] = useState(false);
  const [newLocationId, setNewLocationId] = useState("");
  const [newMinutes, setNewMinutes] = useState("30");

  const { data: stops = [], isLoading: stopsLoading } = useQuery<RouteStop[]>({
    queryKey: ["route-stops", route.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("route_stops")
        .select("id, route_id, location_id, stop_order, estimated_service_minutes, location:client_locations(name, city, state)")
        .eq("route_id", route.id)
        .order("stop_order");
      if (error) throw error;
      return (data || []) as RouteStop[];
    },
    enabled: open,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["locations-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_locations")
        .select("id, name, city, state")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as Location[];
    },
    enabled: open,
  });

  const addStop = useMutation({
    mutationFn: async () => {
      if (!newLocationId) throw new Error("Select a location");
      const nextOrder = stops.length + 1;
      const { error } = await supabase.from("route_stops").insert({
        route_id: route.id,
        location_id: newLocationId,
        stop_order: nextOrder,
        estimated_service_minutes: parseInt(newMinutes) || 30,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["route-stops", route.id] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      setNewLocationId("");
      setNewMinutes("30");
      setAddingStop(false);
      toast.success("Stop added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeStop = useMutation({
    mutationFn: async (stopId: string) => {
      const { error } = await supabase.from("route_stops").delete().eq("id", stopId);
      if (error) throw error;
      // Reorder remaining stops
      const remaining = stops.filter(s => s.id !== stopId);
      for (let i = 0; i < remaining.length; i++) {
        await supabase.from("route_stops").update({ stop_order: i + 1 }).eq("id", remaining[i].id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["route-stops", route.id] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      toast.success("Stop removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveStop = useMutation({
    mutationFn: async ({ stopId, direction }: { stopId: string; direction: "up" | "down" }) => {
      const idx = stops.findIndex(s => s.id === stopId);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= stops.length) return;

      const a = stops[idx];
      const b = stops[swapIdx];
      await supabase.from("route_stops").update({ stop_order: b.stop_order }).eq("id", a.id);
      await supabase.from("route_stops").update({ stop_order: a.stop_order }).eq("id", b.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route-stops", route.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const usedLocationIds = new Set(stops.map(s => s.location_id));
  const availableLocations = locations.filter(l => !usedLocationIds.has(l.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-primary" />
            Route Stops — {route.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {stopsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : stops.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No stops added yet.</p>
          ) : (
            stops.map((stop, idx) => (
              <div key={stop.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {stop.stop_order}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{stop.location?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {stop.location?.city}, {stop.location?.state} · {stop.estimated_service_minutes || 30} min
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" disabled={idx === 0} onClick={() => moveStop.mutate({ stopId: stop.id, direction: "up" })}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={idx === stops.length - 1} onClick={() => moveStop.mutate({ stopId: stop.id, direction: "down" })}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeStop.mutate(stop.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Add stop form */}
          {addingStop ? (
            <div className="p-3 border rounded-lg border-dashed space-y-3">
              <Label className="text-sm">Add Stop</Label>
              <Select value={newLocationId} onValueChange={setNewLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.length === 0
                    ? <SelectItem value="__none__" disabled>All locations already added</SelectItem>
                    : availableLocations.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name} — {l.city}, {l.state}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Est. minutes:</Label>
                <Input value={newMinutes} onChange={e => setNewMinutes(e.target.value)} type="number" className="w-20" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addStop.mutate()} disabled={!newLocationId || addStop.isPending}>
                  {addStop.isPending ? "Adding…" : "Add Stop"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAddingStop(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setAddingStop(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Stop
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminRoutes;
