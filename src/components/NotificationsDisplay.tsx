import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const NotificationsDisplay = () => {
  // Static placeholder notifications for now
  const notifications: Notification[] = [
    {
      id: "1",
      message: "Reminder: Water your paddy fields today.",
      timestamp: "2025-09-17T09:00:00Z",
      read: false,
    },
    {
      id: "2",
      message: "Alert: Heavy rainfall expected in your area tomorrow. Take precautions.",
      timestamp: "2025-09-16T18:30:00Z",
      read: false,
    },
    {
      id: "3",
      message: "New government scheme for organic farming is now open for applications.",
      timestamp: "2025-09-15T10:00:00Z",
      read: true,
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" /> Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-muted-foreground">No new notifications.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read ? "bg-muted/50 text-muted-foreground" : "bg-background"
              }`}
            >
              <p className="font-medium">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationsDisplay;