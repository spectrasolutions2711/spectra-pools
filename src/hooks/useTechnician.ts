import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type TechnicianRecord = {
  id: string;
  user_id: string;
  license_number: string | null;
  active: boolean;
};

export const useTechnician = () => {
  const { user } = useAuth();
  return useQuery<TechnicianRecord | null>({
    queryKey: ["my-technician", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("technicians")
        .select("id, user_id, license_number, active")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data as TechnicianRecord;
    },
    enabled: !!user,
  });
};
