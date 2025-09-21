
import { Link } from "react-router-dom";
import { Home, User, MessageSquare, ListChecks, Cloud, Calendar, Award, Users, Bell } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";

export const Sidebar = () => {
  const { t } = useLanguage();
  
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground p-4 flex flex-col border-r">
      <div className="flex items-center justify-between mb-6">
        <Link to="/">
          <h1 className="text-2xl font-bold text-sidebar-primary">Mala Krishi Gyan</h1>
        </Link>
      </div>
      <nav className="flex-1 space-y-2">
        <Link to="/" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent">
          <Home className="h-5 w-5 mr-3" />
          {t('home')}
        </Link>
        <Link to="/profile" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent">
          <User className="h-5 w-5 mr-3" />
          {t('profile')}
        </Link>
        <Link to="/chat" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent">
          <MessageSquare className="h-5 w-5 mr-3" />
          {t('chat')}
        </Link>
        <Link to="/activities" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent">
          <ListChecks className="h-5 w-5 mr-3" />
          {t('activities')}
        </Link>
        <Link to="/weather" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent">
          <Cloud className="h-5 w-5 mr-3" />
          {t('weather')}
        </Link>
        <Link to="/crop-calendar" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent">
          <Calendar className="h-5 w-5 mr-3" />
          {t('calendar')}
        </Link>
        <Link to="/government-schemes" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent">
          <Award className="h-5 w-5 mr-3" />
          {t('schemes')}
        </Link>
        <Link to="/community" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent">
          <Users className="h-5 w-5 mr-3" />
          {t('community')}
        </Link>
        <Link to="/notifications" className="flex items-center p-2 rounded-md hover:bg-sidebar-accent">
          <Bell className="h-5 w-5 mr-3" />
          {t('notifications')}
        </Link>
      </nav>
    </aside>
  );
};
