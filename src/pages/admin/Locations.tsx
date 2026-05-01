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
import { Textarea } from "@/components/ui/textarea";
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
import { MapPin, Plus, Pencil, Search, Layers } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const schema = z.object({
  client_id: z.string().min(1, "Client is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  service_days: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Location = {
  id: string;
  client_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  service_days: string[] | null;
  notes: string | null;
  active: boolean;
  created_at: string;
};

type Client = { id: string; name: string };

const AdminLocations = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [areasDialogOpen, setAreasDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").eq("active", true).order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_locations").select("*").order("name");
      if (error) throw error;
      return data as Location[];
    },
  });

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { service_days: [] },
  });

  const selectedDays = watch("service_days") || [];

  const upsertMutation = useMutation({
    mutationFn: async (values: FormValues & { id?: string }) => {
      const payload = {
        client_id: values.client_id,
        name: values.name,
        address: values.address,
        city: values.city,
        state: values.state,
        zip: values.zip || null,
        contact_name: values.contact_name || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
        service_days: values.service_days?.length ? values.service_days : null,
        notes: values.notes || null,
      };
      if (values.id) {
        const { error } = await supabase.from("client_locations").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("client_locations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success(editing ? "Location updated" : "Location created");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("client_locations").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ client_id: "", name: "", address: "", city: "", state: "", zip: "", contact_name: "", contact_email: "", contact_phone: "", service_days: [], notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    reset({
      client_id: loc.client_id,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zip: loc.zip || "",
      contact_name: loc.contact_name || "",
      contact_email: loc.contact_email || "",
      contact_phone: loc.contact_phone || "",
      service_days: loc.service_days || [],
      notes: loc.notes || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const onSubmit = (values: FormValues) => {
    upsertMutation.mutate({ ...values, id: editing?.id });
  };

  const clientName = (id: string) => clients.find(c => c.id === id)?.name || "—";

  const filtered = locations.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase());
    const matchesClient = clientFilter === "all" || l.client_id === clientFilter;
    return matchesSearch && matchesClient;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Locations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage client locations and pool areas</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Location
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search locations…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {search || clientFilter !== "all" ? "No locations match your filters." : "No locations yet. Create your first location."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Service Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(loc => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-muted-foreground">{clientName(loc.client_id)}</TableCell>
                  <TableCell className="text-muted-foreground">{loc.city}, {loc.state}</TableCell>
                  <TableCell>
                    {loc.service_days?.length
                      ? <div className="flex gap-1 flex-wrap">
                          {loc.service_days.map(d => (
                            <Badge key={d} variant="outline" className="text-xs px-1.5">{d.slice(0, 3)}</Badge>
                          ))}
                        </div>
                      : <span className="text-muted-foreground text-sm">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={loc.active}
                        onCheckedChange={checked => toggleActiveMutation.mutate({ id: loc.id, active: checked })}
                      />
                      <Badge variant={loc.active ? "default" : "secondary"}>
                        {loc.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(loc)} title="Edit location">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedLocation(loc); setAreasDialogOpen(true); }} title="Manage pool areas">
                        <Layers className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Location Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Location" : "New Location"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Controller
                name="client_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.client_id && <p className="text-xs text-destructive">{errors.client_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Location Name *</Label>
              <Input {...register("name")} placeholder="e.g. EOS Fitness – Chandler" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Street Address *</Label>
              <Input {...register("address")} placeholder="123 Pool Ave" />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1.5">
                <Label>City *</Label>
                <Input {...register("city")} placeholder="Phoenix" />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>State *</Label>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>ZIP</Label>
                <Input {...register("zip")} placeholder="85001" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Site Contact</Label>
                <Input {...register("contact_name")} placeholder="Jane Smith" />
              </div>
              <div className="space-y-1.5">
                <Label>Site Phone</Label>
                <Input {...register("contact_phone")} placeholder="(555) 000-0000" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Service Days</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {DAYS.map(day => {
                  const checked = selectedDays.includes(day);
                  return (
                    <label key={day} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={v => {
                          const next = v
                            ? [...selectedDays, day]
                            : selectedDays.filter(d => d !== day);
                          setValue("service_days", next);
                        }}
                      />
                      <span className="text-sm">{day.slice(0, 3)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} placeholder="Access instructions, special requirements…" rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Saving…" : editing ? "Save Changes" : "Create Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pool Areas Dialog */}
      {selectedLocation && (
        <PoolAreasDialog
          location={selectedLocation}
          open={areasDialogOpen}
          onClose={() => setAreasDialogOpen(false)}
        />
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// Pool Areas sub-dialog
// ──────────────────────────────────────────────────────────

const areaSchema = z.object({
  area_type: z.enum(["POOL", "SPA", "TANK"]),
  name: z.string().min(1, "Name is required"),
  gallons: z.string().optional(),
  filter_type: z.string().optional(),
  system_type: z.string().optional(),
  has_heater: z.boolean().default(false),
  notes: z.string().optional(),
});

type AreaFormValues = z.infer<typeof areaSchema>;

type PoolArea = {
  id: string;
  location_id: string;
  area_type: "POOL" | "SPA" | "TANK";
  name: string;
  gallons: number | null;
  filter_type: string | null;
  system_type: string | null;
  has_heater: boolean;
  notes: string | null;
  active: boolean;
};

const AREA_TYPE_COLORS: Record<string, string> = {
  POOL: "bg-blue-100 text-blue-700",
  SPA: "bg-purple-100 text-purple-700",
  TANK: "bg-teal-100 text-teal-700",
};

const PoolAreasDialog = ({ location, open, onClose }: { location: Location; open: boolean; onClose: () => void }) => {
  const qc = useQueryClient();
  const [editingArea, setEditingArea] = useState<PoolArea | null>(null);
  const [areaFormOpen, setAreaFormOpen] = useState(false);

  const { data: areas = [], isLoading } = useQuery<PoolArea[]>({
    queryKey: ["pool-areas", location.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_areas")
        .select("*")
        .eq("location_id", location.id)
        .order("area_type");
      if (error) throw error;
      return data as PoolArea[];
    },
    enabled: open,
  });

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: { area_type: "POOL", has_heater: false },
  });

  const hasHeater = watch("has_heater");

  const upsertArea = useMutation({
    mutationFn: async (values: AreaFormValues & { id?: string }) => {
      const payload = {
        location_id: location.id,
        area_type: values.area_type,
        name: values.name,
        gallons: values.gallons ? parseInt(values.gallons) : null,
        filter_type: values.filter_type || null,
        system_type: values.system_type || null,
        has_heater: values.has_heater,
        notes: values.notes || null,
      };
      if (values.id) {
        const { error } = await supabase.from("pool_areas").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pool_areas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pool-areas", location.id] });
      toast.success(editingArea ? "Area updated" : "Area added");
      setAreaFormOpen(false);
      setEditingArea(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleArea = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("pool_areas").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pool-areas", location.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openAreaCreate = () => {
    setEditingArea(null);
    reset({ area_type: "POOL", name: "", gallons: "", filter_type: "", system_type: "", has_heater: false, notes: "" });
    setAreaFormOpen(true);
  };

  const openAreaEdit = (area: PoolArea) => {
    setEditingArea(area);
    reset({
      area_type: area.area_type,
      name: area.name,
      gallons: area.gallons ? String(area.gallons) : "",
      filter_type: area.filter_type || "",
      system_type: area.system_type || "",
      has_heater: area.has_heater,
      notes: area.notes || "",
    });
    setAreaFormOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Pool Areas — {location.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAreaCreate}>
              <Plus className="h-4 w-4 mr-1" /> Add Area
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : areas.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No pool areas configured for this location.
            </div>
          ) : (
            <div className="space-y-2">
              {areas.map(area => (
                <div key={area.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${AREA_TYPE_COLORS[area.area_type]}`}>
                      {area.area_type}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{area.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          area.gallons ? `${area.gallons.toLocaleString()} gal` : null,
                          area.filter_type,
                          area.has_heater ? "Heater" : null,
                        ].filter(Boolean).join(" · ") || "No details"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={area.active}
                      onCheckedChange={checked => toggleArea.mutate({ id: area.id, active: checked })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openAreaEdit(area)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Area form sub-dialog */}
        <Dialog open={areaFormOpen} onOpenChange={setAreaFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingArea ? "Edit Pool Area" : "Add Pool Area"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(v => upsertArea.mutate({ ...v, id: editingArea?.id }))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type *</Label>
                  <Controller
                    name="area_type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POOL">Pool</SelectItem>
                          <SelectItem value="SPA">Spa</SelectItem>
                          <SelectItem value="TANK">Tank</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input {...register("name")} placeholder="Main Pool" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gallons</Label>
                  <Input {...register("gallons")} placeholder="75000" type="number" />
                </div>
                <div className="space-y-1.5">
                  <Label>Filter Type</Label>
                  <Input {...register("filter_type")} placeholder="Sand / Cartridge / DE" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>System Type</Label>
                <Input {...register("system_type")} placeholder="Salt / Chlorine / UV" />
              </div>

              <div className="flex items-center gap-3">
                <Controller
                  name="has_heater"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label className="cursor-pointer">Has Heater</Label>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea {...register("notes")} rows={2} placeholder="Heater model, special notes…" />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAreaFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={upsertArea.isPending}>
                  {upsertArea.isPending ? "Saving…" : editingArea ? "Save" : "Add Area"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default AdminLocations;
