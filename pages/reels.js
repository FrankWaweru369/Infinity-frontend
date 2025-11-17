import { useState, useRef, useEffect } from "react";
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
  FiSend
} from "react-icons/fi";
import { FaHeart, FaPause, FaPlay } from "react-icons/fa";
import { reelService } from "../services/reelService";
import { useAuth } from "../context/AuthContext";

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
  const videoRefs = useRef([]);

  // Fetch reels from backend
  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const data = await reelService.getReels(1, 20);
      setReels(data.reels || []);
      
      const initialLikedState = {};
      data.reels.forEach(reel => {
        if (reel.likes && user) {
          initialLikedState[reel._id] = reel.likes.some(like => 
            like._id === user._id || like === user._id
          );
        }
      });
      setLikedReels(initialLikedState);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Video control effects
  useEffect(() => {
    if (videoRefs.current[currentReelIndex]) {
      const playVideo = async () => {
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
              if (videoRefs.current[currentReelIndex]) {
                videoRefs.current[currentReelIndex].play().catch(console.log);
              }
            }, 100);
          }
        }
      };
      
      playVideo();
    }
  }, [currentReelIndex]);

  const handleLike = async (reel) => {
    if (!user) {
      alert('Please login to like reels');
      return;
    }

    setActionLoading(prev => ({ ...prev, [reel._id]: true }));
    try {
      const updatedReel = await reelService.likeReel(reel._id);
      setReels(prev => prev.map(r => r._id === updatedReel._id ? updatedReel : r));
      setLikedReels(prev => ({
        ...prev,
        [reel._id]: !prev[reel._id]
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
      setReels(prev => prev.map(r => r._id === updatedReel._id ? updatedReel : r));
      if (selectedReel && selectedReel._id === reel._id) {
        setSelectedReel(updatedReel);
      }
      setCommentInputs(prev => ({ ...prev, [reel._id]: "" }));
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to add comment');
    } finally {
      setActionLoading(prev => ({ ...prev, [reel._id]: false }));
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!confirm("Are you sure you want to delete this reel?")) return;
    
    try {
      await reelService.deleteReel(reelId);
      setReels(prev => prev.filter(r => r._id !== reelId));
      alert('Reel deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete reel');
    }
  };

  const handleScroll = (e) => {
    if (e.deltaY > 0 && currentReelIndex < reels.length - 1) {
      setCurrentReelIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentReelIndex > 0) {
      setCurrentReelIndex(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    setPlaying(!playing);
  };

  const toggleLikesList = (reelId) => {
    setLikesListOpenFor(prev => (prev === reelId ? null : reelId));
  };

  const unlockAudio = async () => {
    setShowUnlockPrompt(false);
    setAudioBlocked(false);
    setMuted(false);
    
    setTimeout(() => {
      if (videoRefs.current[currentReelIndex]) {
        videoRefs.current[currentReelIndex].play().catch(error => {
          if (error.name === 'NotAllowedError') {
            setMuted(true);
            videoRefs.current[currentReelIndex].play().catch(console.log);
          }
        });
      }
    }, 300);
  };

  const toggleMute = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);
    
    if (!newMutedState && audioBlocked) {
      unlockAudio();
    }
  };

  const buildAssetUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url.startsWith('/') ? url : `/${url}`}`;
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

      {/* Full-screen unlock overlay */}
      {showUnlockPrompt && (
        <div 
          className="absolute inset-0 z-40 bg-black bg-opacity-20 flex items-center justify-center"
          onClick={unlockAudio}
        >
          <div className="text-white text-center">
            <FiVolume2 className="w-12 h-12 mx-auto mb-2 animate-pulse" />
            <p className="text-lg font-semibold">Tap to enable sound</p>
          </div>
        </div>
      )}

      {/* Reels Container */}
      <div 
        className="h-full snap-y snap-mandatory overflow-y-scroll pt-12"
        onWheel={handleScroll}
      >
        {reels.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white">
            <p>No reels yet. Be the first to create one!</p>
          </div>
        ) : (
          reels.map((reel, index) => (
            <div key={reel._id} className="h-full snap-start relative flex items-center justify-center">
              {/* Video */}
              <video
                ref={el => videoRefs.current[index] = el}
                src={buildAssetUrl(reel.videoUrl)}
                className="h-full w-full object-cover"
                loop
                muted={muted || audioBlocked}
                autoPlay={index === currentReelIndex}
                onClick={(e) => {
                  togglePlay();
                  if (audioBlocked) {
                    unlockAudio();
                  }
                }}
                playsInline
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
                <button className="flex flex-col items-center">
                  <FiShare className="w-8 h-8 text-white hover:text-purple-300 transition" />
                  <span className="text-white text-xs mt-1">Share</span>
                </button>

                {/* More Options - Only show for reel owner */}
                {user && reel.author?._id === user._id && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenFor(menuOpenFor === reel._id ? null : reel._id)}
                      className="flex flex-col items-center"
                    >
                      <FiMoreHorizontal className="w-8 h-8 text-white hover:text-purple-300 transition" />
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpenFor === reel._id && (
                      <div className="absolute right-0 bottom-full mb-2 w-32 bg-white rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => handleDeleteReel(reel._id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-lg"
                        >
                          Delete Reel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reel Content */}
              <div className="absolute bottom-16 left-0 right-0 p-4 text-white">
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
                  <span className="font-semibold text-sm">@{reel.author?.username}</span>
                  <button className="ml-auto bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-purple-700 transition">
                    Follow
                  </button>
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

      {/* Bottom Navbar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 backdrop-blur-lg border-t border-gray-800">
        <div className="flex justify-around items-center py-3">
          <button className="flex flex-col items-center text-purple-400">
            <FiHeart className="w-6 h-6" />
            <span className="text-xs mt-1">For You</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <FiMessageCircle className="w-6 h-6" />
            <span className="text-xs mt-1">Following</span>
          </button>
          <button className="flex flex-col items-center text-gray-400">
            <FiMusic className="w-6 h-6" />
            <span className="text-xs mt-1">Explore</span>
          </button>
        </div>
      </div>

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
              muted={muted}
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
                  @{selectedReel.author?.username}
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
                        @{comment.user?.username}
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
