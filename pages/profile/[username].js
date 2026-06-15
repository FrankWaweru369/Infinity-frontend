import { useTheme } from '../../context/ThemeContext';
import { useRouter } from "next/router";
import { usePosts } from "../../context/PostsContext";
import config from '../../src/config';
import {
  FiArrowLeft,
  FiHeart,
  FiMessageCircle,
  FiImage,
  FiMoreHorizontal,
  FiX,
  FiUser,
  FiInfo,
  FiMapPin,
  FiGlobe,
  FiPhone,
  FiCalendar,
  FiCamera,
  FiHome,
  FiPlus,
  FiVideo,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { FaHeart, FaVenusMars } from "react-icons/fa";
import { User, Info, MapPin, Globe, Phone, Calendar, Edit3, UserCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import FullImageModal from "../../components/FullImageModal";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation, Pagination } from "swiper/modules";
import FullscreenViewer from "../../components/FullscreenViewer";

const API_BASE = config.apiUrl;

export default function ProfilePage() {
  const { isDarkMode } = useTheme(); // Add dark mode support
  const router = useRouter();
  const { username } = router.query;
  const postsContext = usePosts();
  const { posts = [],setPosts, loading:postsLoading } = postsContext || {};

  // profile user (the page being viewed)
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // posts for this user (filtered from PostsContext)
  const [userPosts, setUserPosts] = useState([]);

  // UI state
  const [modalType, setModalType] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [likesListOpenFor, setLikesListOpenFor] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({
  fullName: "",
  bio: "",
  gender: "",
  dob: "",
  location: "",
  website: "",
  phone: "",
  profilePicture: null,
  coverPhoto: null,
});
 const [editPost, setEditPost] = useState(null); 
const [editText, setEditText] = useState("");
const [editImage, setEditImage] = useState(null);
const [previewImage, setPreviewImage] = useState(null);
const [activeCommentsPost, setActiveCommentsPost] = useState(null);
const [commentLoading, setCommentLoading] = useState({});
const [isMounted, setIsMounted] = useState(false);
const [fullImage, setFullImage] = useState(null);
const [likedPosts, setLikedPosts] = useState({});
const [expandedComments, setExpandedComments] = useState({});
const [recommentInputs, setRecommentInputs] = useState({});
const [recommentLoading, setRecommentLoading] = useState({});
const [fullscreenImages, setFullscreenImages] = useState([]);
const [feedbackInputs, setFeedbackInputs] = useState({});
const [feedbackLoading, setFeedbackLoading] = useState({});
const [activeFeedbackPost, setActiveFeedbackPost] = useState(null);
const [expandedPosts, setExpandedPosts] = useState({});

const [loading, setLoading] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);

const [hasMore, setHasMore] = useState(true);

const observerRef = useRef(null);

const dropdownRef = useRef(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        !loadingMore &&
        hasMore
      ) {
        fetchMoreUserPosts();
      }
    },
    {
      root: null,
      rootMargin: "2000px",
      threshold: 0,
    }
  );

  const current = observerRef.current;

  if (current) observer.observe(current);

  return () => {
    if (current) observer.unobserve(current);
  };
}, [loadingMore, hasMore, userPosts]);


useEffect(() => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.id);
    }
  } catch (err) {
    console.error("Token decode error:", err);
  }
}, []);

// Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setMenuOpenFor(null);
    }
  };

  // Add event listener when dropdown is open
  if (menuOpenFor) {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
  }

  // Cleanup
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('touchstart', handleClickOutside);
  };
}, [menuOpenFor]);

const modalRef = useRef(null); 

useEffect(() => {
  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      closeModal();
    }
  };

  if (modalType) {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('touchstart', handleClickOutside);
  };
}, [modalType]);



useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false); 
    };
  }, []);

useEffect(() => {
  const handleRouteChange = () => {
    
    setMenuOpenFor(null);
    setModalType(null);
    setLikesListOpenFor(null);
  };

  router.events.on('routeChangeStart', handleRouteChange);

  return () => {
    router.events.off('routeChangeStart', handleRouteChange);
  };
}, []);

  // Get current logged-in user id from localStorage (if available)
  const currentUserId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // Helper to add auth headers
  const getAuthHeaders = () => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

 // Get current user data for optimistic updates
const getCurrentUserData = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentUserId = payload.id;
    
    // Get user from context or localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed._id === currentUserId || parsed.id === currentUserId) {
        return parsed;
      }
    }
    
    // Fallback to current profile user if it's the same
    if (user && (user._id === currentUserId || user.id === currentUserId)) {
      return user;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting current user data:", error);
    return null;
  }
};

// Toggle comment expansion
const toggleCommentExpansion = (postId, commentId) => {
  setExpandedComments(prev => ({
    ...prev,
    [`${postId}-${commentId}`]: !prev[`${postId}-${commentId}`]
  }));
};

  const imageUrl = (postImage) => {
  return postImage || null;
};

  // Close modal function
  const closeModal = () => setModalType(null);

  // Fetch profile user from backend
  useEffect(() => {
    if (!router.isReady) return;
    if (!username) return;
    
    const fetchUser = async () => {
      setLoadingUser(true);
      const cancelToken = axios.CancelToken.source();
      
      try {
        const res = await axios.get(`${API_BASE}/users/${username}`, {
          headers: getAuthHeaders(),
          cancelToken: cancelToken.token,
        });
        setUser(res.data);
	      
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.log("Error fetching user:", err?.response?.data || err.message);
        setNotFound(true);
      } finally {
        setLoadingUser(false);
      }
    };
    
    fetchUser();
  }, [router.isReady, username]);

const fetchUserPosts = async () => {
  setLoading(true);

  try {
    const res = await axios.get(
      `${API_BASE}/posts/user/${username}?limit=7`,
      {
        headers: getAuthHeaders(),
      }
    );

    const posts = res.data || [];

    setUserPosts(posts);

    setHasMore(posts.length === 7);


    // Initialize liked status
    const token = localStorage.getItem("token");

    if (token) {
      try {

        const payload = JSON.parse(
          atob(token.split(".")[1])
        );

        const currentUserId = payload.id;

        const likedObj = {};

        posts.forEach((post) => {

          likedObj[post._id] =
            post.likes?.some((like) => {

              // likes: ["userid"]
              if (typeof like === "string") {
                return like === currentUserId;
              }

              // likes: [{_id:"userid"}]
              if (like?._id) {
                return like._id === currentUserId;
              }

              // likes: [{user:{_id:"userid"}}]
              if (like?.user?._id) {
                return like.user._id === currentUserId;
              }

              return false;

            }) || false;

        });


        setLikedPosts(likedObj);


      } catch (decodeErr) {
        console.error(
          "Token decode failed",
          decodeErr
        );
      }
    }


  } catch (err) {

    console.error(
      "Failed loading user posts",
      err
    );

  } finally {

    setLoading(false);

  }
};

 useEffect(() => {
  if (!username) return;

  setUserPosts([]);
  setHasMore(true);

  fetchUserPosts();

}, [username]);


const fetchMoreUserPosts = async () => {
  if (loadingMore || !hasMore) return;

  setLoadingMore(true);

  try {
    const lastPostId =
      userPosts[userPosts.length - 1]?._id;

    const res = await axios.get(
      `${API_BASE}/posts/user/${username}?limit=7&lastPostId=${lastPostId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    const newPosts = res.data;

    if (!newPosts || newPosts.length === 0) {
      setHasMore(false);
    } else {
      setUserPosts((prev) => [
        ...prev,
        ...newPosts,
      ]);
    }

  } catch (err) {
    console.error("Error loading more posts:", err);
  } finally {
    setLoadingMore(false);
  }
};

// When user is fetched, populate form 
useEffect(() => {
  if (user) {
    setEditData({
      fullName: user.fullName || "",
      bio: user.bio || "",
      gender: user.gender || "",
      dob: user.dob ? new Date(user.dob).toISOString().substring(0, 10) : "",
      location: user.location || "",
      website: user.website || "",
      phone: user.phone || "",
      profilePicture:user.profilePicture || "",
    });
  }
}, [user]);

useEffect(() => {
  if (!currentUserId) return;                                                                                                                                                                                                                 const start = Date.now();                                                                                                                                                                                                                   return () => {
    const duration = Math.floor((Date.now() - start) / 1000);
                                                                                                                          axios.post(`${API_BASE}/analytics/visit`, {
      userId: currentUserId,                                                                                                page: window.location.pathname,
      duration,
    }).catch(err => console.error("Analytics error:", err));
  };
}, [currentUserId]);



const getCurrentUserId = () => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};
  // Like/unlike a post
const handleLike = async (post) => {
  if (!post || !post._id) return;
  
  // Get current user ID
  const token = localStorage.getItem("token");
  let currentUserId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload.id;
    } catch (error) {
      console.error("Error getting user ID:", error);
    }
  }
  
  if (!currentUserId) {
    router.push('/login');
    return;
  }
  
  // Store current state for optimistic update
  const wasLiked = likedPosts[post._id];
  
  // Optimistic update: Immediately change UI
  setLikedPosts(prev => ({
    ...prev,
    [post._id]: !wasLiked
  }));
  
  // Optimistically update likes count in userPosts
  setUserPosts(prev => prev.map(p => 
    p._id === post._id 
      ? { 
          ...p, 
          likes: wasLiked 
            ? p.likes?.filter(like => {
                // Handle different like structures
                if (typeof like === 'string') {
                  return like !== currentUserId;
                } else if (like._id) {
                  return like._id !== currentUserId;
                } else if (like.user?._id) {
                  return like.user._id !== currentUserId;
                }
                return true;
              })
            : [...(p.likes || []), currentUserId]
        } 
      : p
  ));
  
  // Also update global posts context if available
  if (postsContext && typeof postsContext.setPosts === "function") {
    postsContext.setPosts(prev => prev.map(p => 
      p._id === post._id 
        ? { 
            ...p, 
            likes: wasLiked 
              ? p.likes?.filter(like => {
                  if (typeof like === 'string') {
                    return like !== currentUserId;
                  } else if (like._id) {
                    return like._id !== currentUserId;
                  } else if (like.user?._id) {
                    return like.user._id !== currentUserId;
                  }
                  return true;
                })
              : [...(p.likes || []), currentUserId]
          } 
        : p
    ));
  }
  
  setActionLoading((s) => ({ ...s, [post._id]: true }));
  
  try {
    const res = await fetch(`${API_BASE}/posts/${post._id}/like`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    
    const updated = await res.json();

    // Update with server response
    setUserPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    
    if (postsContext && typeof postsContext.setPosts === "function") {
      postsContext.setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    }
    
    // Update likedPosts with accurate state from server
    const userLiked = updated.likes?.some(like => {
      if (typeof like === 'string') {
        return like === currentUserId;
      } else if (like._id) {
        return like._id === currentUserId;
      } else if (like.user?._id) {
        return like.user._id === currentUserId;
      }
      return false;
    });
    
    setLikedPosts(prev => ({
      ...prev,
      [post._id]: userLiked
    }));
    
  } catch (err) {
    console.error("Like error:", err);
    
    // Revert optimistic update on error
    setLikedPosts(prev => ({
      ...prev,
      [post._id]: wasLiked
    }));
    
    // Revert posts states
    setUserPosts(prev => prev.map(p => 
      p._id === post._id 
        ? { 
            ...p, 
            likes: wasLiked 
              ? [...(p.likes || []), currentUserId]
              : p.likes?.filter(like => {
                  if (typeof like === 'string') {
                    return like !== currentUserId;
                  } else if (like._id) {
                    return like._id !== currentUserId;
                  } else if (like.user?._id) {
                    return like.user._id !== currentUserId;
                  }
                  return true;
                })
          } 
        : p
    ));
    
    if (postsContext && typeof postsContext.setPosts === "function") {
      postsContext.setPosts(prev => prev.map(p => 
        p._id === post._id 
          ? { 
              ...p, 
              likes: wasLiked 
                ? [...(p.likes || []), currentUserId]
                : p.likes?.filter(like => {
                    if (typeof like === 'string') {
                      return like !== currentUserId;
                    } else if (like._id) {
                      return like._id !== currentUserId;
                    } else if (like.user?._id) {
                      return like.user._id !== currentUserId;
                    }
                    return true;
                  })
            } 
          : p
      ));
    }
    
  } finally {
    setActionLoading((s) => ({ ...s, [post._id]: false }));
  }
};

  const toggleLikesList = (postId) => {
    setLikesListOpenFor((prev) => (prev === postId ? null : postId));
  };

  const handleComment = async (postId) => {
  const text = commentInputs[postId];
  if (!text?.trim() || commentLoading[postId]) return;

  setCommentLoading(prev => ({ ...prev, [postId]: true }))

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`Failed to add comment: ${data.message || "Unknown error"}`);
      return;
    }

    // ✅ Update both local and global post states
    setUserPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, comments: data.comments || [] } : p))
    );

    if (postsContext && typeof postsContext.setPosts === "function") {
      postsContext.setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: data.comments || [] } : p))
      );
    }

    setCommentInputs({ ...commentInputs, [postId]: "" });
    
  } catch (err) {
    alert("Error adding comment. Please try again.");
  } finally {
    setCommentLoading(prev => ({ ...prev, [postId]: false }));
  }
};

// ✅ Like/Unlike a comment - UPDATED to refresh activeCommentsPost
const handleLikeComment = async (postId, commentId) => {
  const userId = getCurrentUserId();
  if (!userId) {
    alert('Please login to like comments');
    return;
  }

  try {
    // Optimistic update for userPosts
    setUserPosts(prev => prev.map(post => {
      if (post._id === postId) {
        const updatedComments = post.comments?.map(comment => {
          if (comment._id === commentId) {
            const isLiked = comment.likes?.some(like => 
              String(like._id || like) === String(userId)
            );
            
            const updatedLikes = isLiked 
              ? comment.likes.filter(like => 
                  String(like._id || like) !== String(userId)
                )
              : [...(comment.likes || []), userId];
            
            return {
              ...comment,
              likes: updatedLikes,
              likeCount: updatedLikes.length
            };
          }
          return comment;
        });
        
        return { ...post, comments: updatedComments };
      }
      return post;
    }));

    // ALSO update activeCommentsPost if it's the current post
    if (activeCommentsPost && activeCommentsPost._id === postId) {
      setActiveCommentsPost(prev => {
        if (!prev) return prev;
        
        const updatedComments = prev.comments?.map(comment => {
          if (comment._id === commentId) {
            const isLiked = comment.likes?.some(like => 
              String(like._id || like) === String(userId)
            );
            
            const updatedLikes = isLiked 
              ? comment.likes.filter(like => 
                  String(like._id || like) !== String(userId)
                )
              : [...(comment.likes || []), userId];
            
            return {
              ...comment,
              likes: updatedLikes,
              likeCount: updatedLikes.length
            };
          }
          return comment;
        });
        
        return { ...prev, comments: updatedComments };
      });
    }

    // API call
    const response = await axios.put(
      `${API_BASE}/posts/${postId}/comments/${commentId}/like`,
      {},
      { headers: getAuthHeaders() }
    );

    const updatedComment = response.data;

    // Update with server response for userPosts
    setUserPosts(prev => prev.map(post => {
      if (post._id === postId) {
        const updatedComments = post.comments?.map(comment => 
          comment._id === commentId ? updatedComment : comment
        );
        return { ...post, comments: updatedComments };
      }
      return post;
    }));

    // Update activeCommentsPost with server response
    if (activeCommentsPost && activeCommentsPost._id === postId) {
      setActiveCommentsPost(prev => {
        if (!prev) return prev;
        
        const updatedComments = prev.comments?.map(comment => 
          comment._id === commentId ? updatedComment : comment
        );
        return { ...prev, comments: updatedComments };
      });
    }

  } catch (error) {
    console.error('Error liking comment:', error);
    alert('Failed to like comment');
    
    // Revert optimistic update
    const originalPost = userPosts.find(p => p._id === postId);
    if (originalPost) {
      setUserPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, comments: originalPost.comments } : post
      ));
      
      if (activeCommentsPost && activeCommentsPost._id === postId) {
        setActiveCommentsPost(originalPost);
      }
    }
  }
};

// ✅ Add a recomment - UPDATED to refresh activeCommentsPost
const handleAddRecomment = async (postId, commentId) => {
  const text = recommentInputs[`${postId}-${commentId}`]?.trim();
  const userId = getCurrentUserId();
  
  if (!text || !userId) {
    alert(!text ? 'Please enter recomment text' : 'Please login to recomment');
    return;
  }

  setRecommentLoading(prev => ({ ...prev, [`${postId}-${commentId}`]: true }));

  try {
    // Optimistic update for userPosts
    const tempRecommentId = `temp-${Date.now()}`;
    const currentUser = getCurrentUserData();
    
    // Update userPosts
    setUserPosts(prev => prev.map(post => {
      if (post._id === postId) {
        const updatedComments = post.comments?.map(comment => {
          if (comment._id === commentId) {
            return {
              ...comment,
              recomments: [
                ...(comment.recomments || []),
                {
                  _id: tempRecommentId,
                  text,
                  user: currentUser || {
                    _id: userId,
                    username: 'You',
                    profilePicture: ''
                  },
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
        
        return { ...post, comments: updatedComments };
      }
      return post;
    }));

    // ALSO update activeCommentsPost if it's the current post
    if (activeCommentsPost && activeCommentsPost._id === postId) {
      setActiveCommentsPost(prev => {
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
                  user: currentUser || {
                    _id: userId,
                    username: 'You',
                    profilePicture: ''
                  },
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
    }

    // API call
    const response = await axios.post(
      `${API_BASE}/posts/${postId}/comments/${commentId}/recomment`,
      { text },
      { headers: getAuthHeaders() }
    );

    const newRecomment = response.data;

    // Update with real data
    setUserPosts(prev => prev.map(post => {
      if (post._id === postId) {
        const updatedComments = post.comments?.map(comment => {
          if (comment._id === commentId) {
            const filteredRecomments = comment.recomments?.filter(recomment => 
              recomment._id !== tempRecommentId
            ) || [];
            
            return {
              ...comment,
              recomments: [...filteredRecomments, newRecomment]
            };
          }
          return comment;
        });
        
        return { ...post, comments: updatedComments };
      }
      return post;
    }));

    // Update activeCommentsPost with real data
    if (activeCommentsPost && activeCommentsPost._id === postId) {
      setActiveCommentsPost(prev => {
        if (!prev) return prev;
        
        const updatedComments = prev.comments?.map(comment => {
          if (comment._id === commentId) {
            const filteredRecomments = comment.recomments?.filter(recomment => 
              recomment._id !== tempRecommentId
            ) || [];
            
            return {
              ...comment,
              recomments: [...filteredRecomments, newRecomment]
            };
          }
          return comment;
        });
        
        return { ...prev, comments: updatedComments };
      });
    }

    // Clear input
    setRecommentInputs(prev => {
      const newState = { ...prev };
      delete newState[`${postId}-${commentId}`];
      return newState;
    });

    // Auto-expand
    if (!expandedComments[`${postId}-${commentId}`]) {
      setExpandedComments(prev => ({
        ...prev,
        [`${postId}-${commentId}`]: true
      }));
    }

  } catch (error) {
    console.error('Error adding recomment:', error);
    alert(`Failed to add recomment: ${error.message}`);
    
    // Revert optimistic update for userPosts
    setUserPosts(prev => prev.map(post => {
      if (post._id === postId) {
        const updatedComments = post.comments?.map(comment => {
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
        
        return { ...post, comments: updatedComments };
      }
      return post;
    }));

    // Revert optimistic update for activeCommentsPost
    if (activeCommentsPost && activeCommentsPost._id === postId) {
      setActiveCommentsPost(prev => {
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
    }
  } finally {
    setRecommentLoading(prev => ({ ...prev, [`${postId}-${commentId}`]: false }));
  }
};

// ✅ Like/Unlike a recomment - UPDATED to refresh activeCommentsPost
const handleLikeRecomment = async (postId, commentId, recommentId) => {
  const userId = getCurrentUserId();
  if (!userId) {
    alert('Please login to like recomments');
    return;
  }

  try {
    // Optimistic update for userPosts
    setUserPosts(prev => prev.map(post => {
      if (post._id === postId) {
        const updatedComments = post.comments?.map(comment => {
          if (comment._id === commentId) {
            const updatedRecomments = comment.recomments?.map(recomment => {
              if (recomment._id === recommentId) {
                const isLiked = recomment.likes?.some(like => 
                  String(like._id || like) === String(userId)
                );
                
                const updatedLikes = isLiked 
                  ? recomment.likes.filter(like => 
                      String(like._id || like) !== String(userId)
                    )
                  : [...(recomment.likes || []), userId];
                
                return {
                  ...recomment,
                  likes: updatedLikes,
                  likeCount: updatedLikes.length
                };
              }
              return recomment;
            });
            
            return {
              ...comment,
              recomments: updatedRecomments
            };
          }
          return comment;
        });
        
        return { ...post, comments: updatedComments };
      }
      return post;
    }));

    // ALSO update activeCommentsPost if it's the current post
    if (activeCommentsPost && activeCommentsPost._id === postId) {
      setActiveCommentsPost(prev => {
        if (!prev) return prev;
        
        const updatedComments = prev.comments?.map(comment => {
          if (comment._id === commentId) {
            const updatedRecomments = comment.recomments?.map(recomment => {
              if (recomment._id === recommentId) {
                const isLiked = recomment.likes?.some(like => 
                  String(like._id || like) === String(userId)
                );
                
                const updatedLikes = isLiked 
                  ? recomment.likes.filter(like => 
                      String(like._id || like) !== String(userId)
                    )
                  : [...(recomment.likes || []), userId];
                
                return {
                  ...recomment,
                  likes: updatedLikes,
                  likeCount: updatedLikes.length
                };
              }
              return recomment;
            });
            
            return {
              ...comment,
              recomments: updatedRecomments
            };
          }
          return comment;
        });
        
        return { ...prev, comments: updatedComments };
      });
    }

    // API call
    const response = await axios.put(
      `${API_BASE}/posts/${postId}/comments/${commentId}/recomments/${recommentId}/like`,
      {},
      { headers: getAuthHeaders() }
    );

    const updatedRecomment = response.data;

    // Update with server response
    setUserPosts(prev => prev.map(post => {
      if (post._id === postId) {
        const updatedComments = post.comments?.map(comment => {
          if (comment._id === commentId) {
            const updatedRecomments = comment.recomments?.map(recomment => 
              recomment._id === recommentId ? updatedRecomment : recomment
            );
            return { ...comment, recomments: updatedRecomments };
          }
          return comment;
        });
        return { ...post, comments: updatedComments };
      }
      return post;
    }));

    // Update activeCommentsPost with server response
    if (activeCommentsPost && activeCommentsPost._id === postId) {
      setActiveCommentsPost(prev => {
        if (!prev) return prev;
        
        const updatedComments = prev.comments?.map(comment => {
          if (comment._id === commentId) {
            const updatedRecomments = comment.recomments?.map(recomment => 
              recomment._id === recommentId ? updatedRecomment : recomment
            );
            return { ...comment, recomments: updatedRecomments };
          }
          return comment;
        });
        return { ...prev, comments: updatedComments };
      });
    }

  } catch (error) {
    console.error('Error liking recomment:', error);
    alert('Failed to like recomment');
    
    // Revert optimistic update
    const originalPost = userPosts.find(p => p._id === postId);
    if (originalPost) {
      setUserPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, comments: originalPost.comments } : post
      ));
      
      if (activeCommentsPost && activeCommentsPost._id === postId) {
        setActiveCommentsPost(originalPost);
      }
    }
  }
};

// Helper to refresh a single post
const refreshPost = async (postId) => {
  try {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch post: ${res.status}`);
    }

    const updatedPost = await res.json();

    // Update userPosts
    setUserPosts(prev => prev.map(post =>
      post._id === postId ? updatedPost : post
    ));

    // Update global posts if in context
    if (postsContext && typeof postsContext.setPosts === "function") {
      postsContext.setPosts(prev => prev.map(post =>
        post._id === postId ? updatedPost : post
      ));
    }

    // Update activeCommentsPost if it's open
    if (activeCommentsPost && activeCommentsPost._id === postId) {
      setActiveCommentsPost(updatedPost);
    }

    return updatedPost;
  } catch (error) {
    console.error('Error refreshing post:', error);
  }
};

  // Delete post (only for owner)
  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setUserPosts((prev) => prev.filter((p) => p._id !== postId));
        if (postsContext && typeof postsContext.setPosts === "function") {
          postsContext.setPosts((prev) => prev.filter((p) => p._id !== postId));
        }
      } else {
        console.error("Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // --- Edit Post ---
const handleEdit = (post) => {                                                                         setEditPost(post);
  setEditText(post.content || ""); // safer if content is missing                                      setEditImage(null);                                                                                  setPreviewImage( null);
};

// --- Handle Image File Change ---
const handleFileChange = (e) => {                                                                      const file = e.target.files?.[0];
  if (file) {
    setEditImage(file);                                                                                  setPreviewImage(URL.createObjectURL(file));
  }
};

                                                                                                     // --- Save the Edited Post ---
const handleSaveEdit = async () => {                                                                   if (!editPost) return;
                                                                                                       try {
    const formData = new FormData();
    formData.append("content", editText || "");



    if (editImage) {
      formData.append("image", editImage);

    } else if (!editPost.image) {
      formData.append("removeImage", "true");

    }

    const res = await axios.put(
      `${API_BASE}/posts/${editPost._id}`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (res.data && res.data.post) {
      alert(`✅ Post updated successfully!`);
      setPosts((prev) =>
        prev.map((p) => (p._id === editPost._id ? res.data.post : p))
      );
      setEditPost(null);
      setEditText("");
      setPreviewImage(null);
      setEditImage(null);
    }
  } catch (err) {
    alert("❌ Failed to update post. Please try again.");
  }
};

const handleProfileSave = async () => {
  try {
    const formData = new FormData();

    // Append all non-empty text fields
    Object.entries(editData).forEach(([key, value]) => {
      if (value && typeof value === "string") {
        formData.append(key, value);
      }
    });

    // Append images (if selected)
    if (editData.profilePicture instanceof File) {
      formData.append("profilePicture", editData.profilePicture);
    }
    if (editData.coverPhoto instanceof File) {
      formData.append("coverPhoto", editData.coverPhoto);
    }

    // Send multipart/form-data request
    const res = await axios.put(`${API_BASE}/users/update-profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      },
    });

    setUser(res.data.user);
    setIsEditingProfile(false);

    alert("Profile updated successfully!");
  } catch (err) {
    console.error("Profile update failed:", err);
    alert("Failed to update profile. Please try again.");
  }
};

// Cover photo upload handler
const handleCoverPhotoChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("coverPhoto", file);

  try {
    const res = await axios.put(`${API_BASE}/users/update-profile`, formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });

    // ✅ Refresh user state from backend response
    setUser(res.data.user);

    alert("Cover photo updated successfully!");
  } catch (err) {
    console.error("Cover photo update error:", err);
  }
};

// Profile picture upload handler
const handleProfilePictureChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("profilePicture", file);

    const res = await axios.put(`${API_BASE}/users/update-profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...getAuthHeaders(),
      },
    });

    // Update local user state
    setUser(res.data.user);
    alert("Profile picture updated successfully!");
  } catch (err) {
    console.error("Profile picture upload error:", err);
    alert("Failed to update profile picture. Try again.");
  }
};


const getAvatar = (src, username, size = 8) => {
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const sizeClasses = {
  6: 'w-6 h-6 text-xs',
  8: 'w-8 h-8 text-sm',                                                                    10: 'w-10 h-10 text-sm',
  12: 'w-12 h-12 text-base',
  14: 'w-14 h-14 text-base',
  16: 'w-16 h-16 text-lg'
};

  if (src) {
    return (
      <img
        src={src}
        alt={username || "User"}
        className={`rounded-full ${sizeClasses[size]} object-cover`}
      />
    );
  }

  return (
    <div className={`rounded-full bg-black text-white flex items-center justify-center font-semibold ${sizeClasses[size]}`}>
      {getInitials(username)}
    </div>
  );
};

  // Guard SSR
  if (!router.isReady) return <p>Loading...</p>;
  if (loadingUser) return <p className="p-5 text-center">Loading user...</p>;
  if (notFound) return <p className="p-5 text-center">User not found</p>;
  if (!user) return <p className="p-5 text-center">User not found</p>;


const sendPrivateFeedback = async (postId) => {
  const text = feedbackInputs[postId];

  if (!text?.trim()) {
    return;
  }

  try {
    setFeedbackLoading((prev) => ({
      ...prev,
      [postId]: true,
    }));

    const res = await axios.post(
      `${API_BASE}/posts/${postId}/feedback`,
      { text },
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    const newFeedback = res.data.feedback;

    // Update profile posts instantly
    setUserPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              privateFeedback: [
                ...(post.privateFeedback || []),
                newFeedback,
              ],
            }
          : post
      )
    );

    // Update feedback modal instantly if open
    if (activeFeedbackPost?._id === postId) {
      setActiveFeedbackPost((prev) => ({
        ...prev,
        privateFeedback: [
          ...(prev.privateFeedback || []),
          newFeedback,
        ],
      }));
    }

    // Clear input
    setFeedbackInputs((prev) => ({
      ...prev,
      [postId]: "",
    }));

  } catch (err) {
    console.error(
      "Private feedback error:",
      err.response?.data || err.message
    );

    alert(
      err.response?.data?.message ||
      "Failed to send feedback"
    );

  } finally {
    setFeedbackLoading((prev) => ({
      ...prev,
      [postId]: false,
    }));
  }
};

  return (
        <div className="min-h-screen bg-gray-50 dark:bg-infinityBgDark pb-6">
  {/* Top Bar */}
<div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 shadow-md sticky top-0 z-20">
  <button
  onClick={() => router.back()}
  className="flex items-center text-purple-600 font-semibold hover:underline"
>
  <FiArrowLeft className="mr-2 w-5 h-5" />
  Back
</button>
  <h1 className="font-bold text-lg">Profile</h1>
  <span />
</div>

{/* Profile Header */}
<div className="relative bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-visible mt-1 animate-fadeIn">

  {/* Main Container with Cover Photo Background */}
  <div className="relative rounded-t-lg overflow-hidden">
    
    {/* Clickable Cover Photo Background Container */}
    <div 
      className="absolute inset-0 z-0"
      onClick={() => {
        if (user.coverPhoto) {
          window.open(imageUrl(user.coverPhoto), "_blank");
        }
      }}
    >
      {user.coverPhoto ? (
        <img
          src={imageUrl(user.coverPhoto)}
          alt={`${user.username} cover`}
          className={`w-full h-full object-cover object-center ${user.coverPhoto ? 'cursor-pointer' : ''}`}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800"></div>
      )}
    </div>

    {/* Cover Photo Top Section - This sits above but shouldn't block clicks to background */}
    <div className="relative h-44 md:h-52 z-10 pointer-events-none">
      {!user.coverPhoto && (
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <span className="text-white text-xl font-bold opacity-80">No cover photo yet</span>
        </div>
      )}

      {/* Edit Cover Photo Icon - Needs pointer-events */}
      {currentUserId === user._id && (
        <label 
          className="absolute top-3 right-3 bg-black bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full cursor-pointer transition z-20 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <FiCamera className="text-white w-5 h-5" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleCoverPhotoChange(e);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>

    {/* Profile Info Section - Darker semi-transparent with blur for better contrast */}
    <div className="px-6 pb-4 pt-14 relative bg-black/30 backdrop-blur-md z-10 rounded-b-lg">

      {/* Profile Row */}
      <div className="flex items-center space-x-6 md:space-x-8">

        {/* Profile Picture Container */}
        <div className="relative -mt-16 z-20">
          {/* Profile Picture Clickable Area - Only if image exists */}
          {user.profilePicture ? (
            <div
              className="cursor-pointer transform transition hover:scale-105"
              onClick={() => window.open(imageUrl(user.profilePicture), "_blank")}
            >
              {getAvatar(imageUrl(user.profilePicture), user.username, 16)}
            </div>
          ) : (
            <div>
              {getAvatar(imageUrl(user.profilePicture), user.username, 16)}
            </div>
          )}

          {/* Edit Icon - Moved outside with click handler */}
          {currentUserId === user._id && (
            <label 
              className="absolute -bottom-1 -right-1 bg-black bg-opacity-70 hover:bg-opacity-90 p-1.5 rounded-full cursor-pointer transition border-2 border-white shadow-lg z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <FiCamera className="text-white w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProfilePictureChange(e);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>

        {/* Username + Stats - Clean without backgrounds */}
        <div className="mt-4 md:mt-6">
          <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
            {user.username}
          </h1>

          <div className="flex space-x-6 mt-1 md:mt-2">
            <button 
              onClick={() => {
                if (user.followers?.length > 0) {
                  setModalType("followers");
                }
              }}
              className={`text-white font-medium drop-shadow-md transition ${
                user.followers?.length > 0 ? "hover:underline" : "opacity-70 cursor-default"
              }`}
            >
              {user.followers?.length || 0} followers
            </button>
            <button 
              onClick={() => {
                if (user.following?.length > 0) {
                  setModalType("following");
                }
              }}
              className={`text-white font-medium drop-shadow-md transition ${
                user.following?.length > 0 ? "hover:underline" : "opacity-70 cursor-default"
              }`}
            >
              {user.following?.length || 0} following
            </button>
          </div>
        </div>
      </div>

      {/* Follow/Unfollow Button */}
      {currentUserId !== user._id && (
        <div className="mt-6">
          <button
            onClick={async () => {
              try {
                const isFollowing = user.followers?.some(
                  (f) => f._id === currentUserId || f === currentUserId
                );

                // Optimistic UI
                setUser((prev) => {
                  const newFollowers = isFollowing
                    ? prev.followers.filter((f) => f._id !== currentUserId && f !== currentUserId)
                    : [...prev.followers, { _id: currentUserId }];
                  return { ...prev, followers: newFollowers };
                });

                // Backend Call
                const url = `${API_BASE}/users/${user._id}/${isFollowing ? "unfollow" : "follow"}`;
                await axios.post(url, {}, { headers: getAuthHeaders() });

              } catch (err) {
                console.error("Follow/unfollow error:", err);
              }
            }}
            className={`w-full text-white font-semibold py-2 rounded-lg shadow-lg transition ${
              user.followers?.some((f) => f._id === currentUserId || f === currentUserId)
                ? "bg-gray-700/90 hover:bg-gray-800 backdrop-blur-sm"
                : "bg-purple-700/90 hover:bg-purple-800 backdrop-blur-sm"
            }`}
          >
            {user.followers?.some((f) => f._id === currentUserId || f === currentUserId)
              ? "Unfollow"
              : "Follow"}
          </button>
        </div>
      )}
    </div>
  </div>
</div>	

{/* About Section */}
<div className="bg-white dark:bg-gray-800 p-6 shadow-md rounded-2xl mt-1 border border-gray-100 dark:border-gray-700">

	<div className="flex justify-between items-center mb-4">
    <div className="flex items-center gap-2">
      <UserCircle className="text-purple-600 dark:text-infinityPurpleDark" size={22} />
      <h2 className="font-semibold text-lg text-gray-800 dark:text-infinityTextDark">About</h2>
    </div>

    {/* Edit Profile button (only visible to profile owner) */}
    {currentUserId === user._id && (
      <button
        onClick={() => setIsEditingProfile(true)}
        className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
      >
        <Edit3 size={16} />
        Edit
      </button>
    )}
  </div>

  <div className="space-y-3 text-gray-700 dark:text-infinityTextDark">
    {user.fullName && (
      <p className="flex items-center gap-2">
        <User className="text-purple-500" size={18} />
        <span><strong>Full Name:</strong> {user.fullName}</span>
      </p>
    )}

    {user.bio && (
      <p className="flex items-center gap-2">
        <Info className="text-purple-500" size={18} />
        <span><strong>Bio:</strong> {user.bio}</span>
      </p>
    )}

    {user.gender && (
      <p className="flex items-center gap-2">
        <User className="text-purple-500" size={18} />
        <span><strong>Gender:</strong> {user.gender}</span>
      </p>
    )}

    {user.dob && (
      <p className="flex items-center gap-2">
        <Calendar className="text-purple-500" size={18} />
        <span>
          <strong>Date of Birth:</strong>{" "}
          {new Date(user.dob).toLocaleDateString()}
        </span>
      </p>
    )}

    {user.location && (
      <p className="flex items-center gap-2">
        <MapPin className="text-purple-500" size={18} />
        <span><strong>Location:</strong> {user.location}</span>
      </p>
    )}

    {user.website && (
      <p className="flex items-center gap-2">
        <Globe className="text-purple-500" size={18} />
        <span>
          <strong>Website:</strong>{" "}
          <a
            href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 underline hover:text-purple-800"
          >
            {user.website}
          </a>
        </span>
      </p>
    )}

    {user.phone && (
      <p className="flex items-center gap-2">
        <Phone className="text-purple-500" size={18} />
        <span><strong>Phone:</strong> {user.phone}</span>
      </p>
    )}
  </div>

  {/* If no info filled yet */}
  {!user.fullName &&
   !user.bio &&
   !user.gender &&
   !user.dob &&
   !user.location &&
   !user.website &&
   !user.phone && (
    <div className="flex items-center text-gray-500 text-sm mt-3">
      <Info className="mr-2" size={16} />
      No information added yet.
    </div>
  )}
</div>
	  {/* Edit Profile Modal */}
{isEditingProfile && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeIn">
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 shadow-xl relative border border-gray-100 dark:border-gray-700 animate-scaleIn">

      {/* Close Button */}
      <button
        onClick={() => setIsEditingProfile(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition"
      >
        <FiX className="w-5 h-5" />
      </button>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
        <FiUser className="text-purple-600 dark:text-purple-400" />
        Edit Profile
      </h2>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
            <FiUser className="text-purple-500 dark:text-purple-400" /> Full Name
          </label>
          <input
            type="text"
            placeholder="Full Name"
            value={editData.fullName}
            onChange={(e) =>
              setEditData({ ...editData, fullName: e.target.value })
            }
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
            <FiInfo className="text-purple-500 dark:text-purple-400" /> Bio
          </label>
          <textarea
            placeholder="Write something about yourself..."
            value={editData.bio}
            onChange={(e) =>
              setEditData({ ...editData, bio: e.target.value })
            }
            rows="3"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
            <FaVenusMars className="text-purple-500 dark:text-purple-400" /> Gender
          </label>
          <select
            value={editData.gender}
            onChange={(e) =>
              setEditData({ ...editData, gender: e.target.value })
            }
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:outline-none"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Date of Birth */}
<div>
  <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
    <FiCalendar className="text-purple-500 dark:text-purple-400" /> Date of Birth
  </label>
  <input
    type="text"
    placeholder="DD/MM/YYYY or YYYY-MM-DD"
    value={editData.dob}
    onChange={(e) => {
      const value = e.target.value;
      setEditData({ ...editData, dob: value });
    }}
    onBlur={() => {
      // Optional: Auto-format or validate on blur
      const value = editData.dob;
      if (value) {
        // Try to parse common formats
        let parsedDate = null;
        
        // Check for DD/MM/YYYY format
        if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          const [day, month, year] = value.split('/');
          parsedDate = new Date(`${year}-${month}-${day}`);
        }
        // Check for YYYY-MM-DD format
        else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          parsedDate = new Date(value);
        }
        
        if (parsedDate && !isNaN(parsedDate)) {
          setEditData({ ...editData, dob: parsedDate.toISOString().split('T')[0] });
        }
      }
    }}
    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
  />
  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
    Format: DD/MM/YYYY or YYYY-MM-DD
  </p>
</div>

        {/* Location */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
            <FiMapPin className="text-purple-500 dark:text-purple-400" /> Location
          </label>
          <input
            type="text"
            placeholder="Location"
            value={editData.location}
            onChange={(e) =>
              setEditData({ ...editData, location: e.target.value })
            }
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Website */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
            <FiGlobe className="text-purple-500 dark:text-purple-400" /> Website
          </label>
          <input
            type="text"
            placeholder="https://example.com"
            value={editData.website}
            onChange={(e) =>
              setEditData({ ...editData, website: e.target.value })
            }
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
            <FiPhone className="text-purple-500 dark:text-purple-400" /> Phone
          </label>
          <input
            type="text"
            placeholder="0712 000 000"
            value={editData.phone}
            onChange={(e) =>
              setEditData({ ...editData, phone: e.target.value })
            }
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={async () => {
          try {
            console.log("Submitting:", editData);
            const res = await axios.put(
              `${API_BASE}/users/update-profile`,
              editData,
              {
                headers: {
                  "Content-Type": "application/json",
                  ...getAuthHeaders(),
                },
              }
            );
            setUser(res.data.user);
            setIsEditingProfile(false);
            console.log("Profile updated:", res.data.user);
          } catch (err) {
            console.error(
              "Profile update error:",
              err.response?.data || err.message
            );
          }
        }}
        className="mt-6 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
      >
        Save Changes
      </button>
    </div>
  </div>
)}

      {/* User's Posts */}
      <div className="p-4 space-y-1">
        {postsLoading ? (
          <p>Loading posts...</p>
        ) : userPosts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-infinityTextSecondaryDark">No posts yet.</p>
        ) : (
          userPosts.map((post, index) => {
	    const isLast = index === userPosts.length - 1;
            const postId = post._id;
            const likedByUser =
              Array.isArray(post.likes) &&
              post.likes.some((u) => (u && u._id ? u._id === currentUserId : u === currentUserId));
            return (
              <div
  key={postId}
  ref={isLast ? observerRef : null}
  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
>              
		    {/* Header */}
<div className="flex justify-between items-center mb-3">

  <a
    href={`/profile/${post.author?.username}`}
    className="
      flex items-center space-x-3
      hover:opacity-80 transition
      min-w-0
    "
  >

    {getAvatar(
      imageUrl(post.author?.profilePicture),
      post.author?.username,
      10
    )}


    <div className="flex flex-col min-w-0">

      <span
        className="
          font-bold text-[17px]
          hover:underline
          truncate max-w-[160px]
          text-gray-900 dark:text-gray-100
        "
      >
        {post.author?.username ?? "unknown"}
      </span>


      {post.visibility === "private" ? (

        <span
          className="
            text-[11px]
            text-purple-700 dark:text-purple-300
            font-medium
            bg-purple-100 dark:bg-purple-900/30
            px-2 py-0.5 rounded-full w-fit
          "
        >
          Private
        </span>

      ) : post.visibility === "personal" ? (

        <span
          className="
            text-[11px]
            text-indigo-700 dark:text-indigo-300
            font-medium
            bg-indigo-100 dark:bg-indigo-900/30
            px-2 py-0.5 rounded-full w-fit
          "
        >
          Personal
        </span>

      ) : null}

    </div>

  </a>


  <span
    className="
      text-xs
      text-gray-500
      dark:text-infinityTextSecondaryDark
    "
  >
    {post.createdAt
      ? new Date(post.createdAt).toLocaleString()
      : ""}
  </span>

</div>

                {/* Content */}
{post.content && (
  <div className="mb-3">

    <p
      className={`text-[15px]
        leading-relaxed
        text-gray-800
        dark:text-gray-100
        whitespace-pre-line
        break-words
        transition-all duration-200
        ${
          expandedPosts[post._id]
            ? ""
            : post.images?.length > 0 || post.image
            ? "line-clamp-4"
            : "line-clamp-5"
        }`}
    >
      {post.content}
    </p>


    {post.content.trim().split(/\s+/).length > 45 && (

      <button
        onClick={() =>
          setExpandedPosts((prev) => ({
            ...prev,
            [post._id]: !prev[post._id],
          }))
        }
        className="
          mt-1
          flex items-center
          text-sm font-medium
          text-purple-600
          dark:text-purple-400
          hover:text-purple-700
          transition
        "
      >

        {expandedPosts[post._id] ? (
          <>
            Show less
            <span className="ml-1 rotate-180">⌄</span>
          </>
        ) : (
          <>
            Show more
            <span className="ml-1">⌄</span>
          </>
        )}

      </button>

    )}

  </div>
)}

                {/* Image */}
                {(post.images?.length > 0 || post.image) && (
  <div className="rounded-md overflow-hidden mb-2">

    <Swiper
      spaceBetween={10}
      slidesPerView={1}
      className="w-full"
    >
      {(post.images?.length ? post.images : [post.image]).map((img, index) => (
        <SwiperSlide key={index}>
          <img
            src={imageUrl(img)}
            alt={`Post ${index}`}
            className="w-full object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            onClick={() =>
              setFullImage(post.images?.length ? post.images : [post.image])
            }
          />
        </SwiperSlide>
      ))}
    </Swiper>

  </div>
)}

               {/* Actions */}
<div className="flex items-center justify-between mt-4 relative">

  <div className="flex items-center space-x-4">

    {/* LIKE BUTTON */}
    {post.allowLikes !== false && (
  <>
    <button
      onClick={() => handleLike(post)}
      disabled={actionLoading[post._id]}
      className="flex items-center justify-center space-x-2
                 min-w-[58px] px-3 py-2 rounded-xl
                 bg-gray-100/70 dark:bg-gray-800
                 hover:bg-gray-200 dark:hover:bg-gray-700
                 transition active:scale-90"
    >
      {likedPosts[post._id] ? (
        <FaHeart className="w-5 h-5 text-red-500" />
      ) : (
        <FiHeart className="w-5 h-5 text-gray-500 hover:text-red-500" />
      )}

      <span className="text-sm text-gray-700 dark:text-gray-300">
        {post.likes?.length || 0}
      </span>
    </button>

    <button
      onClick={() => toggleLikesList(post._id)}
      className="px-3 py-2 rounded-xl
                 bg-gray-100/70 dark:bg-gray-800
                 text-sm text-gray-600 dark:text-gray-300
                 hover:bg-gray-200 dark:hover:bg-gray-700
                 transition active:scale-95"
    >
      {post.likes?.length ? "View likers" : "Be first to like"}
    </button>
  </>
)}

    {/* COMMENTS / PRIVATE FEEDBACK */}

{post.visibility === "private" ? (

  post.author?._id === currentUserId && (

    <button
      onClick={() => setActiveFeedbackPost(post)}
      className="
        flex items-center space-x-2 px-3 py-2 rounded-xl
        bg-gray-100/70 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition active:scale-90
      "
    >

      <FiMessageCircle
        className="w-5 h-5 text-gray-500 dark:text-gray-300"
      />

      <span className="text-sm text-gray-700 dark:text-gray-300">
        {post.privateFeedback?.length || 0}
      </span>

    </button>

  )

) : (

  post.allowComments !== false && (

    <button
      onClick={() => setActiveCommentsPost(post)}
      className="
        flex items-center space-x-2 px-3 py-2 rounded-xl
        bg-gray-100/70 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition active:scale-90
      "
    >

      <FiMessageCircle
        className="w-5 h-5 text-gray-500 dark:text-gray-300"
      />

      <span className="text-sm text-gray-700 dark:text-gray-300">
        {post.comments?.length || 0}
      </span>

    </button>

  )

)}

  </div>

  {/* Three-dot menu */}
  {post.author?._id === currentUserId && (
    <div className="relative">

      <button
        onClick={() =>
          setMenuOpenFor(
            menuOpenFor === post._id ? null : post._id
          )
        }
        className="p-2 rounded-full
                   hover:bg-gray-200 dark:hover:bg-gray-700
                   transition"
      >
        <FiMoreHorizontal className="w-5 h-5" />
      </button>

      {menuOpenFor === post._id && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-28
                     bg-white dark:bg-gray-900
                     border border-gray-200 dark:border-gray-700
                     rounded-xl shadow-lg z-50"
        >
          <button
            onClick={() => handleEdit(post)}
            className="w-full text-left px-3 py-2
                       text-blue-500 text-sm
                       hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Edit
          </button>

          <button
            onClick={() => handleDelete(post._id)}
            className="w-full text-left px-3 py-2
                       text-red-500 text-sm
                       hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )}

</div> 

                  
     {/* Comments */}
<div className="mt-3 space-y-2">
  {post.allowComments !== false && (

    post.comments && post.comments.length > 0 ? (

      <>
        {/* Show latest comment */}
        {post.comments.slice(-1).map((c, i) => {

          const username = c.user?.username ?? "user";
          const avatarSrc = imageUrl(c.user?.profilePicture);
          const text = c.text ?? c;

          return (
            <div
              key={i}
              className="flex items-start space-x-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
            >
              {/* Avatar */}
              <a href={`/profile/${c.user?.username}`}>
                {getAvatar(avatarSrc, username, 8)}
              </a>

              {/* Username + Comment */}
              <div className="flex flex-col">
                <a
                  href={`/profile/${c.user?.username}`}
                  className="font-semibold text-sm hover:underline text-gray-800 dark:text-gray-300"
                >
                  {username}
                </a>

                <p className="text-gray-700 dark:text-gray-100 text-sm pl-2 mt-1 border-l-2 border-purple-200 dark:border-purple-700">
                  {text}
                </p>
              </div>
            </div>
          );
        })}

        {/* View all comments */}
        {post.comments.length > 1 && (
          <button
            onClick={() => setActiveCommentsPost(post)}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline focus:outline-none"
          >
            View all {post.comments.length} comments
          </button>
        )}
      </>
    ) : (
      <p className="text-sm text-gray-400 dark:text-gray-500">
        No comments yet
      </p>
    )

  )}
</div> 

  {/* Comment / Feedback Input */}
{post.visibility === "private" ? (

  <div className="flex items-center space-x-2 mt-2">

    <input
      type="text"
      value={feedbackInputs[post._id] || ""}
      onChange={(e) =>
        setFeedbackInputs({
          ...feedbackInputs,
          [post._id]: e.target.value
        })
      }
      placeholder="Send private feedback..."
      className="flex-1 border rounded-xl p-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-purple-500
                 bg-gray-50 dark:bg-gray-800
                 border-gray-200 dark:border-gray-700
                 text-gray-900 dark:text-gray-100"
    />

    <button
      onClick={() => sendPrivateFeedback(post._id)}
      disabled={feedbackLoading[post._id]}
      className={`px-3 py-2 rounded-xl transition active:scale-95 ${
        feedbackLoading[post._id]
          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
          : "bg-purple-600 text-white hover:bg-purple-700"
      }`}
    >
      {feedbackLoading[post._id] ? "Sending..." : "Send"}
    </button>

  </div>

) : (

  post.allowComments !== false && (

    <div className="flex items-center space-x-2 mt-2">

      <input
        type="text"
        value={commentInputs[post._id] || ""}
        onChange={(e) =>
          setCommentInputs({
            ...commentInputs,
            [post._id]: e.target.value
          })
        }
        placeholder="Add a comment..."
        className="flex-1 border rounded-xl p-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-purple-500
                   bg-gray-50 dark:bg-gray-800
                   border-gray-200 dark:border-gray-700
                   text-gray-900 dark:text-gray-100"
      />

      <button
        onClick={() => handleComment(post._id)}
        disabled={commentLoading[post._id]}
        className={`px-3 py-2 rounded-xl transition active:scale-95 ${
          commentLoading[post._id]
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
      >
        {commentLoading[post._id] ? "Posting..." : "Post"}
      </button>

    </div>

  )

)}
</div>
);
})
)}
</div>

   
                  {editPost && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 p-4 rounded-lg shadow-lg w-80 relative">
      {/* Close Button */}
      <button
        onClick={() => {
          setEditPost(null);
          setPreviewImage(null);
          setEditImage(null);
        }}
        className="absolute top-2 right-2 text-gray-600 hover:text-black"
      >
        <FiX className="w-5 h-5" />
      </button>

      {/* Title */}
      <h2 className="text-lg font-semibold mb-3">Edit Post</h2>

      {/* Textarea */}
      <textarea
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        rows="3"
        className="w-full border rounded p-2 mb-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
        placeholder="Edit your post..."
      />

      {/* Image Display */}
      {editPost?.image && !previewImage && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">Current image:</p>
          <img
            src={editPost.image}
            alt="Current post"
            className="rounded-lg max-h-40 object-cover w-full"
          />
        </div>
      )}

      {/* Preview Image */}
      {previewImage && (
        <div className="relative mb-3">
          <p className="text-sm text-gray-600 mb-1">New image preview:</p>
          <img
            src={previewImage}
            alt="Preview"
            className="w-full h-40 object-cover rounded"
          />
          <button
            onClick={() => {
              setEditImage(null);
              setPreviewImage(null);
            }}
            className="absolute top-2 right-2 bg-white dark:bg-gray-900 bg-opacity-70 rounded-full p-1 text-red-500 hover:bg-opacity-100"
          >
            <FiX />
          </button>
          <p className="text-xs text-gray-500 mt-1">
            This will replace the current image
          </p>
        </div>
      )}

      {/* No Image State - Show when image is removed */}
      {!editPost?.image && !previewImage && (
        <div className="mb-3 p-4 border border-dashed border-gray-300 rounded-lg text-center">
          <FiImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-infinityTextSecondaryDark">No image in this post</p>
        </div>
      )}

      {/* Image Action Buttons */}
      <div className="space-y-2 mb-3">
        {/* Change/Add Image Button */}
        <label className="flex items-center space-x-2 text-purple-600 cursor-pointer hover:text-purple-800 p-2 rounded hover:bg-purple-50">
          <FiCamera />
          <span>
            {previewImage ? "Change New Image" : editPost?.image ? "Change Image" : "Add Image"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Remove Image Button - Only show if there's a current image and no preview */}
           {editPost?.image && !previewImage && (
  <button
    onClick={() => {


      // Remove the image from the post
      setEditPost(prev => ({
        ...prev,
        image: null
      }));



      // Also update the main posts array for instant UI feedback
      setPosts(prev => prev.map(post =>
        post._id === editPost._id
          ? { ...post, image: null }
          : post
      ));
      setPreviewImage(null);
      setEditImage(null);
    }}
    className="flex items-center space-x-2 text-red-600 cursor-pointer hover:text-red-800 p-2 rounded hover:bg-red-50 w-full text-sm"
  >
    <FiTrash2 />
    <span>Remove Image</span>
  </button>
)}
                </div>

      {/* Save Button */}
      <button
        onClick={handleSaveEdit}
        className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
      >
        Save Changes
      </button>
    </div>
  </div>
)}
                 {/* Enhanced Comments Modal */}
{activeCommentsPost && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 w-96 max-h-[80vh] overflow-y-auto rounded-lg p-4 relative shadow-lg">
      <button
        onClick={() => setActiveCommentsPost(null)}
        className="absolute top-2 right-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-gray-100"
      >
        <FiX className="w-5 h-5" />
      </button>
      <h2 className="font-bold text-lg mb-3 dark:text-gray-100">
        Comments ({activeCommentsPost.comments?.length || 0})
      </h2>

      <div className="space-y-3">
        {activeCommentsPost.comments?.map((comment) => {
          const username = comment.user?.username || 'User';
          const avatarSrc = imageUrl(comment.user?.profilePicture);
          const userId = getCurrentUserId();
          const isCommentLiked = comment.likes?.some(like =>
            String(like._id || like) === String(userId)
          );
          const isExpanded = expandedComments[`${activeCommentsPost._id}-${comment._id}`];

          return (
            <div key={comment._id} className="border-b pb-3 dark:border-gray-700">
              {/* Main Comment */}
              <div className="flex items-start space-x-3 mb-2">
                {/* Avatar */}
                <a href={`/profile/${comment.user?.username}`}>
                  {getAvatar(avatarSrc, username, 8)}
                </a>

                <div className="flex-1">
                  {/* Username + Comment */}
                  <div className="flex items-center justify-between">
                    <div>
                      <a
                        href={`/profile/${comment.user?.username}`}
                        className="font-semibold text-sm hover:underline text-gray-800 dark:text-gray-100"
                      >
                        {username}
                      </a>
                      <span className="text-xs text-gray-500 ml-2 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {/* Comment Like Button */}
                    <button
                      onClick={() => handleLikeComment(activeCommentsPost._id, comment._id)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-red-500 text-xs dark:text-gray-400 dark:hover:text-red-400"
                    >
                      {isCommentLiked ? (
                        <FaHeart className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                      ) : (
                        <FiHeart className="w-3.5 h-3.5" />
                      )}
                      <span className="dark:text-gray-100">{comment.likeCount || 0}</span>
                    </button>
                  </div>

                  <p className="text-gray-700 text-sm mt-1 dark:text-gray-100">{comment.text}</p>

                  {/* Recomment Button */}
                  <div className="flex items-center space-x-4 mt-2">
                    <button
                      onClick={() => toggleCommentExpansion(activeCommentsPost._id, comment._id)}
                      className="text-xs text-purple-600 hover:underline dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      {comment.recommentCount || 0} Recomment{comment.recommentCount !== 1 ? 's' : ''}
                    </button>
                    <button
                      onClick={() => {
                        setRecommentInputs(prev => ({
                          ...prev,
                          [`${activeCommentsPost._id}-${comment._id}`]: ''
                        }));
                        setExpandedComments(prev => ({
                          ...prev,
                          [`${activeCommentsPost._id}-${comment._id}`]: true
                        }));
                      }}
                      className="text-xs text-gray-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Reply
                    </button>
                  </div>

                 {/* Recomments Section */}
{isExpanded && (
  <div className="mt-3 ml-4 pl-3 border-l-2 border-gray-300 dark:border-gray-700">
    {/* Show existing recomments */}
    {comment.recomments && comment.recomments.length > 0 && (
      <div className="space-y-2 mb-3">
        {comment.recomments.map((recomment) => {
          const recommentUsername = recomment.user?.username || 'User';
          const recommentAvatarSrc = imageUrl(recomment.user?.profilePicture);
          const isRecommentLiked = recomment.likes?.some(like =>
            String(like._id || like) === String(userId)
          );

          return (
            <div key={recomment._id} className="flex items-start space-x-2">
              <img
                src={recommentAvatarSrc || `https://i.pravatar.cc/150?u=${recommentUsername}`}
                alt={recommentUsername}
                className="w-5 h-5 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-600"
                onError={(e) => {
                  e.target.src = `https://i.pravatar.cc/150?u=${recommentUsername || 'unknown'}`;
                }}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-gray-800 font-semibold text-xs dark:text-gray-100">
                    {recommentUsername}
                  </span>
                  <span className="text-gray-400 text-xs dark:text-gray-400">
                    {new Date(recomment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 text-xs mb-1 dark:text-gray-100">{recomment.text}</p>

                {/* Recomment Like Button */}
                <button
                  onClick={() => handleLikeRecomment(activeCommentsPost._id, comment._id, recomment._id)}
                  className="flex items-center space-x-1 text-gray-400 hover:text-red-500 text-xs dark:text-gray-400 dark:hover:text-red-400"
                >
                  {isRecommentLiked ? (
                    <FaHeart className="w-3 h-3 text-red-500 dark:text-red-400" />
                  ) : (
                    <FiHeart className="w-3 h-3" />
                  )}
                  <span className="dark:text-gray-100">{recomment.likeCount || 0}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* Add Recomment Input */}
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={recommentInputs[`${activeCommentsPost._id}-${comment._id}`] || ''}
        onChange={(e) =>
          setRecommentInputs({
            ...recommentInputs,
            [`${activeCommentsPost._id}-${comment._id}`]: e.target.value
          })
        }
        placeholder="Write a recomment..."
        className="flex-1 border rounded-md p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleAddRecomment(activeCommentsPost._id, comment._id);
          }
        }}
      />
      <button
        onClick={() => handleAddRecomment(activeCommentsPost._id, comment._id)}
        disabled={recommentLoading[`${activeCommentsPost._id}-${comment._id}`]}
        className={`px-3 py-1.5 rounded text-xs ${
          recommentLoading[`${activeCommentsPost._id}-${comment._id}`]
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300'
            : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 dark:text-gray-100'
        }`}
      >
        {recommentLoading[`${activeCommentsPost._id}-${comment._id}`] ? 'Posting...' : 'Post'}
      </button>
    </div>
  </div>
)} 
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)} 

      {/* Followers / Following Modal */}
{modalType && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 w-80 rounded-lg shadow-lg p-4 relative"ref={modalRef}>
      {/* Close button */}
      <button
        onClick={closeModal}
        className="absolute top-2 right-2 text-gray-500 hover:text-black"
      >
        <FiX className="w-5 h-5" />
      </button>

      {/* Modal title */}
      <h2 className="font-bold text-lg mb-3 capitalize">{modalType}</h2>

      {/* Modal content */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {(modalType === "followers" ? user.followers : user.following).length === 0 ? (
          <p className="text-gray-500 text-sm">No {modalType} yet.</p>
        ) : (
          (modalType === "followers" ? user.followers : user.following).map((u) => (
            <div
              key={u._id || u}
              className="flex items-center justify-between border-b pb-2 hover:bg-gray-50 p-2 rounded"
            >
              {/* ✅ User profile link */}
              <Link href={`/profile/${u.username}`}>
                <div className="flex items-center space-x-2">
                  {getAvatar(imageUrl(u.profilePicture), u.username, 6)}
                  <span className="text-sm font-medium">{u.username}</span>
                </div>
              </Link>

              {/* ✅ Follow / Unfollow button (hidden for self) */}
              {u._id !== currentUserId && (
                <button
                  onClick={async () => {
                    try {
                      const isFollowing = user.following?.some(f => f._id === u._id);

                      // Optimistically update UI
                      setUser((prev) => {
                        const newFollowing = isFollowing
                          ? prev.following.filter(f => f._id !== u._id)
                          : [...prev.following, u];
                        return { ...prev, following: newFollowing };
                      });

                      // Call backend
                      const url = `${API_BASE}/users/${u._id}/${isFollowing ? "unfollow" : "follow"}`;
                      await axios.post(url, {}, { headers: getAuthHeaders() });
                    } catch (err) {
                      console.error("Follow toggle error", err);
                    }
                  }}
                  className={`text-sm px-3 py-1 rounded-lg border transition ${
                    user.following?.some(f => f._id === u._id)
                      ? "border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-gray-800"
                      : "border-purple-500 text-purple-600 hover:bg-purple-100"
                  }`}
                >
                  {user.following?.some(f => f._id === u._id) ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}

{activeFeedbackPost && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">

    <div className="
      bg-white dark:bg-gray-900
      w-full max-w-md max-h-[80vh]
      rounded-2xl shadow-xl
      relative flex flex-col
    ">

      {/* Header */}
      <div className="
        sticky top-0
        bg-white dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-700
        px-4 py-3
        flex items-center justify-between
        rounded-t-2xl
      ">

        <div>

          <h2 className="
            font-semibold text-lg
            text-gray-800 dark:text-gray-100
          ">
            Private Feedback
          </h2>

          <p className="
            text-xs text-gray-500 dark:text-gray-400
          ">
            {activeFeedbackPost?.privateFeedback?.length || 0} feedbacks
          </p>

        </div>


        <button
          onClick={() => setActiveFeedbackPost(null)}
          className="
            p-2 rounded-full
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition
          "
        >
          <FiX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

      </div>


      {/* Feedback List */}
      <div className="
        p-4 space-y-3
        overflow-y-auto flex-1
      ">


        {activeFeedbackPost?.privateFeedback?.length > 0 ? (

          activeFeedbackPost.privateFeedback.map((feedback, i) => {

            if (!feedback) return null;


            const username =
              feedback.user?.username || "User";

            const avatarSrc =
              imageUrl(feedback.user?.profilePicture);


            return (

              <div
                key={feedback._id || i}
                className="
                  bg-gray-50 dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-xl p-3
                "
              >

                <div className="flex items-start space-x-3">


                  <Link href={`/profile/${username}`}>
                    {getAvatar(
                      avatarSrc,
                      username,
                      8
                    )}
                  </Link>


                  <div className="flex-1 min-w-0">


                    <div className="flex items-center justify-between">

                      <Link
                        href={`/profile/${username}`}
                        className="
                          font-medium text-sm
                          hover:underline
                          text-gray-800 dark:text-gray-200
                        "
                      >
                        {username}
                      </Link>


                      {feedback.createdAt && (
                        <span className="text-[11px] text-gray-400">

                          {new Date(
                            feedback.createdAt
                          ).toLocaleDateString()}

                        </span>
                      )}

                    </div>


                    <p className="
                      mt-1 text-sm
                      text-gray-700 dark:text-gray-300
                      break-words
                    ">
                      {feedback.text}
                    </p>


                  </div>

                </div>

              </div>

            );
          })


        ) : (

          <div className="py-10 text-center">

            <FiMessageCircle
              className="
                w-10 h-10
                text-gray-300 dark:text-gray-600
                mx-auto mb-2
              "
            />

            <p className="
              text-sm text-gray-500 dark:text-gray-400
            ">
              No feedback yet
            </p>

          </div>

        )}

      </div>

    </div>

  </div>
)}


{fullImage && (
  <FullImageModal
    imageUrl={fullImage}
    onClose={() => setFullImage(null)}
  />
)}

{fullscreenImages.length > 0 && (
  <FullscreenViewer
    images={fullscreenImages}
    onClose={() => setFullscreenImages([])}
  />
)}

  {/* Bottom Navbar */}
<div className="fixed bottom-0 left-0 w-full z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 flex justify-around items-center py-1">
  {/* Home */}
  <div
    onClick={() => router.push("/dashboard")}
    className={`flex flex-col items-center transition cursor-pointer ${
      router.pathname === "/dashboard"
        ? "text-purple-600 dark:text-purple-400"
        : "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
    }`}
  >
    <FiHome className="w-5 h-5" />
    <span className="text-xs">Home</span>
  </div>

  {/* Explore */}
  <div
    onClick={() => router.push("/explore")}
    className={`flex flex-col items-center transition cursor-pointer ${
      router.pathname === "/explore"
        ? "text-purple-600 dark:text-purple-400"
        : "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
    }`}
  >
    <FiSearch className="w-5 h-5" />
    <span className="text-xs">Explore</span>
  </div>

  {/* Floating Post Button - Centered */}
  <div className="relative -top-1">
    <Link href="/newPost">
      <button
        className="bg-purple-600 dark:bg-purple-700 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 dark:hover:bg-purple-800 transition border-2 border-white"
      >
        <FiPlus className="w-6 h-6" />
      </button>
    </Link>
  </div>

  {/* Reels */}
  <div
    onClick={() => router.push("/reels")}
    className={`flex flex-col items-center transition cursor-pointer ${
      router.pathname === "/reels"
        ? "text-purple-600 dark:text-purple-400"
        : "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
    }`}
  >
    <FiVideo className="w-5 h-5" />
    <span className="text-xs">Reels</span>
  </div>

  {/* Profile */}
  {user?.username ? (
    <Link href={`/profile/${user.username}`} className="transition">
      <div className={`flex flex-col items-center ${
        router.pathname.includes("/profile")
          ? "text-purple-600 dark:text-purple-400"
          : "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
      }`}>
        <FiUser className="w-5 h-5" />
        <span className="text-xs">Profile</span>
      </div>
    </Link>
  ) : (
    <button
      onClick={() => router.push('/login')}
      className="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
    >
      <FiUser className="w-5 h-5" />
      <span className="text-xs">Profile</span>
    </button>
  )}
</div>

   </div>
	   );                  
}
