import { supabase } from './supabase';

export class SessionManager {
  private static instance: SessionManager;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private onSessionExpiredCallback: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public onSessionExpired(callback: () => void) {
    this.onSessionExpiredCallback = callback;
  }

  public async getSessionInfo() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session info error:', error);
        return null;
      }

      if (!session) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;
      
      return {
        isValid: timeUntilExpiry > 0,
        expiresAt: new Date(expiresAt * 1000).toLocaleString(),
        timeUntilExpiry: timeUntilExpiry,
        timeUntilExpiryMinutes: Math.floor(timeUntilExpiry / 60),
        user: session.user,
        tokenLength: session.access_token?.length || 0
      };
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }

  public async logSessionInfo() {
    const info = await this.getSessionInfo();
    
    if (info) {
      console.log('🔐 Session Info:', {
        isValid: info.isValid,
        expiresAt: info.expiresAt,
        timeUntilExpiryMinutes: info.timeUntilExpiryMinutes,
        userId: info.user?.id,
        email: info.user?.email,
        tokenLength: info.tokenLength
      });
    } else {
      console.log('🔐 No active session');
    }
  }

  public startSessionMonitoring() {
    // Clear any existing interval
    this.stopSessionMonitoring();

    this.sessionCheckInterval = setInterval(async () => {
      try {
        const info = await this.getSessionInfo();
        
        if (!info) {
          console.log('🔐 No session found during monitoring');
          return;
        }

        if (!info.isValid) {
          console.log('🔐 Session has expired during monitoring');
          if (this.onSessionExpiredCallback) {
            this.onSessionExpiredCallback();
          }
          return;
        }

        // Log warning if session expires soon
        if (info.timeUntilExpiryMinutes < 10) {
          console.warn(`🔐 Session expires in ${info.timeUntilExpiryMinutes} minutes`);
          
          // Attempt refresh if less than 5 minutes
          if (info.timeUntilExpiryMinutes < 5) {
            console.log('🔐 Attempting proactive session refresh...');
            const { data: { session }, error } = await supabase.auth.refreshSession();
            
            if (error) {
              console.error('🔐 Proactive refresh failed:', error);
            } else if (session) {
              console.log('🔐 Session refreshed proactively');
            }
          }
        }
      } catch (error) {
        console.error('Session monitoring error:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    console.log('🔐 Session monitoring started');
  }

  public stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
      console.log('🔐 Session monitoring stopped');
    }
  }

  public async refreshSessionManually() {
    try {
      console.log('🔐 Manual session refresh requested...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('🔐 Manual refresh failed:', error);
        return false;
      }
      
      if (session) {
        console.log('🔐 Manual session refresh successful');
        await this.logSessionInfo();
        return true;
      }
      
      console.warn('🔐 Manual refresh returned no session');
      return false;
    } catch (error) {
      console.error('🔐 Manual refresh error:', error);
      return false;
    }
  }

  public async clearSession() {
    try {
      this.stopSessionMonitoring();
      await supabase.auth.signOut();
      console.log('🔐 Session cleared successfully');
    } catch (error) {
      console.error('🔐 Error clearing session:', error);
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Debug helper for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).sessionManager = sessionManager;
  console.log('🔐 Session manager available as window.sessionManager for debugging');
}