import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GoogleMeetService {
  constructor() {
    this.oauth2Client = null;
    this.credentialsPath = path.join(__dirname, '../config/credentials.json');
    this.tokensPath = path.join(__dirname, '../config/tokens.json');
    this.initializeOAuth();
  }

  initializeOAuth() {
    try {
      if (fs.existsSync(this.credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
        const { client_id, client_secret, redirect_uris } = credentials.web;
        
        this.oauth2Client = new google.auth.OAuth2(
          client_id,
          client_secret,
          redirect_uris[0]
        );

        // Load existing tokens if available
        if (fs.existsSync(this.tokensPath)) {
          const tokens = JSON.parse(fs.readFileSync(this.tokensPath, 'utf8'));
          this.oauth2Client.setCredentials(tokens);
        }
      }
    } catch (error) {
      console.error('Error initializing Google OAuth:', error);
    }
  }

  getAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth client not initialized');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/meetings.space.created'],
      prompt: 'consent'
    });
  }

  async handleCallback(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Save tokens for future use
      fs.writeFileSync(this.tokensPath, JSON.stringify(tokens, null, 2));
      
      return tokens;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  async createMeeting(meetingTitle = 'Medical Consultation') {
    try {
      if (!this.oauth2Client) {
        throw new Error('OAuth client not initialized');
      }

      // Check if we have valid tokens
      if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.access_token) {
        throw new Error('No valid authentication tokens. Please authenticate first.');
      }

      const meet = google.meet({ version: 'v2', auth: this.oauth2Client });
      
      const requestBody = {
        space: {
          config: {
            accessType: 'OPEN', // Anyone with the link can join
            entryPointAccess: 'ALL'
          }
        }
      };

      console.log('Creating Google Meet space...');
      const response = await meet.spaces.create({ requestBody });
      
      const meetingData = {
        spaceId: response.data.name,
        meetingUri: response.data.meetingUri,
        meetingCode: response.data.meetingCode,
        createdAt: new Date().toISOString()
      };

      console.log('Google Meet created successfully:', meetingData);
      return meetingData;
      
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      
      // Handle token expiration
      if (error.code === 401) {
        throw new Error('Authentication expired. Please re-authenticate.');
      }
      
      throw error;
    }
  }

  async refreshTokens() {
    try {
      if (this.oauth2Client && this.oauth2Client.credentials.refresh_token) {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(credentials);
        
        // Save refreshed tokens
        fs.writeFileSync(this.tokensPath, JSON.stringify(credentials, null, 2));
        
        return credentials;
      }
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw error;
    }
  }

  isAuthenticated() {
    return this.oauth2Client && 
           this.oauth2Client.credentials && 
           this.oauth2Client.credentials.access_token;
  }
}

export default new GoogleMeetService();