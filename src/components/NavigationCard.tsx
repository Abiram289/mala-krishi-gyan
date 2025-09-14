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
      className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 border-primary/20 ${
        gradient 
          ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground hover:shadow-lg' 
          : 'bg-card hover:bg-kerala-coconut hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-full ${
          gradient 
            ? 'bg-primary-foreground/20' 
            : 'bg-primary/10'
        }`}>
          <Icon className={`h-8 w-8 ${
            gradient 
              ? 'text-primary-foreground' 
              : 'text-primary'
          }`} />
        </div>
        <div>
          <h3 className={`font-semibold text-lg ${
            gradient 
              ? 'text-primary-foreground' 
              : 'text-card-foreground'
          }`}>
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