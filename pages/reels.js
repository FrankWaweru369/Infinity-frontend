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
  FiTrash2
} from "react-icons/fi";
import { FaHeart, FaPause, FaPlay } from "react-icons/fa";
import { reelService } from "../services/reelService";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import config from '../src/config';

const API_BASE = config.apiUrl;

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

// FollowButton Component
const FollowButton = ({ targetUser }) => {
  const [isFollowing, setIsFollowing] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!user || user._id === targetUser._id) {
    return null;
  }
  const loadFollowStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/users/${targetUser.username || targetUser._id}`, {
        headers: getAuthHeaders()
      });

      const userData = response.data;
      const currentUserId = user._id;
      const isCurrentlyFollowing = userData.followers?.some(follower =>
        follower._id === currentUserId || follower === currentUserId
      );
      setIsFollowing(isCurrentlyFollowing);
    } catch (error) {
      console.error('Error loading follow status:', error);
      setIsFollowing(false);
    }
  }, [targetUser._id, targetUser.username, user._id]);

  useEffect(() => {
    if (user && targetUser && user._id !== targetUser._id) {
      loadFollowStatus();
    }
  }, [loadFollowStatus, user, targetUser]);

  const handleFollow = async () => {
    if (loading || !user || user._id === targetUser._id) return;

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

  if (!user || user._id === targetUser._id) return null;
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

  const videoRefs = useRef([]);
  const touchStartY = useRef(null);
  const fileInputRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);



useEffect(() => {
  if (!reels.length) return;

  const container = document.querySelector('.h-full.snap-y.snap-mandatory.overflow-y-scroll');
  if (!container) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index'));
          
          // Only update if it's a different reel
          if (index !== currentReelIndex) {
            setCurrentReelIndex(index);
            
            // Mute and pause all other videos
            videoRefs.current.forEach((video, i) => {
              if (video && i !== index) {
                video.muted = true;
                video.pause();
              }
            });
            
            // Play the current video
            const currentVideo = videoRefs.current[index];
            if (currentVideo) {
              currentVideo.muted = muted || audioBlocked;
              currentVideo.play().catch(e => console.log("Auto-play prevented"));
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

  // Observe all reel containers
  const reelContainers = document.querySelectorAll('[data-index]');
  reelContainers.forEach(container => observer.observe(container));

  return () => {
    reelContainers.forEach(container => observer.unobserve(container));
    observer.disconnect();
  };
}, [reels.length, muted, audioBlocked, currentReelIndex]); 



useEffect(() => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.id);
    }
  } catch (error) {
    console.error("Error decoding token:", error);
  }
}, []);

  const fetchReels = useCallback(async (filterType = 'foryou') => {
  try {
    setLoading(true);
    let data;

    if (filterType === 'myreels') {
      if (!user) { 
        router.push('/login'); 
        return; 
      }
      
      // Get ALL reels and filter for current user
      const allReels = await reelService.getReels(1, 100);
      
      if (allReels?.reels && Array.isArray(allReels.reels)) {
        const userReels = allReels.reels.filter(reel => {
          const currentUserId = user._id.toString();
          
          // Check various possible user ID locations
          const possibleMatches = [
            reel.userId?.toString(),
            reel.user?._id?.toString(),
            reel.creatorId?.toString(),
            reel.creator?._id?.toString(),
            reel.authorId?.toString(),
            reel.author?._id?.toString(),
            reel.ownerId?.toString(),
            reel.owner?._id?.toString(),
            reel.postedBy?.toString(),
            reel.postedBy?._id?.toString(),
            reel.createdBy?.toString(),
            reel.createdBy?._id?.toString()
          ].filter(Boolean);
          
          return possibleMatches.some(id => id === currentUserId);
        });
        
        data = { reels: userReels };
      } else {
        data = { reels: [] };
      }

    } else if (filterType === 'following') {
      if (!user) { 
        router.push('/login'); 
        return; 
      }
      // For now, use regular reels until following is implemented
      data = await reelService.getReels(1, 20);
    } else {
      // For You tab
      data = await reelService.getReels(1, 20);
    }

    // Handle the consistent API format { reels: [...] }
    const reelsData = data?.reels || [];
    setReels(reelsData);
    setActiveTab(filterType);

  } catch (error) {
    console.error('Error fetching reels:', error);
  } finally {
    setLoading(false);
  }
}, [user, router]);

useEffect(() => { fetchReels(); }, [fetchReels]);

  useEffect(() => {
  const handleScroll = () => {
    const reelContainers = document.querySelectorAll('.snap-start');
    let closestReel = null;
    let smallestDistance = Infinity;

    reelContainers.forEach((container, index) => {
      const rect = container.getBoundingClientRect();
      const reelCenter = rect.top + (rect.height / 2);
      const viewportCenter = window.innerHeight / 2;
      const distanceFromCenter = Math.abs(reelCenter - viewportCenter);

      if (distanceFromCenter < smallestDistance) {
        smallestDistance = distanceFromCenter;
        closestReel = index;
      }
    });

    if (closestReel !== null && closestReel !== currentReelIndex) {
      setCurrentReelIndex(closestReel);
    }
  };

  let scrollTimeout;
  const debouncedScroll = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScroll, 100);
  };

  window.addEventListener('scroll', debouncedScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', debouncedScroll);
    clearTimeout(scrollTimeout);
  };
}, [currentReelIndex]);

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
  }, 500);

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



  // Action handlers
  const handleLike = async (reel) => {
    if (!user) { alert('Please login to like reels'); return; }

    setActionLoading(prev => ({ ...prev, [reel._id]: true }));
    try {
      const updatedReel = await reelService.likeReel(reel._id);
      setReels(prev => prev.map(r => r._id === updatedReel._id ? updatedReel : r));
      setLikedReels(prev => ({ ...prev, [reel._id]: !prev[reel._id] }));
    } catch (error) {
      console.error('Like error:', error);
      alert('Failed to like reel');
    } finally {
      setActionLoading(prev => ({ ...prev, [reel._id]: false }));
    }
  };

  const handleComment = async (reel) => {
    const text = commentInputs[reel._id]?.trim();
    if (!text || !user) { alert('Please login and enter a comment'); return; }

    setActionLoading(prev => ({ ...prev, [reel._id]: true }));
    try {
      const updatedReel = await reelService.addComment(reel._id, text);
      setReels(prev => prev.map(r => r._id === updatedReel._id ? updatedReel : r));
      if (selectedReel?._id === reel._id) setSelectedReel(updatedReel);
      setCommentInputs(prev => ({ ...prev, [reel._id]: "" }));
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to add comment');
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
    // Show loading state
    setDeleteModalOpen(false);
    
    alert('Deleting reel...');
    
    await reelService.deleteReel(reelToDelete._id);
    
    // Remove from UI immediately
    setReels(prev => prev.filter(r => r._id !== reelToDelete._id));
    
    // Reset state
    setReelToDelete(null);
    
    alert('✅ Reel deleted successfully!');
    
  } catch (error) {
    alert(`❌ Failed to delete reel: ${error.message}`);
    // Re-open modal if error
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

  // Upload functions
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

  

  if (loading) {
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
        <span />
      </div>

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
              {user ? 'Start following users to see their reels here!' : 'Please login to see followed users'}
            </p>
            {user && (
              <button
                onClick={() => router.push('/explore')}
                className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition"
              >
                Find Users to Follow
              </button>
            )}
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
    reels.map((reel, index) => (
      <div key={reel._id} className="h-full snap-start relative flex items-center justify-center"
        data-index={index}>
        {/* Video */}
        <video
          ref={el => videoRefs.current[index] = el}
          src={buildAssetUrl(reel.videoUrl)}
          className="h-full w-full object-cover"
          loop
          muted={muted || audioBlocked || index !== currentReelIndex}
          autoPlay={index === currentReelIndex}
          onClick={() => {
            togglePlay();
            if (audioBlocked) unlockAudio();
          }}
          playsInline
          onLoadStart={() => setVideoLoading(prev => ({ ...prev, [reel._id]: true }))}
          onLoadedData={() => setVideoLoading(prev => ({ ...prev, [reel._id]: false }))}
          onError={() => {
            setVideoLoading(prev => ({ ...prev, [reel._id]: false }));
            console.error(`Failed to load video: ${reel.videoUrl}`);
          }}
        />

        {/* Video Loading Indicator */}
        {videoLoading[reel._id] && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white">Loading...</div>
          </div>
        )}

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

          {/* Like Button */}
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
          {user && reel.author?._id === user._id && (
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

        {/* Reel Content*/}
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
    ))
  )}
</div>

{/* Progress Indicator */}
{reels.length > 0 && (
  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex space-x-1 z-50">
    {reels.map((_, index) => (
      <div
        key={index}
        className={`h-1 rounded-full transition-all duration-300 ${
          index === currentReelIndex
            ? "bg-purple-500 w-8"
            : "bg-gray-500 w-4"
        }`}
      />
    ))}
  </div>
)}
		{/* Bottom Navbar - Always Visible */}
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

    {/* Create Reel - Centered Floating Button */}
    <div className="relative -top-6 mx-1">
      <button
        onClick={() => setUploadModalOpen(true)}
        className="bg-purple-600 text-white rounded-full p-3.5 shadow-xl hover:bg-purple-700 transition-transform hover:scale-105 active:scale-95 border-2 border-white/20"
      >
        <FiPlus className="w-6 h-6" />
      </button>
    </div>

    {/* Following */}
    <button
      onClick={() => {
        if (user) {
          fetchReels('following');
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

    {/* My Reels */}
    <button
      onClick={() => {
        if (user) {
          setActiveTab('myreels');
          fetchReels('myreels');
        } else {
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

      {/* Upload Reel Modal*/}
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
      {/* File Upload - IMPROVED */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Select Video
  </label>
  
  {/* Hidden file input - CHANGED ACCEPT */}
  <input
    ref={fileInputRef}
    type="file"
    accept="*/*"  // ← CHANGE THIS LINE - accepts ALL file types
    onChange={handleFileSelect}
    className="hidden"
  />
  
  {/* Custom file input button - UPDATED TEXT */}
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
  
  {/* Selected file preview - ADD THIS SECTION */}
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

      {/* Comment Modal */}
      {commentModalOpen && selectedReel && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          {/* Modal Header */}
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

          {/* Reel Preview */}
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

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedReel.comments && selectedReel.comments.length > 0 ? (
              selectedReel.comments.map((comment, idx) => (
                <div key={idx} className="flex space-x-3 mb-4">
                  <img
                    src={buildAssetUrl(comment.user?.profilePicture)}
                    alt={comment.user?.username}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    onError={(e) => {
                      e.target.src = `https://i.pravatar.cc/150?u=${comment.user?.username || 'unknown'}`;
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-semibold text-sm">
                        {comment.user?.username}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white text-sm">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 mt-8">
                <FiMessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            )}
          </div>

          {/* Comment Input */}
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
