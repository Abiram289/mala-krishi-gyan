
import { Link } from "react-router-dom";
import { Home, User, MessageSquare, ListChecks, Cloud, Calendar, Award, Users, Bell } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";

export const MobileNav = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-secondary text-secondary-foreground p-2 border-t z-50 md:hidden">
      <nav className="flex justify-around">
        <Link to="/" className="flex flex-col items-center p-2 rounded-md hover:bg-secondary-foreground/10">
          <Home className="h-5 w-5" />
          <span className="text-xs">{t('home')}</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center p-2 rounded-md hover:bg-secondary-foreground/10">
          <User className="h-5 w-5" />
          <span className="text-xs">{t('profile')}</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center p-2 rounded-md hover:bg-secondary-foreground/10">
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs">{t('chat')}</span>
        </Link>
        <Link to="/activities" className="flex flex-col items-center p-2 rounded-md hover:bg-secondary-foreground/10">
          <ListChecks className="h-5 w-5" />
          <span className="text-xs">{t('activities')}</span>
        </Link>
        <Link to="/weather" className="flex flex-col items-center p-2 rounded-md hover:bg-secondary-foreground/10">
          <Cloud className="h-5 w-5" />
          <span className="text-xs">{t('weather')}</span>
        </Link>
        {/* Add more navigation items as needed */}
      </nav>
    </footer>
  );
};
