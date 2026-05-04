import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package, Plus, Pencil, AlertTriangle, CheckCircle2, Search, FlaskConical, Warehouse,
} from "lucide-react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────

const CATEGORIES = [
  "Chlorine",
  "Acid",
  "pH Adjustment",
  "Algaecide",
  "Clarifier",
  "Enzyme",
  "Phosphate Remover",
  "Salt",
  "Stabilizer",
  "Other",
];

const UNITS = ["gal", "oz", "lbs", "kg", "L", "tablets", "bags", "pcs"];

// ─── Types ────────────────────────────────────────────────

type Product = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  cost_per_unit: number | null;
  active: boolean;
};

type InventoryRow = {
  id: string;
  product_id: string;
  quantity_on_hand: number;
  low_stock_threshold: number | null;
  last_updated: string;
  product: { name: string; category: string | null; unit: string } | null;
};

// ─── Schemas ──────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  cost_per_unit: z.string().optional(),
  active: z.boolean(),
});
type ProductForm = z.infer<typeof productSchema>;

const stockSchema = z.object({
  quantity_on_hand: z.string().min(1, "Quantity is required"),
  low_stock_threshold: z.string().optional(),
});
type StockForm = z.infer<typeof stockSchema>;

// ─── Product Dialog ───────────────────────────────────────

const ProductDialog = ({
  open, onClose, editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Product | null;
}) => {
  const qc = useQueryClient();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: editing?.name || "",
      category: editing?.category || "",
      unit: editing?.unit || "gal",
      cost_per_unit: editing?.cost_per_unit?.toString() || "",
      active: editing?.active ?? true,
    },
  });

  const activeVal = watch("active");

  const save = useMutation({
    mutationFn: async (values: ProductForm) => {
      const payload = {
        name: values.name,
        category: values.category,
        unit: values.unit,
        cost_per_unit: values.cost_per_unit ? parseFloat(values.cost_per_unit) : null,
        active: values.active,
      };
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        // Create inventory record with 0 stock
        await supabase.from("inventory").insert({ product_id: data.id, quantity_on_hand: 0 });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast.success(editing ? "Product updated" : "Product added");
      reset();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {editing ? "Edit Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(v => save.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input {...register("name")} placeholder="e.g. Liquid Chlorine" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select defaultValue={editing?.category || ""} onValueChange={v => setValue("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Unit *</Label>
              <Select defaultValue={editing?.unit || "gal"} onValueChange={v => setValue("unit", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cost per unit ($)</Label>
            <Input {...register("cost_per_unit")} type="number" step="0.01" placeholder="0.00" />
          </div>

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={activeVal} onCheckedChange={v => setValue("active", v)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Stock Dialog ─────────────────────────────────────────

const StockDialog = ({
  open, onClose, row,
}: {
  open: boolean;
  onClose: () => void;
  row: InventoryRow | null;
}) => {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<StockForm>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      quantity_on_hand: row?.quantity_on_hand?.toString() || "0",
      low_stock_threshold: row?.low_stock_threshold?.toString() || "",
    },
  });

  const save = useMutation({
    mutationFn: async (values: StockForm) => {
      const payload = {
        quantity_on_hand: parseFloat(values.quantity_on_hand),
        low_stock_threshold: values.low_stock_threshold ? parseFloat(values.low_stock_threshold) : null,
        last_updated: new Date().toISOString(),
      };
      if (row) {
        const { error } = await supabase.from("inventory").update(payload).eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast.success("Stock updated");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Update Stock — {row?.product?.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(v => save.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Quantity on hand ({row?.product?.unit})</Label>
            <Input {...register("quantity_on_hand")} type="number" step="0.1" />
            {errors.quantity_on_hand && <p className="text-xs text-destructive">{errors.quantity_on_hand.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Low stock alert threshold ({row?.product?.unit})</Label>
            <Input {...register("low_stock_threshold")} type="number" step="0.1" placeholder="No alert" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main page ────────────────────────────────────────────

const AdminInventory = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockDialog, setStockDialog] = useState(false);
  const [editingStock, setEditingStock] = useState<InventoryRow | null>(null);
  const [deactivating, setDeactivating] = useState<Product | null>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, unit, cost_per_unit, active")
        .order("category")
        .order("name");
      if (error) throw error;
      return (data || []) as Product[];
    },
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryRow[]>({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, product_id, quantity_on_hand, low_stock_threshold, last_updated, product:products(name, category, unit)")
        .order("product(name)");
      if (error) throw error;
      return (data || []) as InventoryRow[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("products").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); setDeactivating(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredInventory = inventory.filter(r =>
    !search || (r.product?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.product?.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = inventory.filter(r =>
    r.low_stock_threshold !== null && r.quantity_on_hand <= r.low_stock_threshold
  ).length;

  const openEditProduct = (p: Product) => { setEditingProduct(p); setProductDialog(true); };
  const openNewProduct  = () => { setEditingProduct(null); setProductDialog(true); };
  const openStockEdit   = (r: InventoryRow) => { setEditingStock(r); setStockDialog(true); };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} products · {lowStockCount > 0 && (
              <span className="text-amber-600 font-medium">{lowStockCount} low stock</span>
            )}
          </p>
        </div>
        <Button onClick={openNewProduct} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or category…"
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="gap-1.5">
            <FlaskConical className="h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-1.5">
            <Warehouse className="h-4 w-4" /> Stock Levels
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{lowStockCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── PRODUCTS tab ── */}
        <TabsContent value="products" className="mt-4">
          {productsLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost / unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.map(p => (
                    <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        {p.category && (
                          <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.unit}</TableCell>
                      <TableCell className="text-sm">
                        {p.cost_per_unit != null ? `$${p.cost_per_unit.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={p.active}
                          onCheckedChange={checked => {
                            if (!checked) { setDeactivating(p); }
                            else { toggleActive.mutate({ id: p.id, active: true }); }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => openEditProduct(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── STOCK tab ── */}
        <TabsContent value="stock" className="mt-4">
          {inventoryLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>On Hand</TableHead>
                    <TableHead>Alert Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No inventory records found.
                      </TableCell>
                    </TableRow>
                  ) : filteredInventory.map(row => {
                    const isLow = row.low_stock_threshold !== null && row.quantity_on_hand <= row.low_stock_threshold;
                    const isEmpty = row.quantity_on_hand === 0;
                    return (
                      <TableRow key={row.id} className={isEmpty ? "bg-red-50/50" : isLow ? "bg-amber-50/50" : ""}>
                        <TableCell className="font-medium">{row.product?.name}</TableCell>
                        <TableCell>
                          {row.product?.category && (
                            <Badge variant="secondary" className="text-xs">{row.product.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.quantity_on_hand} {row.product?.unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.low_stock_threshold != null ? `${row.low_stock_threshold} ${row.product?.unit}` : "—"}
                        </TableCell>
                        <TableCell>
                          {isEmpty ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="h-3 w-3" /> Out of stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="h-3 w-3" /> Low stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> OK
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => openStockEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product dialog */}
      <ProductDialog
        open={productDialog}
        onClose={() => { setProductDialog(false); setEditingProduct(null); }}
        editing={editingProduct}
      />

      {/* Stock dialog */}
      <StockDialog
        open={stockDialog}
        onClose={() => { setStockDialog(false); setEditingStock(null); }}
        row={editingStock}
      />

      {/* Deactivate confirm */}
      <AlertDialog open={!!deactivating} onOpenChange={v => { if (!v) setDeactivating(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate product?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deactivating?.name}</strong> will no longer appear in the chemical dosage selector during visits. Existing dosage records are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deactivating && toggleActive.mutate({ id: deactivating.id, active: false })}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminInventory;
