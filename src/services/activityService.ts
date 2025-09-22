import { fetchWithAuth } from '@/lib/apiClient';

export interface Activity {
  id: string;
  title: string;
  type: 'planting' | 'watering' | 'fertilizing' | 'harvesting';
  status: 'completed' | 'pending' | 'scheduled';
  date: string; // ISO date string
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityCreate {
  title: string;
  type: string;
  date: string;
  notes?: string;
}

export interface ActivityUpdate {
  title?: string;
  type?: string;
  status?: string;
  date?: string;
  notes?: string;
}

export const activityService = {
  // Get all activities for the current user
  async getActivities(): Promise<Activity[]> {
    try {
      const response = await fetchWithAuth('/activities');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.activities || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  // Create a new activity
  async createActivity(activity: ActivityCreate): Promise<Activity> {
    try {
      const response = await fetchWithAuth('/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  // Update an existing activity
  async updateActivity(id: string, updates: ActivityUpdate): Promise<Activity> {
    try {
      const response = await fetchWithAuth(`/activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },

  // Delete an activity
  async deleteActivity(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`/activities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  // Mark activity as completed
  async markCompleted(id: string): Promise<Activity> {
    return this.updateActivity(id, { status: 'completed' });
  },

  // Mark activity as pending
  async markPending(id: string): Promise<Activity> {
    return this.updateActivity(id, { status: 'pending' });
  },
};