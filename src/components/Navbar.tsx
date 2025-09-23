import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { LogOut, Leaf } from "lucide-react";
import { useAuth } from "@/App";
import { LanguageToggle, useLanguage } from "@/components/LanguageToggle";

const Navbar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold">Kerala Krishi Sahai</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <LanguageToggle />
          {user && (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('signOut')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
