import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Eye, EyeOff, LogOut } from 'lucide-react';
import { sessionManager } from '@/lib/sessionManager';
import { supabase } from '@/lib/supabase';

interface SessionInfo {
  isValid: boolean;
  expiresAt: string;
  timeUntilExpiry: number;
  timeUntilExpiryMinutes: number;
  user: any;
  tokenLength: number;
}

const SessionDebugger: React.FC = () => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateSessionInfo = async () => {
    const info = await sessionManager.getSessionInfo();
    setSessionInfo(info);
  };

  const handleRefresh = async () => {
    setLoading(true);
    const success = await sessionManager.refreshSessionManually();
    if (success) {
      await updateSessionInfo();
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await sessionManager.clearSession();
    setSessionInfo(null);
  };

  useEffect(() => {
    if (isVisible) {
      updateSessionInfo();
      const interval = setInterval(updateSessionInfo, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsVisible(true);
            updateSessionInfo();
          }}
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <Eye className="h-3 w-3 mr-1" />
          Session Debug
        </Button>
      ) : (
        <Card className="w-80 bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              Session Debug Info
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {sessionInfo ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant={sessionInfo.isValid ? "default" : "destructive"}>
                    {sessionInfo.isValid ? "Valid" : "Expired"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Expires:</span>
                  <span className="font-mono text-xs">{sessionInfo.expiresAt}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Time left:</span>
                  <span className={`font-mono ${sessionInfo.timeUntilExpiryMinutes < 10 ? 'text-red-600 font-bold' : ''}`}>
                    {sessionInfo.timeUntilExpiryMinutes} min
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>User ID:</span>
                  <span className="font-mono text-xs truncate max-w-32">
                    {sessionInfo.user?.id || 'None'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Token length:</span>
                  <span className="font-mono">{sessionInfo.tokenLength}</span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex-1"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleLogout}
                    className="flex-1"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                No session found
                <Button
                  size="sm"
                  variant="outline"
                  onClick={updateSessionInfo}
                  className="mt-2 w-full"
                >
                  Check Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionDebugger;