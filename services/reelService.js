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


getReelsByUser: async (userId) => {
  try {
    const response = await axios.get(`${API_BASE}/reels/user/${userId}`);
    return response.data;
  } catch (error) {
    // If endpoint doesn't exist, fall back to filtering all reels
    const allReels = await axios.get(`${API_BASE}/reels?limit=100`);
    const userReels = allReels.data.reels.filter(reel => 
      reel.userId === userId || reel.user?._id === userId
    );
    return { reels: userReels };
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
    const response = await axios.post(`${API_BASE}/reels/${reelId}/share`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}, 

 // In reelService.js - check the delete function
deleteReel: async (reelId) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.delete(`${API_BASE}/reels/${reelId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}, 



getFollowingReels: async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE}/reels/following?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},



checkFollowStatus: async (userId) => {
  try {
    const response = await axios.get(`${API_BASE}/users/follow/${userId}/status`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},

followUser: async (userId) => {
  try {
    const response = await axios.post(`${API_BASE}/users/follow/${userId}/follow`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},

unfollowUser: async (userId) => {
  try {
    const response = await axios.post(`${API_BASE}/users/follow/${userId}/unfollow`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},
};
