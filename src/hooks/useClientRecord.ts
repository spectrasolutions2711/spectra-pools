import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type ClientRecord = {
  id: string;
  user_id: string;
  client_id: string;
  role: string;
  active: boolean;
};

export const useClientRecord = () => {
  const { user } = useAuth();
  return useQuery<ClientRecord | null>({
    queryKey: ["my-client-record", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("client_users")
        .select("id, user_id, client_id, role, active")
        .eq("user_id", user.id)
        .eq("active", true)
        .single();
      if (error) return null;
      return data as ClientRecord;
    },
    enabled: !!user,
  });
};
