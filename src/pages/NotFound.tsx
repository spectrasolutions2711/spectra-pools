import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Waves className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground text-center">The page you're looking for doesn't exist.</p>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );
};

export default NotFound;
