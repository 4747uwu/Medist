import { apiClient } from './api';

class GoogleMeetService {
  // Check if Google Meet is authenticated
  async checkAuthStatus() {
    try {
      const response = await apiClient.get('/google-meet/auth-status');
      return response.data;
    } catch (error) {
      console.error('Error checking Google Meet auth status:', error);
      throw error;
    }
  }

  // Get authentication URL
  async getAuthUrl() {
    try {
      const response = await apiClient.get('/google-meet/auth');
      return response.data.data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw error;
    }
  }

  // Create meeting for appointment
  async createMeetingForAppointment(appointmentId, meetingTitle) {
    try {
      const response = await apiClient.post(
        `/google-meet/appointments/${appointmentId}/create-meeting`,
        { meetingTitle }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  // Get meeting for appointment
  async getMeetingForAppointment(appointmentId) {
    try {
      const response = await apiClient.get(
        `/google-meet/appointments/${appointmentId}/meeting`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw error;
    }
  }

  // Open authentication popup
  async authenticateGoogleMeet() {
    try {
      const authUrl = await this.getAuthUrl();
      
      // Open popup for authentication
      const popup = window.open(
        authUrl,
        'google-meet-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // Check if authentication was successful
            this.checkAuthStatus()
              .then(result => {
                if (result.data.isAuthenticated) {
                  resolve(true);
                } else {
                  reject(new Error('Authentication failed'));
                }
              })
              .catch(reject);
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Error authenticating Google Meet:', error);
      throw error;
    }
  }
}

export default new GoogleMeetService();