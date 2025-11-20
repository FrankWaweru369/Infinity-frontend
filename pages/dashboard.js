"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import config from '../src/config';
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
  FiTrash2
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import axios from "axios";
import Link from "next/link";


const API_BASE = config.apiUrl;

export default function Dashboard() {

  const [debug, setDebug] = useState("1. Dashboard started");
  
  // Check if user exists
  if (!user) {
    return <div>❌ ERROR: User is null</div>;
  }
  
  // Check if user has username
  if (!user.username) {
    return <div>❌ ERROR: User has no username</div>;
  }
  
  return (
    <div>
      <div className="bg-yellow-100 p-2">🟢 {debug}</div>
      {/* Your normal dashboard content */}
    </div>
  );

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

const currentPath = router.pathname;

const dropdownRef = useRef(null);

// Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {                                               setMenuOpenFor(null);                                                                                               }
  };                                                                                                                  
  // Add event listener when dropdown is open
  if (menuOpenFor) {
    document.addEventListener('mousedown', handleClickOutside);                                                           document.addEventListener('touchstart', handleClickOutside);                                                        }                                                                                                                                                                                                                                           // Cleanup
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);                                                        document.removeEventListener('touchstart', handleClickOutside);
  };                                                                                                                  }, [menuOpenFor]);


  // ✅ Get token headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ✅ Check user auth
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data && data._id) {
          setUser(data);
          localStorage.setItem("userId", data._id);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    };
    fetchUser();
  }, []);

  // ✅ Fetch posts (newest → oldest)
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
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // ✅ Image preview
  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

 

  // ✅ Create post
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
  headers: {
    ...getAuthHeaders(),

  },
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

  // ✅ Like a post
  const handleLike = async (post) => {
  try {
    const res = await fetch(`${API_BASE}/posts/${post._id}/like`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Like failed");
    const updated = await res.json();

    // Replace the post with the returned populated post
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  } catch (err) {
    console.error("Like error:", err);
  }
};

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
  setEditText(post.content || ""); // safer if content is missing
  setEditImage(null);
  setPreviewImage( null);
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
		  console.log("POST LIKES FOR:", post._id, post.likes),
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
                  className="rounded-md w-full object-cover mb-2"
                />
              )}

        {/* Actions */}
<div className="flex items-center mt-2 text-gray-600 w-full relative">
  {/* Left side: Like button + Like count + Comment count */}
  <div className="flex items-center space-x-4">
    {/* Like button */}
    <button
      onClick={() => handleLike(post)}
      className="flex items-center space-x-1"
    >
      {post.likes?.some((u) => u._id === user._id) ? (
        <FaHeart className="w-5 h-5 text-red-500" />
      ) : (
        <FiHeart className="w-5 h-5" />
      )}
      <span>{post.likes?.length || 0}</span>
    </button>

     {/* clickable count opens list */}
  <button
    onClick={() => toggleLikesList(post._id)}
    className="text-sm text-gray-500 underline"
  >
    {post.likes?.length ? "View likers" : "Be first to like"}
  </button>

  {/* Likes list dropdown/modal */}
  {likesListOpenFor === post._id && (
    <div className="absolute left-0 mt-10 bg-white border rounded shadow p-2 w-56 z-50">
      <div className="text-sm font-semibold mb-2">Liked by</div>
      <div className="max-h-48 overflow-y-auto">
        {post.likes && post.likes.length ? (
          post.likes.map((u) => (
            <a
              key={u._id}
              href={`/profile/${u.username}`}
              className="flex items-center space-x-2 mb-2 hover:opacity-80 transition"
            >
              {getAvatar(imageUrl(u.profilePicture), u.username, 6)}
              <span className="text-sm hover:underline">{u.username}</span>
            </a>
          ))
        ) : (
          <div className="text-xs text-gray-400">No likes yet</div>
        )}
      </div>
      <div className="text-right mt-2">
        <button
          onClick={() => setLikesListOpenFor(null)}
          className="text-xs text-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  )}

    {/* Comment count (only here on the left) */}
    <div className="flex items-center space-x-1">
      <FiMessageCircle className="w-5 h-5" />
      <span>{post.comments?.length || 0}</span>
    </div>
  </div>

		    {/* Three-dot menu only on the right */}
{post.author?._id === user._id && (
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
        ref={dropdownRef} // Add this ref
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
    <a href={`/profile/${c.user.username}`}>
      {getAvatar(avatarSrc, username, 8)}
    </a>

    {/* Username + Comment */}
    <div className="flex flex-col">
      <a
        href={`/profile/${c.user.username}`}
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
      value={commentInputs[post._id]}
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

      {/* No Image State - Show when image is removed */}
      {!editPost?.image && !previewImage && (
        <div className="mb-3 p-4 border border-dashed border-gray-300 rounded-lg text-center">
          <FiImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No image in this post</p>
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

		  {/* Comments Modal */}
{activeCommentsPost && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
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
    <a href={`/profile/${c.user.username}`}>
      {getAvatar(avatarSrc, username, 8)}
    </a>

    {/* Username + Comment */}
    <div className="flex flex-col">
      <a
        href={`/profile/${c.user.username}`}
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
            </div>
          ))
        )}
      </div>

           {/* bottom navbar */}
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
  <div
    onClick={() => alert("Explore feature coming soon!")}
    className="flex flex-col items-center text-gray-700 hover:text-purple-600 transition cursor-pointer"
  >
    <FiSearch className="w-5 h-5" />
    <span className="text-xs">Explore</span>
  </div>

  {/* Floating Post Button - Centered */}
  <div className="relative -top-1">
    <button
      onClick={() => alert("Post feature coming soon!")}
      className="bg-purple-600 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 transition border-2 border-white"
    >
      <FiPlus className="w-6 h-6" />
    </button>
  </div>

  {/* Reels */}
  <div
    onClick={() => alert("Reels feature coming soon!")}
    className="flex flex-col items-center text-gray-700 hover:text-purple-600 transition cursor-pointer"
  >
    <FiVideo className="w-5 h-5" />
    <span className="text-xs">Reels</span>
  </div>

  {/* Profile */}
  <Link href={`/profile/${user?.username || ""}`} className="transition">
    <div className={`flex flex-col items-center ${
      router.pathname.includes("/profile") 
        ? "text-purple-600" 
        : "text-gray-700 hover:text-purple-600"
    }`}>
      <FiUser className="w-5 h-5" />
      <span className="text-xs">Profile</span>
    </div>
  </Link>
</div>

</div>
  );
}



