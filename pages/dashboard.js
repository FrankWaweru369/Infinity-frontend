"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  FiHome,
  FiSearch,
  FiPlusCircle,
  FiUser,
  FiHeart,
  FiMessageCircle,
  FiImage,
  FiMoreHorizontal,
  FiX,
  FiCamera,
  FiPlus,
  FiVideo,
  FiTrash2,
  FiDownload
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import axios from "axios";
import Link from "next/link";
import FullImageModal from "../components/FullImageModal";
import config from '../src/config';

const API_BASE = config.apiUrl;

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const fileInputRef = useRef(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [likesListOpenFor, setLikesListOpenFor] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [commentLoading, setCommentLoading] = useState({});
  const [fullImage, setFullImage] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});

  const currentPath = router.pathname;
  const dropdownRef = useRef(null);

  useEffect(() => {
    const validateTokenAndAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      if (token === "null" || token === "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        router.push("/login");
        return;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        router.push("/login?reason=invalid_token");
        return;
      }

      try {
        const payload = JSON.parse(atob(parts[1]));
        const isExpired = payload.exp * 1000 < Date.now();

        if (isExpired) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          router.push("/login?reason=expired");
          return;
        }

        const userId = payload.id || payload.userId || payload._id;
        setCurrentUserId(userId);

        await fetchUserData(token, userId);

      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        router.push("/login?reason=corrupted");
        return;
      }
    };

    validateTokenAndAuth();
  }, []);

  const fetchUserData = async (token, userIdFromToken) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        router.push("/login?reason=server_rejected");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      // Check for nested user object
      let userData;
      if (data.user) {
        // Server returns { user: { ... } }
        userData = data.user;
      } else if (data._id || data.id) {
        // Server returns { _id: "...", ... } directly
        userData = data;
      } else {
        router.push("/login");
        return;
      }

      // Now userData should have the user object
      if (userData && (userData._id || userData.id)) {
        setUser(userData);
        localStorage.setItem("userId", userData._id || userData.id);
        setAuthChecking(false);

        // Fetch posts after getting user
        fetchPosts();
      } else {
        router.push("/login");
      }

    } catch (err) {
      router.push("/login");
    }
  };

  // Get auth headers safely
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    if (!token || token === "null" || token === "undefined") {
      return {};
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpenFor(null);
      }
    };

    if (menuOpenFor) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpenFor]);

  // Analytics effect
  useEffect(() => {
    if (!currentUserId) return;

    const start = Date.now();

    return () => {
      const duration = Math.floor((Date.now() - start) / 1000);

      axios.post(`${API_BASE}/analytics/visit`, {
        userId: currentUserId,
        page: window.location.pathname,
        duration,
      }).catch(err => {});
    };
  }, [currentUserId]);

	useEffect(() => {
  if (user && posts.length > 0) {
    const likedPostsObj = {};
    posts.forEach(post => {
      let userLiked = false;

      if (post.likes && Array.isArray(post.likes)) {
        userLiked = post.likes.some(like => {
          if (typeof like === 'string') {
            return like === user._id || like === user.id;
          } else if (like._id) {
            return like._id === user._id || like._id === user.id;
          } else if (like.user?._id) {
            return like.user._id === user._id || like.user._id === user.id;
          }
          return false;
        });
      }

      likedPostsObj[post._id] = userLiked;
    });

    setLikedPosts(likedPostsObj);
  }
}, [posts, user]);

  // ✅ Image preview
  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ✅ Create post handler
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    setPosting(true);

    const formData = new FormData();
    formData.append("content", content);
    if (image) formData.append("image", image);

    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setPosts((prev) => [data, ...prev]);
        setContent("");
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        console.error(data.message || "Post failed");
      }
    } catch (err) {
      console.error("Post error:", err);
    } finally {
      setPosting(false);
    }
  };

  // Fetch posts
const fetchPosts = async () => {
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      headers: getAuthHeaders(),
    });

    const data = await res.json();

    if (Array.isArray(data)) {
      const sorted = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPosts(sorted);

      // ✅ CRITICAL: Initialize likedPosts state
      if (user) {
        const likedPostsObj = {};
        sorted.forEach(post => {
          let userLiked = false;

          if (post.likes && Array.isArray(post.likes)) {
            userLiked = post.likes.some(like => {
              if (typeof like === 'string') {
                return like === user._id || like === user.id;
              } else if (like._id) {
                return like._id === user._id || like._id === user.id;
              } else if (like.user?._id) {
                return like.user._id === user._id || like.user._id === user.id;
              }
              return false;
            });
          }

          likedPostsObj[post._id] = userLiked;
        });

        setLikedPosts(likedPostsObj);
      }
    }
  } catch (err) {
    alert("Error fetching posts: " + err.message);
  }
};

  // ✅ Like a post
const handleLike = async (post) => {
  // Store current state for optimistic update
  const wasLiked = likedPosts[post._id];
  
  // Optimistic update: Immediately change UI
  setLikedPosts(prev => ({
    ...prev,
    [post._id]: !wasLiked
  }));
  
  // Optimistically update likes count
  setPosts(prev => prev.map(p => 
    p._id === post._id 
      ? { 
          ...p, 
          likes: wasLiked 
            ? p.likes?.filter(like => {
                // Handle different like structures
                if (typeof like === 'string') {
                  return like !== user?._id && like !== user?.id;
                } else if (like._id) {
                  return like._id !== user?._id && like._id !== user?.id;
                } else if (like.user?._id) {
                  return like.user._id !== user?._id && like.user._id !== user?.id;
                }
                return true;
              })
            : [...(p.likes || []), user?._id || user?.id]
        } 
      : p
  ));

  try {
    const res = await fetch(`${API_BASE}/posts/${post._id}/like`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Like failed");

    const updated = await res.json();

    // Update with actual server response
    setPosts(prev => prev.map(p => (p._id === updated._id ? updated : p)));
    
    // Update likedPosts with accurate state from server
    const userLiked = updated.likes?.some(like => {
      if (typeof like === 'string') {
        return like === user?._id || like === user?.id;
      } else if (like._id) {
        return like._id === user?._id || like._id === user?.id;
      } else if (like.user?._id) {
        return like.user._id === user?._id || like.user._id === user?.id;
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
    
    // Revert likes count
    setPosts(prev => prev.map(p => 
      p._id === post._id 
        ? { 
            ...p, 
            likes: wasLiked 
              ? [...(p.likes || []), user?._id || user?.id]
              : p.likes?.filter(like => {
                  if (typeof like === 'string') {
                    return like !== user?._id && like !== user?.id;
                  } else if (like._id) {
                    return like._id !== user?._id && like._id !== user?.id;
                  } else if (like.user?._id) {
                    return like.user._id !== user?._id && like.user._id !== user?.id;
                  }
                  return true;
                })
          } 
        : p
    ));
  }
};


	// ✅ Toggle likes list
const toggleLikesList = (postId) => {
  setLikesListOpenFor((prev) => (prev === postId ? null : postId));
};


  // ✅ Add comment
  const handleComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text?.trim() || commentLoading[postId]) return;

    setCommentLoading(prev => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const updated = await res.json();

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments: updated.comments,
              }
            : p
        )
      );
      setCommentInputs({ ...commentInputs, [postId]: "" });
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // --- Edit Post ---
  const handleEdit = (post) => {
    setEditPost(post);
    setEditText(post.content || "");
    setEditImage(null);
    setPreviewImage(null);
  };

  // --- Handle Image File Change ---
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // --- Save the Edited Post ---
  const handleSaveEdit = async () => {
    if (!editPost) return;

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

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/login");
  };

  const imageUrl = (img) => {
    if (!img) return null;

    // Already a full URL
    if (img.startsWith("http://") || img.startsWith("https://")) return img;

    // Ensure single slash between base and image path
    const base = API_BASE.replace("/api", "").replace(/\/$/, "");
    const path = img.startsWith("/") ? img : `/${img}`;
    return `${base}${path}`;
  };

  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        // ✅ Instantly remove post from list
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      } else {
        const errText = await res.text();
        console.error("Delete error:", errText);
      }
    } catch (err) {
      alert("🔥 Error deleting post: " + err.message);
    }
  };

  const getAvatar = (src, username, size = 8) => {
    const getInitials = (name) => {
      if (!name) return "U";
      return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
    };

    const sizeClasses = {
      6: 'w-6 h-6 text-xs',
      8: 'w-8 h-8 text-sm',
      12: 'w-12 h-12 text-base',
      16: 'w-16 h-16 text-lg'
    };

    if (src) {
      return <img src={src} alt={username || "User"} className={`rounded-full ${sizeClasses[size]} object-cover`} />;
    }

    return (
      <div className={`rounded-full bg-black text-white flex items-center justify-center font-semibold ${sizeClasses[size]}`}>
        {getInitials(username)}
      </div>
    );
  };

  if (!user) {
    return null;
  }
  
  return (
  <div className="min-h-screen bg-gray-50 pb-6">
    {/* Header */}
    <div className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-white shadow-sm">
      <h1 className="font-bold text-lg text-purple-600">Infinity</h1>

      {user && (
        <div className="flex items-center space-x-4">
          <a
            href={`/profile/${user.username}`}
            className="flex items-center space-x-2 hover:opacity-80 transition"
          >
            {getAvatar(imageUrl(user.profilePicture), user.username, 8)}
            <span className="text-sm font-medium hover:underline">
              {user.username}
            </span>
          </a>

          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>

    <div className="pt-14">
      {/* Create Post */}
      <form
        onSubmit={handlePostSubmit}
        className="bg-white p-4 rounded-lg shadow-sm"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {preview && (
          <div className="mt-2">
            <img
              src={preview}
              alt="Preview"
              className="rounded-md max-h-60 object-cover"
            />
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center space-x-2 cursor-pointer text-purple-600">
            <FiImage className="w-5 h-5" />
            <span>{image ? "Change Image" : "Add Image"}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="hidden"
            />
          </label>
          <button
            disabled={posting}
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 transition"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>

    {/* Feed */}
    <div className="flex-1 p-4 space-y-1">
      {posts.length === 0 ? (
        <p className="text-center text-gray-500">No posts yet</p>
      ) : (
        posts.map((post) => (
          <div key={post._id} className="bg-white rounded-lg shadow-sm p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <a
                href={`/profile/${post.author?.username}`}
                className="flex items-center space-x-3 hover:opacity-80 transition"
              >
                {getAvatar(imageUrl(post.author?.profilePicture), post.author?.username, 8)}
                <span className="font-semibold hover:underline">
                  {post.author?.username}
                </span>
              </a>
              <span className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Content */}
            <p className="mb-2 text-sm">{post.content}</p>
            {post.image && (
              <img
                src={post.image}
                alt="Post"
                className="rounded-md w-full object-cover mb-2 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                onClick={() => setFullImage(post.image)}
              />
            )}

            {/* Actions */}
            <div className="flex items-center mt-2 text-gray-600 w-full relative">
              {/* Left side: Like button + Like count + Comment count */}
              <div className="flex items-center space-x-4">
                {/* Like Button */}
<button
  onClick={() => handleLike(post)}
  className="flex flex-col items-center"
>
  {likedPosts[post._id] ? (
    <FaHeart className="w-5 h-5 text-red-500" />
  ) : (
    <FiHeart className="w-5 h-5 text-gray-500 hover:text-red-500" />
  )}
  <span className="text-xs mt-1">{post.likes?.length || 0}</span>
</button>

                {/* clickable count opens list */}
                <button
                  onClick={() => toggleLikesList(post._id)}
                  className="text-sm text-gray-500 underline"
                >
                  {post.likes?.length ? "View likers" : "Be first to like"}
                </button>

                {/* Comment count */}
                <div className="flex items-center space-x-1">
                  <FiMessageCircle className="w-5 h-5" />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>

		   {/* Likes list dropdown/modal - Simplified with gray background */}
{likesListOpenFor === post._id && (
  <div className="absolute left-4 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-60 z-50">
    {/* Header with subtle gray background */}
    <div className="text-sm font-semibold mb-3 pb-2 border-b border-gray-200 text-gray-800 bg-gray-50 px-2 py-1 rounded-t">
      Liked by ({post.likes?.length || 0})
    </div>
    
    {/* List with alternating background for better separation */}
    <div className="max-h-48 overflow-y-auto bg-gray-50/30 rounded">
      {post.likes && post.likes.length ? (
        post.likes.map((u, index) => (
          <a
            key={u._id}
            href={`/profile/${u.username}`}
            className={`flex items-center space-x-3 p-2 transition ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            } ${
              index !== post.likes.length - 1 ? 'border-b border-gray-100' : ''
            } hover:bg-purple-50`}
          >
            {/* Avatar with border */}
            <div className="w-8 h-8 rounded-full border-2 border-purple-200 overflow-hidden bg-white">
              {getAvatar(imageUrl(u.profilePicture), u.username, 8)}
            </div>
            
            <span className="text-sm font-medium text-gray-700">{u.username}</span>
          </a>
        ))
      ) : (
        <div className="py-6 text-center bg-white rounded">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <FiHeart className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No likes yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to like</p>
        </div>
      )}
    </div>
    
    {/* Footer with subtle gray background */}
    <div className="mt-3 pt-2 border-t border-gray-200 text-right bg-gray-50/50 px-2 py-1 rounded-b">
      <button
        onClick={() => setLikesListOpenFor(null)}
        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
      >
        Close
      </button>
    </div>
  </div>
)} 

              {/* Three-dot menu only on the right */}
              {post.author?._id === user?._id && (
                <div className="ml-auto relative">
                  <button
                    onClick={() =>
                      setMenuOpenFor(menuOpenFor === post._id ? null : post._id)
                    }
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <FiMoreHorizontal className="w-5 h-5" />
                  </button>

                  {/* Dropdown menu */}
                  {menuOpenFor === post._id && (
                    <div
                      ref={dropdownRef}
                      className="absolute right-0 mt-2 w-24 bg-white border rounded shadow-md z-50"
                    >
                      <button
                        onClick={() => handleEdit(post)}
                        className="w-full text-left px-3 py-1 text-blue-500 text-sm hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="w-full text-left px-3 py-1 text-red-500 text-sm hover:bg-gray-100"
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
              {post.comments && post.comments.length > 0 ? (
                <>
                  {/* Show top comment only */}
                  {post.comments.slice(0, 1).map((c, i) => {
                    const username = c.user?.username ?? "user";
                    const avatarSrc = imageUrl(c.user?.profilePicture);
                    const text = c.text ?? c;
                    return (
                      <div
                        key={i}
                        className="flex items-start space-x-2 border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        {/* Avatar */}
                        <a href={`/profile/${c.user?.username}`}>
                          {getAvatar(avatarSrc, username, 8)}
                        </a>

                        {/* Username + Comment */}
                        <div className="flex flex-col">
                          <a
                            href={`/profile/${c.user?.username}`}
                            className="font-semibold text-sm hover:underline text-gray-800"
                          >
                            {username}
                          </a>
                          <p className="text-gray-700 text-sm pl-2 mt-1 border-l-2 border-purple-200">
                            {text}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* View all comments button */}
                  {post.comments.length > 1 && (
                    <button
                      onClick={() => setActiveCommentsPost(post)}
                      className="text-xs text-purple-600 hover:underline focus:outline-none"
                    >
                      View all {post.comments.length} comments
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">No comments yet</p>
              )}

              {/* Comment input */}
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  value={commentInputs[post._id] || ""}
                  onChange={(e) =>
                    setCommentInputs({
                      ...commentInputs,
                      [post._id]: e.target.value,
                    })
                  }
                  placeholder="Add a comment..."
                  className="flex-1 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => handleComment(post._id)}
                  disabled={commentLoading[post._id]}
                  className={`px-3 py-1 rounded ${
                    commentLoading[post._id]
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {commentLoading[post._id] ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>

    {/* Edit Post Modal */}
    {editPost && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg shadow-lg w-80 relative">
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
                className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-1 text-red-500 hover:bg-opacity-100"
              >
                <FiX />
              </button>
              <p className="text-xs text-gray-500 mt-1">
                This will replace the current image
              </p>
            </div>
          )}

          {/* No Image State */}
          {!editPost?.image && !previewImage && (
            <div className="mb-3 p-4 border border-dashed border-gray-300 rounded-lg text-center">
              <FiImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No image in this post</p>
            </div>
          )}

          {/* Change Image Button */}
          <label className="block mb-3">
            <div className="flex items-center gap-2 text-purple-600 hover:text-purple-800 cursor-pointer">
              <FiImage className="w-4 h-4" />
              <span className="text-sm font-medium">
                {previewImage ? "Change Image" : "Change/Add Image"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </label>

          {/* Remove Image Button */}
          {editPost?.image && !previewImage && (
            <button
              onClick={() => {
                setPreviewImage(null);
                setEditImage(null);
                setEditPost(prev => ({ ...prev, image: null }));
              }}
              className="w-full mb-3 text-red-600 hover:text-red-800 text-sm font-medium flex items-center justify-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" />
              Remove Image
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveEdit}
            disabled={!editText.trim() && !previewImage && !editPost?.image}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    )}

    {/* Comments Modal */}
    {activeCommentsPost && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white w-96 max-h-[80vh] overflow-y-auto rounded-lg p-4 relative shadow-lg">
          <button
            onClick={() => setActiveCommentsPost(null)}
            className="absolute top-2 right-2 text-gray-600 hover:text-black"
          >
            <FiX className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-lg mb-3">
            Comments ({activeCommentsPost.comments.length})
          </h2>

          {activeCommentsPost.comments.map((c, i) => {
            const username = c.user?.username ?? "user";
            const avatarSrc = imageUrl(c.user?.profilePicture);
            const text = c.text ?? c;
            return (
              <div
                key={i}
                className="flex items-start space-x-2 border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                {/* Avatar */}
                <a href={`/profile/${c.user?.username}`}>
                  {getAvatar(avatarSrc, username, 8)}
                </a>

                {/* Username + Comment */}
                <div className="flex flex-col">
                  <a
                    href={`/profile/${c.user?.username}`}
                    className="font-semibold text-sm hover:underline text-gray-800"
                  >
                    {username}
                  </a>
                  <p className="text-gray-700 text-sm pl-2 mt-1 border-l-2 border-purple-200">
                    {text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}


	 {fullImage && (                                                                                                         <FullImageModal
    imageUrl={fullImage}
    onClose={() => setFullImage(null)}                                                                                  />                                                                                                                  )}

    {/* Bottom Navbar */}
    <div className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 flex justify-around items-center py-1">
      {/* Home */}
      <div
        onClick={() => router.push("/dashboard")}
        className={`flex flex-col items-center transition cursor-pointer ${
          router.pathname === "/dashboard"
            ? "text-purple-600"
            : "text-gray-700 hover:text-purple-600"
        }`}
      >
        <FiHome className="w-5 h-5" />
        <span className="text-xs">Home</span>
      </div>

      {/* Explore */}
      <Link href="/explore">
        <div className="flex flex-col items-center text-gray-700 hover:text-purple-600 transition cursor-pointer">
          <FiSearch className="w-5 h-5" />
          <span className="text-xs">Explore</span>
        </div>
      </Link>

      {/* Floating Post Button - Centered */}
      <div className="relative -top-1">
        <Link href="/newPost">
          <button
            className="bg-purple-600 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 transition border-2 border-white"
          >
            <FiPlus className="w-6 h-6" />
          </button>
        </Link>
      </div>

      {/* Reels */}
      <Link href="/reels">
        <div className="flex flex-col items-center text-gray-700 hover:text-purple-600 transition cursor-pointer">
          <FiVideo className="w-5 h-5" />
          <span className="text-xs">Reels</span>
        </div>
      </Link>

      {/* Profile */}
      {user?.username ? (
        <Link href={`/profile/${user.username}`} className="transition">
          <div className={`flex flex-col items-center ${
            router.pathname.includes("/profile")
              ? "text-purple-600"
              : "text-gray-700 hover:text-purple-600"
          }`}>
            <FiUser className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </div>
        </Link>
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="flex flex-col items-center text-gray-700 hover:text-purple-600 transition"
        >
          <FiUser className="w-5 h-5" />
          <span className="text-xs">Profile</span>
        </button>
      )}
    </div>
  </div>
);
}



