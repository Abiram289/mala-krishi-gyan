import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface NavigationCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick?: () => void;
  href?: string;
  gradient?: boolean;
}

export const NavigationCard = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  href,
  gradient = false 
}: NavigationCardProps) => {
  const cardContent = (
    <Card 
      className={`p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 border-2 min-h-[120px] flex-1 ${
        gradient 
          ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground hover:shadow-xl border-primary-light/30' 
          : 'bg-card hover:bg-kerala-coconut hover:shadow-lg border-primary/30 hover:border-primary/50'
      } shadow-md hover:shadow-xl`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex flex-col items-center text-center space-y-2 h-full justify-center">
        <div className={`p-2 sm:p-3 rounded-full transition-colors ${
          gradient 
            ? 'bg-primary-foreground/20 group-hover:bg-primary-foreground/30' 
            : 'bg-primary/15 hover:bg-primary/25'
        }`}>
          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${
            gradient 
              ? 'text-primary-foreground' 
              : 'text-primary'
          }`} />
        </div>
        <div className="flex-1 flex items-center">
          <h3 className={`font-bold text-xs sm:text-sm leading-tight ${
            gradient 
              ? 'text-primary-foreground' 
              : 'text-card-foreground hover:text-primary'
          } transition-colors text-center break-words hyphens-auto`} lang="ml">
            {title}
          </h3>
          {description && (
            <p className={`text-sm mt-1 ${
              gradient 
                ? 'text-primary-foreground/80' 
                : 'text-muted-foreground'
            }`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return <Link to={href}>{cardContent}</Link>;
  }

  return cardContent;
};