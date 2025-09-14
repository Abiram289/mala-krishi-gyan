import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface NavigationCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  onClick: () => void;
  gradient?: boolean;
}

export const NavigationCard = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  gradient = false 
}: NavigationCardProps) => {
  return (
    <Card 
      className={`p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 border-2 ${
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
          onClick();
        }
      }}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-full transition-colors ${
          gradient 
            ? 'bg-primary-foreground/20 group-hover:bg-primary-foreground/30' 
            : 'bg-primary/15 hover:bg-primary/25'
        }`}>
          <Icon className={`h-8 w-8 ${
            gradient 
              ? 'text-primary-foreground' 
              : 'text-primary'
          }`} />
        </div>
        <div>
          <h3 className={`font-bold text-base sm:text-lg ${
            gradient 
              ? 'text-primary-foreground' 
              : 'text-card-foreground hover:text-primary'
          } transition-colors`}>
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
};