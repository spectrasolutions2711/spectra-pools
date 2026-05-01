import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Waves, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";

const ClientDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Pool Service Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your facilities — {profile?.first_name} {profile?.last_name}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Waves className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Locations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Visits This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome message */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-primary flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Welcome to Spectra Pool
          </CardTitle>
          <CardDescription>
            Your facility dashboard is being set up. Once your administrator configures your locations,
            you'll see real-time pool status, chemical readings, and service history here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default ClientDashboard;
