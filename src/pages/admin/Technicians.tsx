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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, Plus, Pencil, Search, Info } from "lucide-react";
import { toast } from "sonner";

const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  phone: z.string().optional(),
  license_number: z.string().optional(),
});

const editSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  phone: z.string().optional(),
  license_number: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;
type EditFormValues = z.infer<typeof editSchema>;

type TechnicianRow = {
  id: string;
  user_id: string;
  license_number: string | null;
  active: boolean;
  created_at: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
};

const fetchTechnicians = async (): Promise<TechnicianRow[]> => {
  const { data, error } = await supabase
    .from("technicians")
    .select(`
      id, user_id, license_number, active, created_at,
      profile:profiles!technicians_user_id_fkey(first_name, last_name, phone)
    `)
    .order("created_at");
  if (error) throw error;
  return (data || []) as TechnicianRow[];
};

const AdminTechnicians = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<TechnicianRow | null>(null);

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ["technicians"],
    queryFn: fetchTechnicians,
  });

  const inviteForm = useForm<InviteFormValues>({ resolver: zodResolver(inviteSchema) });
  const editForm = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });

  const inviteMutation = useMutation({
    mutationFn: async (values: InviteFormValues) => {
      // Sign up the new user — they'll receive a confirmation email
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: crypto.randomUUID(), // temp password; user will use password reset
        options: {
          data: {
            first_name: values.first_name,
            last_name: values.last_name,
          },
        },
      });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Could not create user");

      const userId = authData.user.id;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: "technician",
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone || null,
        })
        .eq("id", userId);
      if (profileError) throw profileError;

      // Create technician record
      const { error: techError } = await supabase
        .from("technicians")
        .insert({ user_id: userId, license_number: values.license_number || null });
      if (techError) throw techError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technicians"] });
      toast.success("Technician invited — they'll receive a confirmation email");
      setInviteOpen(false);
      inviteForm.reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async (values: EditFormValues & { techId: string; userId: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone || null,
        })
        .eq("id", values.userId);
      if (error) throw error;

      const { error: licError } = await supabase
        .from("technicians")
        .update({ license_number: values.license_number || null })
        .eq("id", values.techId);
      if (licError) throw licError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technicians"] });
      toast.success("Technician updated");
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("technicians").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["technicians"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (tech: TechnicianRow) => {
    setSelected(tech);
    editForm.reset({
      first_name: tech.profile?.first_name || "",
      last_name: tech.profile?.last_name || "",
      phone: tech.profile?.phone || "",
      license_number: tech.license_number || "",
    });
    setEditOpen(true);
  };

  const filtered = technicians.filter(t => {
    const name = `${t.profile?.first_name || ""} ${t.profile?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Technicians
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage field technician accounts</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Invite Technician
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search technicians…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="border rounded-lg bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {search ? "No technicians match your search." : "No technicians yet. Invite your first technician."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>License #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(tech => (
                <TableRow key={tech.id}>
                  <TableCell className="font-medium">
                    {tech.profile?.first_name} {tech.profile?.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tech.profile?.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{tech.license_number || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tech.active}
                        onCheckedChange={checked => toggleMutation.mutate({ id: tech.id, active: checked })}
                      />
                      <Badge variant={tech.active ? "default" : "secondary"}>
                        {tech.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(tech)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Technician</DialogTitle>
            <DialogDescription>
              A confirmation email will be sent. The technician must confirm their email to activate the account.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              After confirming their email, the technician should use "Forgot Password" to set their own password.
            </AlertDescription>
          </Alert>
          <form onSubmit={inviteForm.handleSubmit(v => inviteMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input {...inviteForm.register("email")} type="email" placeholder="tech@example.com" />
              {inviteForm.formState.errors.email && (
                <p className="text-xs text-destructive">{inviteForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input {...inviteForm.register("first_name")} placeholder="John" />
                {inviteForm.formState.errors.first_name && (
                  <p className="text-xs text-destructive">{inviteForm.formState.errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input {...inviteForm.register("last_name")} placeholder="Doe" />
                {inviteForm.formState.errors.last_name && (
                  <p className="text-xs text-destructive">{inviteForm.formState.errors.last_name.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...inviteForm.register("phone")} placeholder="(555) 000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label>License #</Label>
                <Input {...inviteForm.register("license_number")} placeholder="CPO-12345" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? "Sending invite…" : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Technician</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(v => {
            if (!selected) return;
            editMutation.mutate({ ...v, techId: selected.id, userId: selected.user_id });
          })} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input {...editForm.register("first_name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input {...editForm.register("last_name")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...editForm.register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label>License #</Label>
                <Input {...editForm.register("license_number")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTechnicians;
