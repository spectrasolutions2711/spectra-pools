import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  FileText, Plus, Pencil, Eye, Send, CheckCircle2, Trash2, Loader2, Search,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  client_id: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  client: { name: string } | null;
};

type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  item_type: string;
};

type Client = { id: string; name: string };

// ─── Constants ────────────────────────────────────────────

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: string; color: string }> = {
  draft:   { label: "Draft",   variant: "secondary",    color: "bg-slate-100 text-slate-700" },
  sent:    { label: "Sent",    variant: "default",      color: "bg-blue-100 text-blue-700"   },
  paid:    { label: "Paid",    variant: "default",      color: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", variant: "destructive",  color: "bg-red-100 text-red-700"     },
};

const TAX_RATE = 0.07; // 7% — adjust if needed

// ─── Schemas ──────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1, "Required"),
  item_type: z.string().min(1),
  quantity: z.string().min(1),
  unit_price: z.string().min(1),
});

const invoiceSchema = z.object({
  client_id: z.string().min(1, "Select a client"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  period_start: z.string().min(1, "Required"),
  period_end: z.string().min(1, "Required"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Add at least one line item"),
});
type InvoiceForm = z.infer<typeof invoiceSchema>;

// ─── Invoice Form Dialog ──────────────────────────────────

const InvoiceFormDialog = ({
  open, onClose, clients,
}: {
  open: boolean;
  onClose: () => void;
  clients: Client[];
}) => {
  const qc = useQueryClient();

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ description: "Monthly Pool Service", item_type: "service", quantity: "1", unit_price: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");

  const subtotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return acc + qty * price;
  }, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const save = useMutation({
    mutationFn: async (values: InvoiceForm) => {
      const sub = values.items.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
      const taxAmt = sub * TAX_RATE;
      const tot = sub + taxAmt;

      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert({
          client_id: values.client_id,
          invoice_number: values.invoice_number,
          period_start: values.period_start,
          period_end: values.period_end,
          due_date: values.due_date || null,
          notes: values.notes || null,
          subtotal: sub,
          tax: taxAmt,
          total: tot,
          status: "draft",
        })
        .select("id")
        .single();
      if (invErr) throw invErr;

      const lineItems = values.items.map(i => ({
        invoice_id: inv.id,
        description: i.description,
        item_type: i.item_type,
        quantity: parseFloat(i.quantity),
        unit_price: parseFloat(i.unit_price),
        total: parseFloat(i.quantity) * parseFloat(i.unit_price),
      }));
      const { error: itemErr } = await supabase.from("invoice_items").insert(lineItems);
      if (itemErr) throw itemErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success("Invoice created");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> New Invoice
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(v => save.mutate(v))} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select onValueChange={v => setValue("client_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-xs text-destructive">{errors.client_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Invoice # *</Label>
              <Input {...register("invoice_number")} placeholder="INV-2024-001" />
              {errors.invoice_number && <p className="text-xs text-destructive">{errors.invoice_number.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Period Start *</Label>
              <Input {...register("period_start")} type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Period End *</Label>
              <Input {...register("period_end")} type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input {...register("due_date")} type="date" />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => append({ description: "", item_type: "service", quantity: "1", unit_price: "" })}
              >
                <Plus className="h-3 w-3" /> Add line
              </Button>
            </div>
            {errors.items && <p className="text-xs text-destructive">Add at least one line item</p>}
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <Input {...register(`items.${idx}.description`)} placeholder="Description" className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Select defaultValue="service" onValueChange={v => setValue(`items.${idx}.item_type`, v)}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="chemical">Chemical</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input {...register(`items.${idx}.quantity`)} type="number" step="0.5" placeholder="Qty" className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Input {...register(`items.${idx}.unit_price`)} type="number" step="0.01" placeholder="$ / unit" className="text-sm" />
                  </div>
                  <div className="col-span-1 flex justify-end pt-2">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(idx)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="border-t pt-3 space-y-1 text-sm text-right">
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium w-20">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                <span className="font-medium w-20">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-end gap-8 font-bold text-base border-t pt-1 mt-1">
                <span>Total</span>
                <span className="w-20">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register("notes")} placeholder="Payment instructions, terms…" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Invoice Detail Dialog ────────────────────────────────

const InvoiceDetailDialog = ({
  open, onClose, invoice,
}: {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceRow | null;
}) => {
  const qc = useQueryClient();

  const { data: items = [] } = useQuery<InvoiceItem[]>({
    queryKey: ["invoice-items", invoice?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice!.id);
      if (error) throw error;
      return (data || []) as InvoiceItem[];
    },
    enabled: !!invoice?.id && open,
  });

  const advance = useMutation({
    mutationFn: async (newStatus: InvoiceStatus) => {
      const update: Record<string, unknown> = { status: newStatus };
      if (newStatus === "paid") update.paid_at = new Date().toISOString();
      const { error } = await supabase.from("invoices").update(update).eq("id", invoice!.id);
      if (error) throw error;
    },
    onSuccess: (_, status) => {
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success(`Invoice marked as ${status}`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!invoice) return null;
  const cfg = STATUS_CONFIG[invoice.status];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {invoice.invoice_number}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
              {cfg.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Client</p>
              <p className="font-medium">{invoice.client?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Period</p>
              <p className="font-medium">
                {format(parseISO(invoice.period_start), "MMM d")} – {format(parseISO(invoice.period_end), "MMM d, yyyy")}
              </p>
            </div>
            {invoice.due_date && (
              <div>
                <p className="text-muted-foreground text-xs">Due</p>
                <p className="font-medium">{format(parseISO(invoice.due_date), "MMM d, yyyy")}</p>
              </div>
            )}
            {invoice.paid_at && (
              <div>
                <p className="text-muted-foreground text-xs">Paid on</p>
                <p className="font-medium text-green-700">{format(parseISO(invoice.paid_at), "MMM d, yyyy")}</p>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">Description</th>
                  <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Qty</th>
                  <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Unit $</th>
                  <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">${item.unit_price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t">
                <tr>
                  <td colSpan={3} className="px-3 py-1.5 text-right text-xs text-muted-foreground">Subtotal</td>
                  <td className="px-3 py-1.5 text-right text-sm">${invoice.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-3 py-1 text-right text-xs text-muted-foreground">Tax</td>
                  <td className="px-3 py-1 text-right text-sm">${invoice.tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right font-bold">Total</td>
                  <td className="px-3 py-2 text-right font-bold text-base">${invoice.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {invoice.notes && (
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3">{invoice.notes}</div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {invoice.status === "draft" && (
            <Button onClick={() => advance.mutate("sent")} disabled={advance.isPending} variant="outline" className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50">
              <Send className="h-4 w-4" /> Mark Sent
            </Button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <Button onClick={() => advance.mutate("paid")} disabled={advance.isPending} className="gap-1.5 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4" /> Mark Paid
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main page ────────────────────────────────────────────

const AdminInvoices = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newDialog, setNewDialog] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<InvoiceRow | null>(null);

  const { data: invoices = [], isLoading } = useQuery<InvoiceRow[]>({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, client:clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as InvoiceRow[];
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients-select"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name").eq("active", true).order("name");
      return (data || []) as Client[];
    },
  });

  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = {
    draft:   invoices.filter(i => i.status === "draft").reduce((a, i) => a + i.total, 0),
    sent:    invoices.filter(i => i.status === "sent").reduce((a, i) => a + i.total, 0),
    overdue: invoices.filter(i => i.status === "overdue").reduce((a, i) => a + i.total, 0),
    paid:    invoices.filter(i => i.status === "paid").reduce((a, i) => a + i.total, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {invoices.length} invoices · ${totals.paid.toFixed(0)} collected this period
          </p>
        </div>
        <Button onClick={() => setNewDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["draft", "sent", "overdue", "paid"] as InvoiceStatus[]).map(s => {
          const cfg = STATUS_CONFIG[s];
          const count = invoices.filter(i => i.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`rounded-xl border p-3 text-left transition-all ${statusFilter === s ? "ring-2 ring-primary" : "hover:border-primary/40"}`}
            >
              <p className="text-xs text-muted-foreground">{cfg.label}</p>
              <p className="text-2xl font-bold mt-0.5">{count}</p>
              <p className={`text-xs font-medium mt-1 ${cfg.color.split(" ")[1]}`}>
                ${totals[s].toFixed(0)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(["draft", "sent", "overdue", "paid"] as InvoiceStatus[]).map(s => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : filtered.map(inv => {
                const cfg = STATUS_CONFIG[inv.status];
                return (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailInvoice(inv)}>
                    <TableCell className="font-mono text-sm font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.client?.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(parseISO(inv.period_start), "MMM d")} – {format(parseISO(inv.period_end), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.due_date ? format(parseISO(inv.due_date), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">${inv.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); setDetailInvoice(inv); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <InvoiceFormDialog open={newDialog} onClose={() => setNewDialog(false)} clients={clients} />
      <InvoiceDetailDialog open={!!detailInvoice} onClose={() => setDetailInvoice(null)} invoice={detailInvoice} />
    </div>
  );
};

export default AdminInvoices;
