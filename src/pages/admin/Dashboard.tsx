import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, MapPin, Users, ClipboardCheck, AlertTriangle, Package } from "lucide-react";

const stats = [
  { label: "Active Clients",    value: "—", icon: Building2,      color: "text-blue-600",   bg: "bg-blue-50" },
  { label: "Locations",         value: "—", icon: MapPin,          color: "text-teal-600",   bg: "bg-teal-50" },
  { label: "Technicians",       value: "—", icon: Users,           color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Visits Today",      value: "—", icon: ClipboardCheck,  color: "text-green-600",  bg: "bg-green-50" },
  { label: "Active Alerts",     value: "—", icon: AlertTriangle,   color: "text-amber-600",  bg: "bg-amber-50" },
  { label: "Low Stock Items",   value: "—", icon: Package,         color: "text-red-600",    bg: "bg-red-50" },
];

const AdminDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good morning, {profile?.first_name || "Admin"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening with your pools today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup reminder */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-primary flex items-center gap-2">
            🚀 Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Complete the initial setup to start managing your pool service operations:</p>
          <ol className="list-decimal list-inside space-y-1 text-foreground">
            <li>Add your first <strong>Client</strong> (e.g., EOS Fitness)</li>
            <li>Add <strong>Locations</strong> for each gym</li>
            <li>Configure <strong>Pool Areas</strong> (Pool, SPA, Tank) per location</li>
            <li>Create <strong>Technician</strong> accounts</li>
            <li>Set up <strong>Routes</strong> and assign technicians</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
