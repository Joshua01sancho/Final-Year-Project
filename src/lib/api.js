import axios from 'axios';

class ApiClient {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For HTTP-only cookies
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.clearAuthToken();
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  clearAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication endpoints
  async loginWithFace(faceImage) {
    const response = await this.client.post('/auth/face-login/', { 
      faceImage: faceImage 
    });
    return response.data;
  }

  async signupWithFace(userData, faceImage) {
    const response = await this.client.post('/auth/face-signup/', {
      ...userData,
      faceImage: faceImage
    });
    return response.data;
  }

  async loginWithCredentials(username, password) {
    const response = await this.client.post('/auth/login/', { 
      username, 
      password 
    });
    return response.data;
  }

  async signupWithCredentials(userData) {
    const response = await this.client.post('/auth/signup/', userData);
    return response.data;
  }

  async loginWithFingerprint(fingerprintData) {
    const response = await this.client.post('/auth/fingerprint-login', { fingerprintData });
    return response.data;
  }

  async verify2FA(code) {
    const response = await this.client.post('/auth/2fa', { code });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  // Election endpoints
  async getElections() {
    const response = await this.client.get('/elections');
    return response.data;
  }

  async getElection(id) {
    const response = await this.client.get(`/elections/${id}`);
    return response.data;
  }

  async createElection(electionData) {
    const response = await this.client.post('/admin/elections', electionData);
    return response.data;
  }

  async updateElection(id, electionData) {
    const response = await this.client.put(`/admin/elections/${id}`, electionData);
    return response.data;
  }

  async deleteElection(id) {
    const response = await this.client.delete(`/admin/elections/${id}`);
    return response.data;
  }

  // Blockchain Voting endpoints (Django backend)
  async castVote(electionId, candidateId) {
    const response = await this.client.post('/elections/vote/', {
      election_id: electionId,
      candidate_id: candidateId
    });
    return response.data;
  }

  async verifyVote(voteHash) {
    const response = await this.client.get(`/elections/verify-vote/${voteHash}/`);
    return response.data;
  }

  // Ballot endpoints
  async getBallot(electionId) {
    const response = await this.client.get(`/elections/${electionId}/ballot`);
    return response.data;
  }

  // Legacy voting endpoints (keep for compatibility)
  async submitVote(electionId, encryptedVote) {
    const response = await this.client.post(`/elections/${electionId}/vote`, {
      encryptedData: encryptedVote,
    });
    return response.data;
  }

  async getVoteHistory() {
    const response = await this.client.get('/votes/history');
    return response.data;
  }

  // Analytics endpoints
  async getElectionResults(electionId) {
    const response = await this.client.get(`/admin/elections/${electionId}/results`);
    return response.data;
  }

  async getAnalytics() {
    const response = await this.client.get('/admin/analytics');
    return response.data;
  }

  // User management endpoints
  async getUsers() {
    const response = await this.client.get('/admin/users');
    return response.data;
  }

  async createUser(userData) {
    const response = await this.client.post('/admin/users', userData);
    return response.data;
  }

  async updateUser(id, userData) {
    const response = await this.client.put(`/admin/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id) {
    const response = await this.client.delete(`/admin/users/${id}`);
    return response.data;
  }

  // File upload endpoints
  async uploadFaceImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await this.client.post('/auth/upload-face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadFingerprint(fingerprintFile) {
    const formData = new FormData();
    formData.append('fingerprint', fingerprintFile);
    
    const response = await this.client.post('/auth/upload-fingerprint', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient; 