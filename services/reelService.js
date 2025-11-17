import axios from 'axios';
import config from '../src/config';

const API_BASE = config.apiUrl;

// Get auth headers
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const reelService = {
  // Get all reels
  getReels: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE}/reels?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single reel
  getReel: async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/reels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new reel
  createReel: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE}/reels`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Like/unlike reel
  likeReel: async (reelId) => {
    try {
      const response = await axios.put(`${API_BASE}/reels/${reelId}/like`, {}, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add comment
  addComment: async (reelId, text) => {
    try {
      const response = await axios.post(`${API_BASE}/reels/${reelId}/comment`, 
        { text },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Share reel
  shareReel: async (reelId) => {
    try {
      const response = await axios.put(`${API_BASE}/reels/${reelId}/share`, {}, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete reel
  deleteReel: async (reelId) => {
    try {
      const response = await axios.delete(`${API_BASE}/reels/${reelId}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
