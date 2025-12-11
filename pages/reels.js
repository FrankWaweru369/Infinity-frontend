import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  FiHeart,
  FiMessageCircle,
  FiMusic,
  FiMoreHorizontal,
  FiShare,
  FiArrowLeft,
  FiVolume2,
  FiVolumeX,
  FiSend,
  FiVideo,
  FiPlus,
  FiX,
  FiUpload,
  FiHome,
  FiUsers,
  FiTrash2,
  FiWifi,
  FiWifiOff,
  FiSettings,
  FiChevronDown
} from "react-icons/fi";
import { FaHeart, FaPause, FaPlay } from "react-icons/fa";
import { reelService } from "../services/reelService";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import config from '../src/config';

const API_BASE = config.apiUrl;
const REELS_PER_PAGE = 5;
const PRELOAD_THRESHOLD = 2; // Start loading when 2 reels from end

const getCurrentUserId = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found');
      return null;
    }

    // Decode JWT token
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Try all possible ID fields
    const userId = payload.id || payload._id || payload.userId || payload.sub || payload.user_id;

    if (userId) {
      console.log('✅ Found user ID in token:', userId);
      return userId;
    }

    console.warn('No user ID found in token payload:', payload);
    return null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
};

// Helper function
const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildAssetUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : url;
};

// FollowButton Component - UPDATED
const FollowButton = ({ targetUser }) => {
  const [isFollowing, setIsFollowing] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Get current user ID using our helper
  const currentUserId = getCurrentUserId();
  
  // Don't show button if no user or same user
  if (!currentUserId || currentUserId === targetUser._id) {
    return null;
  }
  
  const loadFollowStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/users/${targetUser.username || targetUser._id}`, {
        headers: getAuthHeaders()
      });

      const userData = response.data;
      
      
      const isCurrentlyFollowing = userData.followers?.some(follower =>
        follower._id === currentUserId || follower === currentUserId
      );
      setIsFollowing(isCurrentlyFollowing);
    } catch (error) {
      console.error('Error loading follow status:', error);
      setIsFollowing(false);
    }
  }, [targetUser._id, targetUser.username, currentUserId]);

  useEffect(() => {
    if (currentUserId && targetUser && currentUserId !== targetUser._id) {
      loadFollowStatus();
    }
  }, [loadFollowStatus, currentUserId, targetUser]);

  const handleFollow = async () => {
    if (loading || !currentUserId || currentUserId === targetUser._id) return;

    setLoading(true);
    try {
      const action = isFollowing ? "unfollow" : "follow";
      const url = `${API_BASE}/users/${targetUser._id}/${action}`;
      await axios.post(url, {}, { headers: getAuthHeaders() });
      await loadFollowStatus();
      window.dispatchEvent(new Event('followStateChanged'));
    } catch (error) {
      alert(`Operation failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleFollowStateChange = () => loadFollowStatus();
    window.addEventListener('followStateChanged', handleFollowStateChange);
    return () => window.removeEventListener('followStateChanged', handleFollowStateChange);
  }, [loadFollowStatus]);

  if (!currentUserId || currentUserId === targetUser._id) return null;
  if (isFollowing === null) {
    return <button disabled className="px-3 py-1 bg-gray-400 text-white rounded-full text-xs font-semibold opacity-50">...</button>;
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
        isFollowing
          ? 'bg-gray-500 text-white hover:bg-gray-600'
          : 'bg-purple-600 text-white hover:bg-purple-700'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};

// Main Reels Component
export default function ReelsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedReels, setLikedReels] = useState({});
  const [playing, setPlaying] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [likesListOpenFor, setLikesListOpenFor] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [muted, setMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [videoLoading, setVideoLoading] = useState({});
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ caption: "", music: "Original Sound" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('foryou');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reelToDelete, setReelToDelete] = useState(null);
  const currentUserId = getCurrentUserId();
  const [dataSaverMode, setDataSaverMode] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loadedVideoUrls, setLoadedVideoUrls] = useState({});
  const [showDataSaverMenu, setShowDataSaverMenu] = useState(false);
  const [videoQuality, setVideoQuality] = useState('auto');
  const [expandedComments, setExpandedComments] = useState({});
  const [recommentInputs, setRecommentInputs] = useState({});
  const [recommentLoading, setRecommentLoading] = useState({});
  const videoRefs = useRef([]);
  const touchStartY = useRef(null);
  const fileInputRef = useRef(null);
  const observerRef = useRef(null);

  // Load data saver preference from localStorage
  useEffect(() => {
    const savedDataSaver = localStorage.getItem('reelsDataSaver');
    if (savedDataSaver !== null) {
      setDataSaverMode(savedDataSaver === 'true');
    }
    
    const savedQuality = localStorage.getItem('reelsVideoQuality');
    if (savedQuality) {
      setVideoQuality(savedQuality);
    }
  }, []);

  // Save data saver preference
  useEffect(() => {
    localStorage.setItem('reelsDataSaver', dataSaverMode.toString());
  }, [dataSaverMode]);

  useEffect(() => {
    localStorage.setItem('reelsVideoQuality', videoQuality);
  }, [videoQuality]);

  // Check if video should be loaded
  const shouldLoadVideo = (reelIndex) => {
    // If video is already loaded, keep it loaded
    if (loadedVideoUrls[reels[reelIndex]?._id]) return true;
    
    if (dataSaverMode) {
      // In data saver mode, only load current video
      return reelIndex === currentReelIndex;
    }
    
    // Normal mode: load current + next 1 video for smooth scrolling
    return Math.abs(reelIndex - currentReelIndex) <= 1;
  };

  // Get appropriate video URL based on quality setting
  const getVideoUrl = (reel) => {
    if (!reel?.videoUrl) return '';
    
    const baseUrl = buildAssetUrl(reel.videoUrl);
    
    // If backend supports quality parameters, we can add them here
    // For now, we'll use the base URL
    return baseUrl;
  };

  // Initialize likedReels state from fetched reels
useEffect(() => {
  if (reels.length > 0) {
    const userId = getCurrentUserId(); // Use helper
    
    if (userId) {
      const newLikedReels = {};
      reels.forEach(reel => {
        // Check if current user has liked this reel
        const hasLiked = reel.likes?.some(like => 
          String(like?._id || like) === String(userId) // Use userId
        );
        newLikedReels[reel._id] = hasLiked || false;
      });
      setLikedReels(newLikedReels);
    }
  }
}, [reels]);

  // Fetch reels with pagination - FIXED VERSION
const fetchReels = useCallback(async (filterType = 'foryou', pageNum = 1, shouldAppend = false) => {
  try {
    if (!shouldAppend) {
      setLoading(true);
      setLoadedVideoUrls({});
    } else {
      setIsFetchingMore(true);
    }

    let data;
    const currentUserId = getCurrentUserId();

    if (filterType === 'myreels') {
      // MY REELS - Get user's own reels
      if (!currentUserId) {
        alert('Please login to view your reels');
        router.push('/login');
        return;
      }

      // First, try to get ALL reels to filter (temporary solution)
      const allReels = await reelService.getReels(1, 100); // Get many reels
      
      if (allReels?.reels && Array.isArray(allReels.reels)) {
        // Filter for current user's reels
        const userReels = allReels.reels.filter(reel => {
          // Check author ID - most common
          const authorId = reel.author?._id || reel.author;
          
          // If author is an object with _id, check it
          if (authorId && typeof authorId === 'object' && authorId._id) {
            return String(authorId._id) === String(currentUserId);
          }
          
          // If author is just an ID string
          if (authorId && typeof authorId === 'string') {
            return authorId === currentUserId;
          }
          
          return false;
        });
        
        // Sort by date (newest first) and paginate
        const sortedReels = userReels.sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        
        // Manual pagination
        const startIndex = (pageNum - 1) * REELS_PER_PAGE;
        const endIndex = startIndex + REELS_PER_PAGE;
        const paginatedReels = sortedReels.slice(startIndex, endIndex);
        
        data = { reels: paginatedReels };
        
        // Set hasMore
        if (paginatedReels.length < REELS_PER_PAGE || endIndex >= sortedReels.length) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        data = { reels: [] };
        setHasMore(false);
      }
      
    } else if (filterType === 'following') {
  // FOLLOWING - Requires login
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    alert('Please login to view followed users reels');
    router.push('/login');
    return;
  }
  
  // Get reels from backend (which includes followed users + own reels)
  const allReels = await reelService.getReels(pageNum, REELS_PER_PAGE);
  
  if (allReels?.reels && Array.isArray(allReels.reels)) {
    // Filter out the current user's own reels
    const followingReels = allReels.reels.filter(reel => {
      // Get the author ID
      const authorId = reel.author?._id || reel.author;
      
      // Skip if this is the current user's own reel
      if (authorId) {
        // If author is an object with _id
        if (typeof authorId === 'object' && authorId._id) {
          return String(authorId._id) !== String(currentUserId);
        }
        // If author is just an ID string
        if (typeof authorId === 'string') {
          return authorId !== currentUserId;
        }
      }
      
      // Keep the reel if we can't determine author
      return true;
    });
    
    data = { reels: followingReels };
  } else {
    data = { reels: [] };
  }
} else {
      // FOR YOU - Public, no login required
      data = await reelService.getReels(pageNum, REELS_PER_PAGE);
    }

    const reelsData = data?.reels || [];

    if (shouldAppend) {
      // Append new reels
      setReels(prev => [...prev, ...reelsData]);
      setPage(pageNum + 1);
    } else {
      // Replace reels
      setReels(reelsData);
      setPage(2);
      setCurrentReelIndex(0);
    }

    // Mark videos for loading based on data saver mode
    if (reelsData.length > 0) {
      const newLoadedUrls = {};
      reelsData.forEach((reel, index) => {
        if (index === 0 || !dataSaverMode) {
          newLoadedUrls[reel._id] = getVideoUrl(reel);
        }
      });
      setLoadedVideoUrls(prev => ({ ...prev, ...newLoadedUrls }));
    }

    // Check if there are more reels (only for foryou and following)
    if (filterType !== 'myreels') {
      if (reelsData.length < REELS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }

    setActiveTab(filterType);

    if (!shouldAppend && reelsData.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

  } catch (error) {
    console.error('Error fetching reels:', error);
    alert(`Failed to load reels: ${error.message}`);
  } finally {
    setLoading(false);
    setIsFetchingMore(false);
  }
}, [router, dataSaverMode]); // Removed 'user' dependency

  // Initial fetch
  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  // Load more reels when approaching end 
useEffect(() => {
  if (hasMore && !isFetchingMore && reels.length > 0) {
    const shouldLoadMore = currentReelIndex >= reels.length - PRELOAD_THRESHOLD;
    
    if (shouldLoadMore) {
      
      fetchReels(activeTab, page, true);
    }
  }
}, [currentReelIndex, reels.length, hasMore, isFetchingMore, activeTab, page, fetchReels]);

  // Handle video loading based on current position
  useEffect(() => {
    if (reels.length === 0) return;

    // Update loaded videos based on current position
    const newLoadedUrls = { ...loadedVideoUrls };
    let changed = false;

    reels.forEach((reel, index) => {
      if (shouldLoadVideo(index) && !newLoadedUrls[reel._id]) {
        newLoadedUrls[reel._id] = getVideoUrl(reel);
        changed = true;
      }
    });

    if (changed) {
      setLoadedVideoUrls(newLoadedUrls);
    }
  }, [currentReelIndex, reels, dataSaverMode]);

  // Video intersection observer for auto-play
  useEffect(() => {
    if (!reels.length) return;

    const container = document.querySelector('.h-full.snap-y.snap-mandatory.overflow-y-scroll');
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index'));
            
            if (index !== currentReelIndex) {
              setCurrentReelIndex(index);
              
              // Pause all other videos
              videoRefs.current.forEach((video, i) => {
                if (video && i !== index) {
                  video.pause();
                }
              });
              
              // Play current video
              const currentVideo = videoRefs.current[index];
              if (currentVideo && playing) {
                currentVideo.muted = muted || audioBlocked;
                currentVideo.play().catch(e => {
                  if (e.name === 'NotAllowedError') {
                    setAudioBlocked(true);
                    setShowUnlockPrompt(true);
                  }
                });
              }
            }
          }
        });
      },
      {
        threshold: 0.7,
        root: container,
      }
    );

    const reelContainers = document.querySelectorAll('[data-index]');
    reelContainers.forEach(container => observerRef.current.observe(container));

    return () => {
      if (observerRef.current) {
        reelContainers.forEach(container => observerRef.current.unobserve(container));
        observerRef.current.disconnect();
      }
    };
  }, [reels.length, muted, audioBlocked, currentReelIndex, playing]);

  // Auto-play current video
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!videoRefs.current[currentReelIndex]) return;

      const playCurrentVideo = async () => {
        try {
          await videoRefs.current[currentReelIndex].play();
          setAudioBlocked(false);
          setShowUnlockPrompt(false);
        } catch (error) {
          if (error.name === 'NotAllowedError') {
            setAudioBlocked(true);
            setShowUnlockPrompt(true);
            setMuted(true);
            setTimeout(() => {
              videoRefs.current[currentReelIndex]?.play().catch(console.log);
            }, 300);
          }
        }
      };

      // Pause all other videos
      videoRefs.current.forEach((video, index) => {
        if (video && index !== currentReelIndex) {
          video.pause();
        }
      });

      if (playing) playCurrentVideo();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentReelIndex, playing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      videoRefs.current.forEach(video => {
        if (video) {
          video.pause();
          video.src = '';
          video.load();
        }
      });
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowUp' && currentReelIndex > 0) {
        setCurrentReelIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentReelIndex < reels.length - 1) {
        setCurrentReelIndex(prev => prev + 1);
      } else if (e.key === ' ') {
        setPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentReelIndex, reels.length]);

  // Analytics
useEffect(() => {
  if (!currentUserId) return;

  const start = Date.now();

  return () => {
    const duration = Math.floor((Date.now() - start) / 1000);

    axios.post(`${API_BASE}/analytics/visit`, {
      userId: currentUserId,
      page: window.location.pathname,
      duration,
    }).catch(err => console.error("Analytics track error:", err));
  };
}, [currentUserId]);

  // Touch handlers
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartY.current) return;
    const touch = e.changedTouches[0];
    const diff = touchStartY.current - touch.clientY;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentReelIndex < reels.length - 1) {
        setCurrentReelIndex(prev => prev + 1);
      } else if (diff < 0 && currentReelIndex > 0) {
        setCurrentReelIndex(prev => prev - 1);
      }
    }
    touchStartY.current = null;
  };

  // Fixed Like Handler
 const handleLike = async (reel) => {
  const userId = getCurrentUserId(); // Use helper
  
  if (!userId) { 
    alert('Please login to like reels'); 
    return; 
  }

  setActionLoading(prev => ({ ...prev, [reel._id]: true }));
  try {
    const updatedReel = await reelService.likeReel(reel._id);
    
    // Update reels array
    setReels(prev => prev.map(r => 
      r._id === updatedReel._id ? updatedReel : r
    ));
    
    // Update likedReels state - use userId from helper
    setLikedReels(prev => ({
      ...prev,
      [reel._id]: updatedReel.likes?.some(like => 
        String(like?._id || like) === String(userId) // Use userId
      ) || false
    }));
    
  } catch (error) {
    console.error('Like error:', error);
    alert('Failed to like reel');
  } finally {
    setActionLoading(prev => ({ ...prev, [reel._id]: false }));
  }
}; 

 const handleComment = async (reel) => {
  const text = commentInputs[reel._id]?.trim();
  if (!text || !user) { 
    alert('Please login and enter a comment'); 
    return; 
  }

  setActionLoading(prev => ({ ...prev, [reel._id]: true }));
  try {
    const updatedReel = await reelService.addComment(reel._id, text);
    
    // Update state
    setReels(prev => prev.map(r => r._id === updatedReel._id ? updatedReel : r));
    
    if (selectedReel?._id === reel._id) setSelectedReel(updatedReel);
    
    // Clear input
    setCommentInputs(prev => ({ ...prev, [reel._id]: "" }));
    
  } catch (error) {
    console.error('Comment error:', error);
    alert(`Failed to add comment: ${error.response?.data?.error || error.message}`);
  } finally {
    setActionLoading(prev => ({ ...prev, [reel._id]: false }));
  }
}; 

  const handleShare = async (reel) => {
    try {
      const shareUrl = `${window.location.origin}/reels/${reel._id}`;

      if (navigator.share) {
        await navigator.share({
          title: `Check out this reel by ${reel.author?.username}`,
          text: reel.caption,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }

      const updatedReel = await reelService.shareReel(reel._id);
      setReels(prev => prev.map(r => r._id === updatedReel._id ? updatedReel : r));
    } catch (error) {
      if (error.name !== 'AbortError') {
        alert('Failed to share reel');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!reelToDelete) return;

    try {
      setDeleteModalOpen(false);
      alert('Deleting reel...');
      await reelService.deleteReel(reelToDelete._id);
      setReels(prev => prev.filter(r => r._id !== reelToDelete._id));
      setReelToDelete(null);
      alert('✅ Reel deleted successfully!');
    } catch (error) {
      alert(`❌ Failed to delete reel: ${error.message}`);
      setDeleteModalOpen(true);
    }
  };

  const togglePlay = () => setPlaying(prev => !prev);

  const unlockAudio = async () => {
    setShowUnlockPrompt(false);
    setAudioBlocked(false);
    setMuted(false);
    setTimeout(() => {
      videoRefs.current[currentReelIndex]?.play().catch(error => {
        if (error.name === 'NotAllowedError') setMuted(true);
      });
    }, 300);
  };

  const toggleMute = () => {
    setMuted(prev => {
      const newMuted = !prev;
      if (!newMuted && audioBlocked) unlockAudio();
      return newMuted;
    });
  };

  // Data Saver Functions
  const toggleDataSaver = () => {
    setDataSaverMode(prev => {
      const newMode = !prev;
      if (newMode) {
        // When enabling data saver, unload videos that aren't current
        const newLoadedUrls = {};
        reels.forEach((reel, index) => {
          if (index === currentReelIndex) {
            newLoadedUrls[reel._id] = loadedVideoUrls[reel._id];
          }
        });
        setLoadedVideoUrls(newLoadedUrls);
      }
      return newMode;
    });
  };

  // Upload functions (unchanged)
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const videoExtensions = [
      '.mp4', '.mov', '.avi', '.mkv', '.3gp', '.webm', 
      '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.ts',
      '.m2ts', '.mts', '.vob', '.ogv', '.ogg', '.qt',
      '.rm', '.rmvb', '.asf', '.amv'
    ];

    const isVideoFile = 
      file.type.startsWith('video/') || 
      videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (isVideoFile) {
      if (file.size > 50 * 1024 * 1024) {
        alert('❌ File too large! Please select a video under 50MB');
        return;
      }
      setSelectedFile(file);
      alert(`✅ Video selected: ${file.name}`);
    } else {
      alert('❌ Please select a video file (MP4, MOV, AVI, etc.)');
    }
  };

  const handleUploadReel = async () => {
    if (!selectedFile) { alert('❌ Please select a video file'); return; }
    if (!uploadForm.caption.trim()) { alert('❌ Please add a caption'); return; }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('caption', uploadForm.caption.trim());
      formData.append('music', uploadForm.music.trim());

      const token = localStorage.getItem('token');
      if (!token) { alert('🔐 Please log in again'); return; }

      const response = await fetch(`${API_BASE}/reels`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const newReel = await response.json();
      setReels(prev => [newReel, ...prev]);
      setUploadModalOpen(false);
      setSelectedFile(null);
      setUploadForm({ caption: "", music: "Original Sound" });
      alert('🎉 Your reel is now live!');
    } catch (error) {
      alert(`❌ Upload failed: ${error.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

const handleLikeComment = async (commentId) => {
  const userId = getCurrentUserId();
  if (!userId) {
    alert('Please login to like comments');
    return;
  }

  try {
    // Optimistic update
    setSelectedReel(prev => {
      if (!prev) return prev;

      const updatedComments = prev.comments?.map(comment => {
        if (comment._id === commentId) {
          const isCurrentlyLiked = comment.likes?.some(like =>
            String(like?._id || like) === String(userId)
          );

          return {
            ...comment,
            likes: isCurrentlyLiked
              ? comment.likes?.filter(like =>
                  String(like?._id || like) !== String(userId)
                ) || []
              : [...(comment.likes || []), userId],
            likeCount: isCurrentlyLiked
              ? (comment.likeCount || 1) - 1
              : (comment.likeCount || 0) + 1
          };
        }
        return comment;
      });

      return { ...prev, comments: updatedComments };
    });

    // Call API
    const response = await axios.post(
      `${API_BASE}/reels/${selectedReel._id}/comments/${commentId}/like`,
      {},
      { headers: getAuthHeaders() }
    );

    // Update with real response
    const updatedComment = response.data;

    setSelectedReel(prev => {
      if (!prev) return prev;

      const updatedComments = prev.comments?.map(comment =>
        comment._id === commentId ? updatedComment : comment
      ) || [];

      return { ...prev, comments: updatedComments };
    });

  } catch (error) {
    console.error('Error liking comment:', error);
    alert(`Failed to like comment: ${error.message}`);
  }
};

const handleAddRecomment = async (commentId) => {
  const text = recommentInputs[commentId]?.trim();
  const userId = getCurrentUserId();
  
  if (!text || !userId) {
    alert(!text ? 'Please enter recomment text' : 'Please login to recomment');
    return;
  }

  setRecommentLoading(prev => ({ ...prev, [commentId]: true }));

  try {
    // Optimistic update - REMOVE TEMPORARY USER OBJECT
    const tempRecommentId = `temp-${Date.now()}`;
    setSelectedReel(prev => {
      if (!prev) return prev;
      
      const updatedComments = prev.comments?.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            recomments: [
              ...(comment.recomments || []),
              {
                _id: tempRecommentId,
                text,
                user: userId, // Just store userId, not temporary object
                likes: [],
                likeCount: 0,
                createdAt: new Date()
              }
            ],
            recommentCount: (comment.recommentCount || 0) + 1
          };
        }
        return comment;
      });
      
      return { ...prev, comments: updatedComments };
    });

    // Call API
    const response = await axios.post(
      `${API_BASE}/reels/${selectedReel._id}/comments/${commentId}/recomment`,
      { text },
      { headers: getAuthHeaders() }
    );

    const newRecomment = response.data;

    // Update with real data - FIXED
    setSelectedReel(prev => {
      if (!prev) return prev;
      
      const updatedComments = prev.comments?.map(comment => {
        if (comment._id === commentId) {
          // Remove temp recomment and add real one
          const filteredRecomments = comment.recomments?.filter(recomment => 
            recomment._id !== tempRecommentId
          ) || [];
          
          return {
            ...comment,
            recomments: [...filteredRecomments, newRecomment],
            recommentCount: (comment.recommentCount || 0) + 1
          };
        }
        return comment;
      });
      
      return { ...prev, comments: updatedComments };
    });

    // Also update main reels list
    setReels(prev => prev.map(reel => {
      if (reel._id === selectedReel._id) {
        const updatedComments = reel.comments?.map(comment => {
          if (comment._id === commentId) {
            return {
              ...comment,
              recomments: [...(comment.recomments || []), newRecomment],
              recommentCount: (comment.recommentCount || 0) + 1
            };
          }
          return comment;
        });
        return { ...reel, comments: updatedComments };
      }
      return reel;
    }));

	      // Clear input and close
    setRecommentInputs(prev => {
      const newState = { ...prev };
      delete newState[commentId];
      return newState;
    });

    // Auto-expand
    if (!expandedComments[commentId]) {
      setExpandedComments(prev => ({ ...prev, [commentId]: true }));
    }

  } catch (error) {
    console.error('Error adding recomment:', error);
    alert(`Failed to add recomment: ${error.message}`);
    
    // Revert optimistic update on error
    setSelectedReel(prev => {
      if (!prev) return prev;
      
      const updatedComments = prev.comments?.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            recomments: comment.recomments?.filter(recomment => 
              !recomment._id.startsWith('temp-')
            ) || [],
            recommentCount: Math.max(0, (comment.recommentCount || 1) - 1)
          };
        }
        return comment;
      });
      
      return { ...prev, comments: updatedComments };
    });
  } finally {
    setRecommentLoading(prev => ({ ...prev, [commentId]: false }));
  }
};

const handleLikeRecomment = async (commentId, recommentId) => {
  const userId = getCurrentUserId();
  if (!userId) {
    alert('Please login to like recomments');
    return;
  }

  try {
    // Optimistic update
    setSelectedReel(prev => {
      if (!prev) return prev;
      
      const updatedComments = prev.comments?.map(comment => {
        if (comment._id === commentId) {
          const updatedRecomments = comment.recomments?.map(recomment => {
            if (recomment._id === recommentId) {
              const isCurrentlyLiked = recomment.likes?.some(like => {
                const likeId = typeof like === 'object' ? like?._id : like;
                return String(likeId) === String(userId);
              });
              
              return {
                ...recomment,
                likes: isCurrentlyLiked
                  ? recomment.likes?.filter(like => {
                      const likeId = typeof like === 'object' ? like?._id : like;
                      return String(likeId) !== String(userId);
                    }) || []
                  : [...(recomment.likes || []), userId],
                likeCount: isCurrentlyLiked 
                  ? (recomment.likeCount || 1) - 1 
                  : (recomment.likeCount || 0) + 1
              };
            }
            return recomment;
          });
          
          return { ...comment, recomments: updatedRecomments };
        }
        return comment;
      });
      
      return { ...prev, comments: updatedComments };
    });

    // Call API
    const response = await axios.post(
      `${API_BASE}/reels/${selectedReel._id}/comments/${commentId}/recomments/${recommentId}/like`,
      {},
      { headers: getAuthHeaders() }
    );

    const updatedRecomment = response.data;

    // Update with real data
    setSelectedReel(prev => {
      if (!prev) return prev;
      
      const updatedComments = prev.comments?.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            recomments: comment.recomments?.map(recomment => 
              recomment._id === recommentId ? updatedRecomment : recomment
            ) || []
          };
        }
        return comment;
      });
      
      return { ...prev, comments: updatedComments };
    });

  } catch (error) {
    console.error('Error liking recomment:', error);
    alert(`Failed to like recomment: ${error.message}`);
  }
};

  if (loading && reels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-purple-600 text-xl">Loading reels...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white bg-opacity-10 backdrop-blur-md p-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-purple-600 font-semibold hover:underline"
        >
          <FiArrowLeft className="mr-2" />
          Back
        </button>
        <h1 className="font-bold text-white">Reels</h1>
        <div className="flex items-center space-x-2">
          {/* Data Saver Toggle */}
          <button
            onClick={toggleDataSaver}
            className={`p-2 rounded-full ${dataSaverMode ? 'bg-green-500' : 'bg-gray-700'} bg-opacity-70`}
            title={dataSaverMode ? "Data Saver: ON" : "Data Saver: OFF"}
          >
            {dataSaverMode ? (
              <FiWifiOff className="w-5 h-5 text-white" />
            ) : (
              <FiWifi className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={() => setShowDataSaverMenu(!showDataSaverMenu)}
            className="p-2 rounded-full bg-gray-700 bg-opacity-70"
          >
            <FiSettings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Data Saver Menu */}
      {showDataSaverMenu && (
        <div className="absolute top-16 right-4 z-50 bg-gray-800 rounded-lg p-4 w-64 shadow-xl">
          <h3 className="text-white font-semibold mb-3">Data Settings</h3>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-sm">Data Saver Mode</span>
            <button
              onClick={toggleDataSaver}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                dataSaverMode ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  dataSaverMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="mb-3">
            <label className="text-white text-sm block mb-1">Video Quality</label>
            <select
              value={videoQuality}
              onChange={(e) => setVideoQuality(e.target.value)}
              className="w-full bg-gray-700 text-white rounded p-2 text-sm"
            >
              <option value="auto">Auto (Recommended)</option>
              <option value="high">High Quality</option>
              <option value="medium">Medium Quality</option>
              <option value="low">Low Quality</option>
            </select>
          </div>
          
          <div className="text-xs text-gray-400">
            {dataSaverMode ? 
              "✓ Only loading current video to save data" : 
              "✓ Loading multiple videos for smooth scrolling"}
            <div className="mt-1">
              Loaded: {Object.keys(loadedVideoUrls).length} of {reels.length} videos
            </div>
          </div>
        </div>
      )}

      {/* Audio Unlock Prompt */}
      {showUnlockPrompt && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-500 text-black px-4 py-3 rounded-lg shadow-lg max-w-xs text-center">
            <p className="text-sm font-medium mb-2">🔊 Sound is available!</p>
            <p className="text-xs opacity-90 mb-3">Tap the mute button or anywhere to enable audio</p>
            <button
              onClick={unlockAudio}
              className="bg-black text-white px-4 py-1 rounded-full text-xs font-medium hover:bg-gray-800 transition"
            >
              Enable Sound
            </button>
          </div>
        </div>
      )}

      {/* Reels Container */}
      <div
        className="h-full snap-y snap-mandatory overflow-y-scroll pt-12"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {reels.length === 0 ? (
  <div className="h-full flex items-center justify-center text-white">
    <div className="text-center">
      {activeTab === 'following' ? (
        <>
          <FiUsers className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No reels from followed users</p>
          <p className="text-sm text-gray-400 mb-4">
            Follow some users to see their reels here!
          </p>
          <button
            onClick={() => router.push('/explore')}
            className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition"
          >
            Find Users to Follow
          </button>
        </>
      ) : activeTab === 'myreels' ? (
        <>
          <FiVideo className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">You haven't created any reels yet</p>
          <p className="text-sm text-gray-400 mb-4">Start creating reels to build your collection!</p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition"
          >
            Create Your First Reel
          </button>
        </>
      ) : (
        <>
          <FiVideo className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No reels yet</p>
          <p className="text-sm text-gray-400 mb-4">Be the first to create a reel!</p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition"
          >
            Create Your First Reel
          </button>
        </>
      )}
    </div>
  </div>
        ) : (
          <>
            {reels.map((reel, index) => (
              <div 
                key={reel._id} 
                className="h-full snap-start relative flex items-center justify-center"
                data-index={index}
              >
                {/* Video */}
                  <video
                    ref={el => {
                      videoRefs.current[index] = el;
                    }}
                    src={loadedVideoUrls[reel._id]}
                    className="h-full w-full object-cover"
                    loop
                    muted={muted || audioBlocked || index !== currentReelIndex}
                    autoPlay={index === currentReelIndex}
                    onClick={() => {
                      togglePlay();
                      if (audioBlocked) unlockAudio();
                    }}
                    playsInline
                    preload={shouldLoadVideo(index) ? "auto" : "metadata"}
                    onLoadStart={() => setVideoLoading(prev => ({ ...prev, [reel._id]: true }))}
                    onLoadedData={() => setVideoLoading(prev => ({ ...prev, [reel._id]: false }))}
                    onError={(e) => {
                      setVideoLoading(prev => ({ ...prev, [reel._id]: false }));
                      console.error(`Failed to load video: ${reel.videoUrl}`);
                    }}
                  />
                  

                {/* Video Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                {/* Right Action Buttons */}
                <div className="absolute right-4 bottom-36 flex flex-col items-center space-y-6">
                  {/* Mute/Unmute Button */}
                  <button
                    onClick={toggleMute}
                    className="flex flex-col items-center relative"
                  >
                    {muted || audioBlocked ? (
                      <FiVolumeX className="w-8 h-8 text-white hover:text-purple-300 transition" />
                    ) : (
                      <FiVolume2 className="w-8 h-8 text-white hover:text-purple-300 transition" />
                    )}
                    <span className="text-white text-xs mt-1">
                      {audioBlocked ? "Locked" : muted ? "Unmute" : "Mute"}
                    </span>
                    {audioBlocked && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></div>
                    )}
                  </button>

                  {/* Like Button - FIXED */}
                  <button
                    onClick={() => handleLike(reel)}
                    disabled={actionLoading[reel._id]}
                    className="flex flex-col items-center"
                  >
                    {likedReels[reel._id] ? (
                      <FaHeart className="w-8 h-8 text-red-500" />
                    ) : (
                      <FiHeart className="w-8 h-8 text-white hover:text-purple-300 transition" />
                    )}
                    <span className="text-white text-xs mt-1">{reel.likes?.length || 0}</span>
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() => {
                      setSelectedReel(reel);
                      setCommentModalOpen(true);
                    }}
                    className="flex flex-col items-center"
                  >
                    <FiMessageCircle className="w-8 h-8 text-white hover:text-purple-300 transition" />
                    <span className="text-white text-xs mt-1">{reel.comments?.length || 0}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(reel)}
                    className="flex flex-col items-center"
                  >
                    <FiShare className="w-8 h-8 text-white hover:text-purple-300 transition" />
                    <span className="text-white text-xs mt-1">Share</span>
                  </button>
                  
                  {/* Three Dots Button - Only show for reel owner */}
{getCurrentUserId() && reel.author?._id === getCurrentUserId() && (
  <div className="relative z-50">
    <button
      onClick={() => {
        setReelToDelete(reel);
        setDeleteModalOpen(true);
      }}
      className="flex flex-col items-center"
    >
      <FiMoreHorizontal className="w-8 h-8 text-white hover:text-purple-300 transition" />
    </button>
  </div>
)}
                </div>

                {/* Reel Content */}
                <div className="absolute bottom-20 left-0 right-0 p-4 text-white">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 mb-2">
                    <img
                      src={buildAssetUrl(reel.author?.profilePicture)}
                      alt={reel.author?.username}
                      className="w-8 h-8 rounded-full border-2 border-purple-500"
                      onError={(e) => {
                        e.target.src = `https://i.pravatar.cc/150?u=${reel.author?.username || 'unknown'}`;
                      }}
                    />
                    <span className="font-semibold text-sm">{reel.author?.username}</span>
                    <FollowButton targetUser={reel.author} />
                  </div>

                  {/* Caption */}
                  <p className="text-sm font-medium mb-2 line-clamp-2">{reel.caption}</p>

                  {/* Music */}
                  <div className="flex items-center space-x-2 text-xs text-purple-200 opacity-90">
                    <FiMusic className="w-3 h-3" />
                    <span>{reel.music}</span>
                  </div>
                </div>

                {/* Data Saver Indicator */}
                {dataSaverMode && !loadedVideoUrls[reel._id] && index !== currentReelIndex && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Data Saver
                  </div>
                )}

                {/* Play/Pause Overlay */}
                {!playing && index === currentReelIndex && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10"
                  >
                    <FaPlay className="w-16 h-16 text-purple-400 opacity-80" />
                  </button>
                )}
              </div>
            ))}

            {/* Loading More Indicator */}
            {isFetchingMore && (
              <div className="h-32 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <p className="text-white text-sm mt-2">Loading more reels...</p>
                </div>
              </div>
            )}

            {/* End of Content */}
            {!hasMore && reels.length > 0 && (
              <div className="h-32 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-sm">You've reached the end! 🎉</p>
                  <p className="text-xs mt-1">No more reels to load</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      
{reels.length > 0 && (
  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50">
    <div className="flex space-x-1 overflow-x-auto max-w-[90vw] px-4">
      {reels.map((_, index) => (
        <div
          key={index}
          className={`flex-shrink-0 h-1 rounded-full transition-all duration-300 ${
            index === currentReelIndex
              ? "bg-purple-500 w-8"
              : "bg-gray-500 w-4"
          }`}
        />
      ))}
    </div>
  </div>
)}

      {/* Bottom Navbar */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-black/90 backdrop-blur-lg border-t border-gray-800/50">
        <div className="flex justify-around items-center py-3 px-1">
          {/* Home */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center text-gray-400 hover:text-white transition min-w-0 px-1"
          >
            <FiHome className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>

          {/* For You */}
          <button
            onClick={() => fetchReels('foryou')}
            className={`flex flex-col items-center transition min-w-0 px-1 ${
              activeTab === 'foryou' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FiHeart className="w-6 h-6" />
            <span className="text-xs mt-1">For You</span>
            {activeTab === 'foryou' && (
              <div className="w-1 h-1 bg-purple-400 rounded-full mt-1"></div>
            )}
          </button>

          {/* Create Reel */}
          <div className="relative -top-6 mx-1">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="bg-purple-600 text-white rounded-full p-3.5 shadow-xl hover:bg-purple-700 transition-transform hover:scale-105 active:scale-95 border-2 border-white/20"
            >
              <FiPlus className="w-6 h-6" />
            </button>
          </div>

         {/* Following tab button - FIXED */}
<button
  onClick={() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setActiveTab('following');
      fetchReels('following', 1, false); // Reset to page 1
    } else {
      alert('❌ Please login to view followed users reels');
      router.push('/login');
    }
  }}
  className={`flex flex-col items-center transition min-w-0 px-1 ${
    activeTab === 'following' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
  }`}
>
  <FiUsers className="w-6 h-6" />
  <span className="text-xs mt-1">Following</span>
  {activeTab === 'following' && (
    <div className="w-1 h-1 bg-purple-400 rounded-full mt-1"></div>
  )}
</button>

{/* My Reels tab button - FIXED */}
<button
  onClick={() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setActiveTab('myreels');
      fetchReels('myreels', 1, false); // Reset to page 1
    } else {
      alert('❌ Please login to view your reels');
      router.push('/login');
    }
  }}
  className={`flex flex-col items-center transition min-w-0 px-1 ${
    activeTab === 'myreels' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
  }`}
>
  <FiVideo className="w-6 h-6" />
  <span className="text-xs mt-1">My Reels</span>
  {activeTab === 'myreels' && (
    <div className="w-1 h-1 bg-purple-400 rounded-full mt-1"></div>
  )}
</button> 
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Reel</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this reel? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Reel Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create New Reel</h2>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4">
              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Video
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors"
                >
                  <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'Tap to browse ALL files and folders'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    📱 Opens complete file browser • All file types • Max: 50MB
                  </p>
                </button>
                {selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiVideo className="w-6 h-6 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          Size: {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  value={uploadForm.caption}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Describe your reel..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-purple-500"
                  rows="3"
                />
              </div>

              {/* Music */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Music
                </label>
                <input
                  type="text"
                  value={uploadForm.music}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, music: e.target.value }))}
                  placeholder="Add music name..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUploadReel}
                disabled={uploadLoading || !selectedFile}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {uploadLoading ? 'Uploading...' : 'Upload Reel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal (unchanged) */}
      {commentModalOpen && selectedReel && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <button
              onClick={() => setCommentModalOpen(false)}
              className="text-white"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-white font-semibold">Comments</h2>
            <div className="w-6"></div>
          </div>

          <div className="flex items-center p-4 border-b border-gray-700">
            <video
              src={buildAssetUrl(selectedReel.videoUrl)}
              className="w-16 h-24 rounded-lg object-cover"
              loop
              muted
              autoPlay
              playsInline
            />
            <div className="ml-4 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <img
                  src={buildAssetUrl(selectedReel.author?.profilePicture)}
                  alt={selectedReel.author?.username}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.target.src = `https://i.pravatar.cc/150?u=${selectedReel.author?.username || 'unknown'}`;
                  }}
                />
                <span className="text-white text-sm font-semibold">
                  {selectedReel.author?.username}
                </span>
              </div>
              <p className="text-white text-sm line-clamp-2">{selectedReel.caption}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
  {selectedReel.comments && selectedReel.comments.length > 0 ? (
    selectedReel.comments.map((comment, idx) => {
      // Skip recomments (only show top-level comments)
      if (comment.parentCommentId) return null;
      
      const isExpanded = expandedComments[comment._id];
      const showRecommentInput = recommentInputs[comment._id] !== undefined;
      const recommentText = recommentInputs[comment._id] || "";
      const isLoading = recommentLoading[comment._id];
      
      return (
        <div key={comment._id || idx} className="flex space-x-3 mb-6 pb-4 border-b border-gray-800 last:border-0">
          <img
            src={buildAssetUrl(comment.user?.profilePicture)}
            alt={comment.user?.username}
            className="w-8 h-8 rounded-full flex-shrink-0"
            onError={(e) => {
              e.target.src = `https://i.pravatar.cc/150?u=${comment.user?.username || 'unknown'}`;
            }}
          />
          <div className="flex-1">
            {/* User info */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-white font-semibold text-sm">
                {comment.user?.username}
              </span>
              <span className="text-gray-400 text-xs">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {/* Comment text */}
            <p className="text-white text-sm mb-3">{comment.text}</p>
            
            {/* COMMENT STATS AND ACTIONS */}
            <div className="flex items-center space-x-4 mb-3">
              {/* Like button */}
              <button
                onClick={() => handleLikeComment(comment._id)}
                className="flex items-center space-x-1 text-gray-400 hover:text-white text-xs"
              >
                {comment.likes?.some(like => 
                  String(like?._id || like) === String(getCurrentUserId())
                ) ? (
                  <FaHeart className="w-3 h-3 text-red-500" />
                ) : (
                  <FiHeart className="w-3 h-3" />
                )}
                <span>{comment.likeCount || 0}</span>
              </button>
              
              {/* Recomment button */}
              <button
                onClick={() => {
                  setRecommentInputs(prev => ({
                    ...prev,
                    [comment._id]: ""
                  }));
                }}
                className="flex items-center space-x-1 text-gray-400 hover:text-white text-xs"
              >
                <FiMessageCircle className="w-3 h-3" />
                <span>Recomment</span>
                {comment.recommentCount > 0 && (
                  <span className="text-gray-500 ml-1">({comment.recommentCount})</span>
                )}
              </button>
              
              {/* Show/Hide recomments toggle */}
              {comment.recommentCount > 0 && (
                <button
                  onClick={() => {
                    setExpandedComments(prev => ({
                      ...prev,
                      [comment._id]: !prev[comment._id]
                    }));
                  }}
                  className="flex items-center space-x-1 text-gray-400 hover:text-white text-xs"
                >
                  <FiChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  <span>
                    {isExpanded ? 'Hide' : 'Show'} {comment.recommentCount} 
                    recomment{comment.recommentCount !== 1 ? 's' : ''}
                  </span>
                </button>
              )}
            </div>
            
            {/* RECOMMENT INPUT */}
            {showRecommentInput && (
              <div className="mt-3 flex space-x-2">
                <input
                  type="text"
                  value={recommentText}
                  onChange={(e) => setRecommentInputs(prev => ({
                    ...prev,
                    [comment._id]: e.target.value
                  }))}
                  placeholder="Write a recomment..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-full px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleAddRecomment(comment._id)}
                />
                <button
                  onClick={() => handleAddRecomment(comment._id)}
                  disabled={isLoading || !recommentText.trim()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Posting...' : 'Post'}
                </button>
                <button
                  onClick={() => {
                    setRecommentInputs(prev => {
                      const newState = { ...prev };
                      delete newState[comment._id];
                      return newState;
                    });
                  }}
                  className="bg-gray-700 text-white px-3 py-2 rounded-full text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
            
            
            {/* RECOMMENTS LIST (when expanded) */}
{isExpanded && comment.recomments && comment.recomments.length > 0 && (
  <div className="mt-4 ml-4 pl-3 border-l-2 border-gray-700">
    <h4 className="text-gray-400 text-xs font-semibold mb-2">
      {comment.recommentCount} Recomment{comment.recommentCount !== 1 ? 's' : ''}
    </h4>
    
    {comment.recomments.map((recomment) => {
      // Handle both user object and user ID string
      const user = recomment.user;
      const userId = typeof user === 'object' ? user?._id : user;
      const username = typeof user === 'object' ? user?.username : 'Loading...';
      const profilePicture = typeof user === 'object' ? user?.profilePicture : '';
      
      return (
        <div key={recomment._id} className="mb-3">
          <div className="flex space-x-2">
            <img
              src={buildAssetUrl(profilePicture)}
              alt={username}
              className="w-6 h-6 rounded-full flex-shrink-0"
              onError={(e) => {
                e.target.src = `https://i.pravatar.cc/150?u=${username || 'unknown'}`;
              }}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-white font-semibold text-xs">
                  {username}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(recomment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-white text-sm mb-1">{recomment.text}</p>
              
              {/* Recomment like button */}
              <button
                onClick={() => handleLikeRecomment(comment._id, recomment._id)}
                className="flex items-center space-x-1 text-gray-400 hover:text-white text-xs"
              >
                {recomment.likes?.some(like => {
                  const likeId = typeof like === 'object' ? like?._id : like;
                  return String(likeId) === String(getCurrentUserId());
                }) ? (
                  <FaHeart className="w-2.5 h-2.5 text-red-500" />
                ) : (
                  <FiHeart className="w-2.5 h-2.5" />
                )}
                <span>{recomment.likeCount || 0}</span>
              </button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}
          </div>
        </div>
      );
    })
  ) : (
    <div className="text-center text-gray-400 mt-8">
      <FiMessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>No comments yet</p>
      <p className="text-sm">Be the first to comment!</p>
    </div>
  )}
</div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={commentInputs[selectedReel._id] || ""}
                onChange={(e) => setCommentInputs(prev => ({
                  ...prev,
                  [selectedReel._id]: e.target.value
                }))}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 border border-gray-600 rounded-full px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => handleComment(selectedReel)}
                disabled={actionLoading[selectedReel._id]}
                className="bg-purple-600 text-white px-6 py-3 rounded-full text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-1"
              >
                <FiSend className="w-4 h-4" />
                <span>Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
