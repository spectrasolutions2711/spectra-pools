import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useTechnician } from "@/hooks/useTechnician";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Clock, CheckCircle2, Droplets, FlaskConical,
  StickyNote, Plus, Trash2, Loader2, LogIn, LogOut,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────

type Visit = {
  id: string;
  location_id: string;
  technician_id: string;
  visit_date: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  checkin_time: string | null;
  checkout_time: string | null;
  duration_minutes: number | null;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
  } | null;
};

type PoolArea = {
  id: string;
  name: string;
  area_type: "POOL" | "SPA";
  gallons: number | null;
  has_heater: boolean;
  filter_type: string | null;
  system_type: string | null;
};

type WaterReading = {
  id: string;
  area_id: string;
  reading_section: "TEST" | "HEATER";
  ph: number | null;
  orp: number | null;
  orp_setpoint: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  alkalinity: number | null;
  stabilizer_cya: number | null;
  total_hardness: number | null;
  phosphates: number | null;
  salt: number | null;
  temperature: number | null;
  notes: string | null;
};

type Dosage = {
  id: string;
  area_id: string | null;
  product_id: string;
  quantity: number;
  unit: string;
  product: { name: string; category: string | null } | null;
};

type Product = { id: string; name: string; unit: string; category: string | null };

type ReadingForm = {
  ph: string; orp: string; orp_setpoint: string;
  free_chlorine: string; total_chlorine: string;
  alkalinity: string; stabilizer_cya: string;
  total_hardness: string; phosphates: string;
  salt: string; temperature: string; notes: string;
};

// ─── Reading field config ─────────────────────────────────

const READING_FIELDS: { key: keyof ReadingForm; label: string; unit: string; min?: number; max?: number }[] = [
  { key: "ph",            label: "pH",            unit: "",    min: 6.8,  max: 8.0 },
  { key: "orp",           label: "ORP",           unit: "mV",  min: 600,  max: 800 },
  { key: "free_chlorine", label: "Free Cl",       unit: "ppm", min: 1.0,  max: 3.0 },
  { key: "total_chlorine",label: "Total Cl",      unit: "ppm", min: 1.0,  max: 3.0 },
  { key: "alkalinity",    label: "Alkalinity",    unit: "ppm", min: 80,   max: 120 },
  { key: "stabilizer_cya",label: "CYA",           unit: "ppm", min: 30,   max: 50  },
  { key: "total_hardness",label: "Hardness",      unit: "ppm", min: 200,  max: 400 },
  { key: "phosphates",    label: "Phosphates",    unit: "ppb", min: 0,    max: 100 },
  { key: "salt",          label: "Salt",          unit: "ppm", min: 2700, max: 3400 },
  { key: "temperature",   label: "Temp",          unit: "°F"  },
];

const HEATER_FIELDS: { key: keyof ReadingForm; label: string; unit: string }[] = [
  { key: "ph",            label: "pH",      unit: ""    },
  { key: "orp",           label: "ORP",     unit: "mV"  },
  { key: "free_chlorine", label: "Free Cl", unit: "ppm" },
  { key: "temperature",   label: "Temp",    unit: "°F"  },
  { key: "orp_setpoint",  label: "ORP Set", unit: "mV"  },
];

const getStatus = (val: string, min?: number, max?: number): "good" | "warn" | "—" => {
  if (!val || !min || !max) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return n >= min && n <= max ? "good" : "warn";
};

const readingToForm = (r: WaterReading | undefined): Partial<ReadingForm> => ({
  ph:             r?.ph?.toString() || "",
  orp:            r?.orp?.toString() || "",
  orp_setpoint:   r?.orp_setpoint?.toString() || "",
  free_chlorine:  r?.free_chlorine?.toString() || "",
  total_chlorine: r?.total_chlorine?.toString() || "",
  alkalinity:     r?.alkalinity?.toString() || "",
  stabilizer_cya: r?.stabilizer_cya?.toString() || "",
  total_hardness: r?.total_hardness?.toString() || "",
  phosphates:     r?.phosphates?.toString() || "",
  salt:           r?.salt?.toString() || "",
  temperature:    r?.temperature?.toString() || "",
  notes:          r?.notes || "",
});

// ─── Main component ───────────────────────────────────────

const TechnicianVisit = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: technician } = useTechnician();

  // Load visit
  const { data: visit, isLoading: visitLoading } = useQuery<Visit | null>({
    queryKey: ["visit", visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_visits")
        .select("*, location:client_locations(name, address, city, state)")
        .eq("id", visitId!)
        .single();
      if (error) throw error;
      return data as Visit;
    },
    enabled: !!visitId,
  });

  // Load pool areas
  const { data: areas = [] } = useQuery<PoolArea[]>({
    queryKey: ["visit-areas", visit?.location_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_areas")
        .select("id, name, area_type, gallons, has_heater, filter_type, system_type")
        .eq("location_id", visit!.location_id)
        .eq("active", true)
        .in("area_type", ["POOL", "SPA"])
        .order("area_type");
      if (error) throw error;
      return (data || []) as PoolArea[];
    },
    enabled: !!visit?.location_id,
  });

  // Load existing readings
  const { data: readings = [] } = useQuery<WaterReading[]>({
    queryKey: ["visit-readings", visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_readings")
        .select("*")
        .eq("visit_id", visitId!);
      if (error) throw error;
      return (data || []) as WaterReading[];
    },
    enabled: !!visitId,
  });

  // Load dosages
  const { data: dosages = [] } = useQuery<Dosage[]>({
    queryKey: ["visit-dosages", visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chemical_dosages")
        .select("id, area_id, product_id, quantity, unit, product:products(name, category)")
        .eq("visit_id", visitId!);
      if (error) throw error;
      return (data || []) as Dosage[];
    },
    enabled: !!visitId,
  });

  // Load products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit, category")
        .eq("active", true)
        .order("category");
      if (error) throw error;
      return (data || []) as Product[];
    },
  });

  // Check-in
  const checkIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("service_visits")
        .update({ checkin_time: new Date().toISOString(), status: "in_progress" })
        .eq("id", visitId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit", visitId] });
      qc.invalidateQueries({ queryKey: ["my-visits-today"] });
      toast.success("Checked in");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Check-out
  const checkOut = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const checkinTime = visit?.checkin_time ? new Date(visit.checkin_time) : now;
      const duration = Math.round((now.getTime() - checkinTime.getTime()) / 60000);
      const { error } = await supabase
        .from("service_visits")
        .update({
          checkout_time: now.toISOString(),
          status: "completed",
          duration_minutes: duration,
        })
        .eq("id", visitId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit", visitId] });
      qc.invalidateQueries({ queryKey: ["my-visits-today"] });
      toast.success("Visit completed!");
      navigate("/technician");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (visitLoading) return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  if (!visit) return (
    <div className="p-4 text-center text-muted-foreground pt-20">Visit not found.</div>
  );

  const isCheckedIn = !!visit.checkin_time;
  const isCompleted = visit.status === "completed";

  return (
    <div className="pb-28 animate-fade-in">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/technician")} className="p-1 -ml-1 rounded-lg hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{visit.location?.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {visit.location?.address}, {visit.location?.city}
          </p>
        </div>
        <Badge variant={isCompleted ? "default" : visit.status === "in_progress" ? "secondary" : "outline"}>
          {isCompleted ? "Completed" : visit.status === "in_progress" ? "In Progress" : "Pending"}
        </Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* Check-in / Check-out card */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                {isCheckedIn ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <LogIn className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Checked in:</span>
                    <span className="font-medium">{format(new Date(visit.checkin_time!), "h:mm a")}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not checked in yet</p>
                )}
                {visit.checkout_time && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <LogOut className="h-4 w-4 text-blue-600" />
                    <span className="text-muted-foreground">Checked out:</span>
                    <span className="font-medium">{format(new Date(visit.checkout_time), "h:mm a")}</span>
                    {visit.duration_minutes && (
                      <span className="text-muted-foreground">({visit.duration_minutes} min)</span>
                    )}
                  </div>
                )}
              </div>
              {!isCompleted && (
                !isCheckedIn ? (
                  <Button onClick={() => checkIn.mutate()} disabled={checkIn.isPending} size="sm" className="gap-1.5">
                    {checkIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Check In
                  </Button>
                ) : (
                  <Button onClick={() => checkOut.mutate()} disabled={checkOut.isPending} variant="outline" size="sm" className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50">
                    {checkOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Check Out
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="readings">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="readings" className="gap-1.5 text-xs">
              <Droplets className="h-3.5 w-3.5" /> Readings
            </TabsTrigger>
            <TabsTrigger value="chemicals" className="gap-1.5 text-xs">
              <FlaskConical className="h-3.5 w-3.5" /> Chemicals
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 text-xs">
              <StickyNote className="h-3.5 w-3.5" /> Notes
            </TabsTrigger>
          </TabsList>

          {/* ── READINGS tab ── */}
          <TabsContent value="readings" className="space-y-4 mt-4">
            {areas.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No pool areas configured for this location.
                </CardContent>
              </Card>
            ) : (
              areas.map(area => (
                <AreaReadingCard
                  key={area.id}
                  area={area}
                  visitId={visitId!}
                  existingTest={readings.find(r => r.area_id === area.id && r.reading_section === "TEST")}
                  existingHeater={area.has_heater ? readings.find(r => r.area_id === area.id && r.reading_section === "HEATER") : undefined}
                  readonly={isCompleted}
                />
              ))
            )}
          </TabsContent>

          {/* ── CHEMICALS tab ── */}
          <TabsContent value="chemicals" className="space-y-4 mt-4">
            <DosagesSection
              visitId={visitId!}
              areas={areas}
              dosages={dosages}
              products={products}
              readonly={isCompleted}
            />
          </TabsContent>

          {/* ── NOTES tab ── */}
          <TabsContent value="notes" className="mt-4">
            <NotesSection visitId={visitId!} readonly={isCompleted} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ─── Area Reading Card ────────────────────────────────────

const AreaReadingCard = ({
  area, visitId, existingTest, existingHeater, readonly,
}: {
  area: PoolArea;
  visitId: string;
  existingTest?: WaterReading;
  existingHeater?: WaterReading;
  readonly: boolean;
}) => {
  const qc = useQueryClient();
  const [showHeater, setShowHeater] = useState(false);

  const { register: regTest, handleSubmit: submitTest, watch: watchTest } = useForm<ReadingForm>({
    defaultValues: { ...readingToForm(existingTest), notes: existingTest?.notes || "" },
  });

  const { register: regHeat, handleSubmit: submitHeat } = useForm<ReadingForm>({
    defaultValues: readingToForm(existingHeater),
  });

  const saveReading = useMutation({
    mutationFn: async ({ form, section, existingId }: {
      form: ReadingForm; section: "TEST" | "HEATER"; existingId?: string;
    }) => {
      const payload = {
        visit_id: visitId,
        area_id: area.id,
        reading_section: section,
        ph:             parseFloat(form.ph)             || null,
        orp:            parseFloat(form.orp)            || null,
        orp_setpoint:   parseFloat(form.orp_setpoint)   || null,
        free_chlorine:  parseFloat(form.free_chlorine)  || null,
        total_chlorine: parseFloat(form.total_chlorine) || null,
        alkalinity:     parseFloat(form.alkalinity)     || null,
        stabilizer_cya: parseFloat(form.stabilizer_cya) || null,
        total_hardness: parseFloat(form.total_hardness) || null,
        phosphates:     parseFloat(form.phosphates)     || null,
        salt:           parseFloat(form.salt)           || null,
        temperature:    parseFloat(form.temperature)    || null,
        notes:          form.notes || null,
      };
      if (existingId) {
        const { error } = await supabase.from("water_readings").update(payload).eq("id", existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("water_readings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-readings", visitId] });
      toast.success("Readings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testValues = watchTest();
  const AREA_COLOR = area.area_type === "POOL" ? "bg-blue-50 border-blue-200" : "bg-purple-50 border-purple-200";
  const BADGE_COLOR = area.area_type === "POOL" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700";

  return (
    <Card className={`border ${AREA_COLOR}`}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_COLOR}`}>
              {area.area_type}
            </span>
            <CardTitle className="text-base">{area.name}</CardTitle>
          </div>
          {area.gallons && (
            <span className="text-xs text-muted-foreground">{area.gallons.toLocaleString()} gal</span>
          )}
        </div>
        {(area.filter_type || area.system_type) && (
          <p className="text-xs text-muted-foreground">
            {[area.filter_type, area.system_type].filter(Boolean).join(" · ")}
          </p>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {/* Test readings */}
        <form onSubmit={submitTest(f => saveReading.mutate({ form: f, section: "TEST", existingId: existingTest?.id }))}>
          <div className="space-y-2">
            {READING_FIELDS.map(({ key, label, unit, min, max }) => {
              const val = testValues[key] as string;
              const status = getStatus(val, min, max);
              return (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground w-24 shrink-0">{label}</label>
                  <div className="relative flex-1">
                    <input
                      {...regTest(key)}
                      type="number"
                      step="0.01"
                      disabled={readonly}
                      placeholder="—"
                      className={`w-full h-9 px-3 rounded-md border text-sm font-medium bg-background
                        focus:outline-none focus:ring-1 focus:ring-ring
                        disabled:opacity-60 disabled:cursor-not-allowed
                        ${status === "good" ? "border-green-300 bg-green-50/50" : status === "warn" ? "border-amber-300 bg-amber-50/50" : ""}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 shrink-0">{unit}</span>
                  {status !== "—" && (
                    <div className={`w-2 h-2 rounded-full shrink-0 ${status === "good" ? "bg-green-500" : "bg-amber-500"}`} />
                  )}
                </div>
              );
            })}
            {/* Notes */}
            <div className="flex items-start gap-2 pt-1">
              <label className="text-sm text-muted-foreground w-24 shrink-0 pt-2">Notes</label>
              <textarea
                {...regTest("notes")}
                disabled={readonly}
                placeholder="Observations…"
                rows={2}
                className="flex-1 px-3 py-2 rounded-md border text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
              />
            </div>
          </div>
          {!readonly && (
            <Button type="submit" size="sm" className="w-full mt-3" disabled={saveReading.isPending}>
              {saveReading.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {existingTest ? "Update Readings" : "Save Readings"}
            </Button>
          )}
        </form>

        {/* Heater section */}
        {area.has_heater && (
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setShowHeater(!showHeater)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full"
            >
              <Clock className="h-4 w-4" />
              Heater Readings
              <span className="ml-auto text-xs">{showHeater ? "▲" : "▼"}</span>
            </button>
            {showHeater && (
              <form onSubmit={submitHeat(f => saveReading.mutate({ form: f, section: "HEATER", existingId: existingHeater?.id }))} className="mt-3 space-y-2">
                {HEATER_FIELDS.map(({ key, label, unit }) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground w-24 shrink-0">{label}</label>
                    <input
                      {...regHeat(key)}
                      type="number"
                      step="0.01"
                      disabled={readonly}
                      placeholder="—"
                      className="flex-1 h-9 px-3 rounded-md border text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
                    />
                    <span className="text-xs text-muted-foreground w-10 shrink-0">{unit}</span>
                  </div>
                ))}
                {!readonly && (
                  <Button type="submit" size="sm" variant="outline" className="w-full mt-2" disabled={saveReading.isPending}>
                    {existingHeater ? "Update Heater" : "Save Heater"}
                  </Button>
                )}
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Dosages Section ──────────────────────────────────────

const DosagesSection = ({
  visitId, areas, dosages, products, readonly,
}: {
  visitId: string; areas: PoolArea[]; dosages: Dosage[]; products: Product[]; readonly: boolean;
}) => {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [productId, setProductId] = useState("");
  const [areaId, setAreaId] = useState("none");
  const [quantity, setQuantity] = useState("");

  const selectedProduct = products.find(p => p.id === productId);

  const addDosage = useMutation({
    mutationFn: async () => {
      if (!productId || !quantity) throw new Error("Select a product and quantity");
      const { error } = await supabase.from("chemical_dosages").insert({
        visit_id: visitId,
        product_id: productId,
        area_id: areaId === "none" ? null : areaId,
        quantity: parseFloat(quantity),
        unit: selectedProduct?.unit || "oz",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-dosages", visitId] });
      toast.success("Chemical logged");
      setProductId(""); setAreaId("none"); setQuantity(""); setAdding(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeDosage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chemical_dosages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visit-dosages", visitId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {dosages.length === 0 && !adding && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No chemicals logged yet.
          </CardContent>
        </Card>
      )}

      {dosages.map(d => (
        <Card key={d.id} className="border">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{d.product?.name}</p>
              <p className="text-xs text-muted-foreground">
                {d.quantity} {d.unit}
                {d.area_id && ` · ${areas.find(a => a.id === d.area_id)?.name || "Area"}`}
              </p>
            </div>
            {!readonly && (
              <button onClick={() => removeDosage.mutate(d.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </CardContent>
        </Card>
      ))}

      {adding ? (
        <Card className="border-dashed border-primary/40">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Product *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Quantity *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={`Amount in ${selectedProduct?.unit || "units"}`}
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Applied to</Label>
                <Select value={areaId} onValueChange={setAreaId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addDosage.mutate()} disabled={!productId || !quantity || addDosage.isPending}>
                {addDosage.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Log Chemical
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : !readonly && (
        <Button variant="outline" className="w-full gap-1.5" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add Chemical
        </Button>
      )}
    </div>
  );
};

// ─── Notes Section ────────────────────────────────────────

const NotesSection = ({ visitId, readonly }: { visitId: string; readonly: boolean }) => {
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [itemText, setItemText] = useState("");

  const { data: notes = [] } = useQuery<{ id: string; note: string; created_at: string }[]>({
    queryKey: ["visit-notes", visitId],
    queryFn: async () => {
      const { data, error } = await supabase.from("visit_notes").select("*").eq("visit_id", visitId).order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!visitId,
  });

  const { data: items = [] } = useQuery<{ id: string; description: string; resolved: boolean }[]>({
    queryKey: ["visit-items", visitId],
    queryFn: async () => {
      const { data, error } = await supabase.from("items_needed").select("id, description, resolved").eq("visit_id", visitId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!visitId,
  });

  const { data: visit } = useQuery<{ location_id: string }>({
    queryKey: ["visit-location", visitId],
    queryFn: async () => {
      const { data } = await supabase.from("service_visits").select("location_id").eq("id", visitId).single();
      return data as { location_id: string };
    },
    enabled: !!visitId,
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("visit_notes").insert({ visit_id: visitId, note: noteText.trim() });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["visit-notes", visitId] }); setNoteText(""); toast.success("Note saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addItem = useMutation({
    mutationFn: async () => {
      if (!visit?.location_id) throw new Error("Missing location");
      const { error } = await supabase.from("items_needed").insert({
        visit_id: visitId,
        location_id: visit.location_id,
        description: itemText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["visit-items", visitId] }); setItemText(""); toast.success("Item added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      {/* Visit Notes */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Visit Notes</h3>
        {notes.map(n => (
          <Card key={n.id} className="border">
            <CardContent className="p-3">
              <p className="text-sm">{n.note}</p>
              <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "h:mm a")}</p>
            </CardContent>
          </Card>
        ))}
        {!readonly && (
          <div className="space-y-2">
            <Textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note about this visit…"
              rows={3}
            />
            <Button size="sm" onClick={() => addNote.mutate()} disabled={!noteText.trim() || addNote.isPending} className="w-full">
              Save Note
            </Button>
          </div>
        )}
      </div>

      {/* Items Needed */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Items Needed</h3>
        {items.map(item => (
          <Card key={item.id} className={`border ${item.resolved ? "opacity-50" : ""}`}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shrink-0 ${item.resolved ? "bg-green-500" : "bg-amber-500"}`} />
              <p className="text-sm flex-1">{item.description}</p>
              {item.resolved && <Badge variant="secondary" className="text-xs">Resolved</Badge>}
            </CardContent>
          </Card>
        ))}
        {!readonly && (
          <div className="flex gap-2">
            <Input
              value={itemText}
              onChange={e => setItemText(e.target.value)}
              placeholder="e.g. Replace filter, Fix pump…"
            />
            <Button size="sm" onClick={() => addItem.mutate()} disabled={!itemText.trim() || addItem.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianVisit;
