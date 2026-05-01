import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Clock, CheckCircle2, Navigation } from "lucide-react";
import { format } from "date-fns";

const TechnicianDashboard = () => {
  const { profile } = useAuth();
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-xl font-bold text-foreground">
          My Route — {profile?.first_name || "Technician"}
        </h1>
      </div>

      {/* Progress card */}
      <Card className="bg-primary text-primary-foreground border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">Today's Progress</p>
              <p className="text-4xl font-bold mt-1">0<span className="text-2xl text-primary-foreground/70">/0</span></p>
              <p className="text-primary-foreground/80 text-sm mt-1">pools completed</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary-foreground/80 text-sm justify-end">
                <Clock className="h-4 w-4" />
                <span>0h 0m</span>
              </div>
              <p className="text-primary-foreground/60 text-xs mt-1">est. total time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync status */}
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>All changes are synced</span>
      </div>

      {/* Route list placeholder */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-primary">No route assigned for today</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Your administrator hasn't assigned a route for today yet. Check back later or contact your supervisor.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianDashboard;
