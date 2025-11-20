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

const API_BASE = config.apiUrl;

export default function ProfilePage() {


  const router = useRouter();
  const { username } = router.query;
  const postsContext = usePosts();
  const { posts = [],setPosts, loading:export default function ProfilePage() {
  const [debug, setDebug] = useState("2. Profile page started");
  
  // Check router params
  if (!router.query.username) {
    return <div>❌ ERROR: No username in URL</div>;
  }
  
  // Check if profile user exists
  if (!user) {
    return <div>❌ ERROR: Profile user not found</div>;
  }
  
  return (
    <div>
      <div className="bg-yellow-100 p-2">🟢 {debug}</div>
      {/* Your normal profile content */}
    </div>
  );
 postsLoading } = postsContext || {};

  // profile user (the page being viewed)
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // posts for this user (filtered from PostsContext)
  const [userPosts, setUserPosts] = useState([]);

  // UI state
  const [modalType, setModalType] = useState(null); // "followers" | "following" | null
  const [commentInputs, setCommentInputs] = useState({});
  const [actionLoading, setActionLoading] = useState({}); // per-post action loading
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

const dropdownRef = useRef(null);

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

  const handleScroll = () => {
    closeModal();
  };

  if (modalType) {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('touchstart', handleClickOutside);
    document.removeEventListener('scroll', handleScroll, true);
  };
}, [modalType]);



  // Get current logged-in user id from localStorage (if available)
  const currentUserId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // Helper to add auth headers
  const getAuthHeaders = () => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
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



  // Filter posts from PostsContext for this user
  useEffect(() => {
    if (!username) return;
    if (!posts || posts.length === 0) {
      setUserPosts([]);
      return;
    }
    const filtered = posts.filter((p) => p.author?.username === username);
    // sort newest to oldest (createdAt descending) if createdAt present
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setUserPosts(filtered);
  }, [username, posts]);



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

  // Like/unlike a post
  const handleLike = async (post) => {
    if (!post || !post._id) return;
    setActionLoading((s) => ({ ...s, [post._id]: true }));
    try {
      const res = await fetch(`${API_BASE}/posts/${post._id}/like`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      const updated = await res.json();
      
      setUserPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      
      if (postsContext && typeof postsContext.setPosts === "function") {
        postsContext.setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
    } catch (err) {
      console.error("Like error:", err);
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
    8: 'w-8 h-8 text-sm',
    12: 'w-12 h-12 text-base',
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

  return (
        <div className="min-h-screen bg-gray-50 pb-6">
  {/* Top Bar */}
<div className="flex items-center justify-between bg-white p-4 shadow-md sticky top-0 z-20">
  <button
    onClick={() => router.push("/dashboard")}
    className="flex items-center text-purple-600 font-semibold hover:underline"
  >
    <FiArrowLeft className="mr-2 w-5 h-5" />
    Back
  </button>
  <h1 className="font-bold text-lg">Profile</h1>
  <span />
</div>

{/* Profile Header */}
<div className="relative bg-white shadow-md rounded-lg overflow-visible mt-1">
  {/* Cover Photo */}
  <div className="relative w-full h-44 md:h-52 bg-gray-200 rounded-t-lg">

	{user.coverPhoto ? (
  <img
    src={imageUrl(user.coverPhoto)}
    alt={`${user.username} cover`}
    className="w-full h-full object-cover rounded-t-lg"
  />
) : (
  <div className="w-full h-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-t-lg flex items-center justify-center">
    <span className="text-white text-xl font-bold opacity-80">No cover photo yet</span>
  </div>
)}

    {/* Edit Cover Photo Icon */}
    {currentUserId === user._id && (
      <label className="absolute top-3 right-3 bg-black bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full cursor-pointer">
        <FiCamera className="text-white w-5 h-5" />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverPhotoChange}
        />
      </label>
    )}
  </div>

  {/* Profile Info Section */}
  <div className="px-6 pb-6 pt-20 relative">
    {/* Profile Info Row (Picture + Username + Counts) */}
    <div className="flex items-center space-x-6 md:space-x-8">
      {/* Profile Picture */}
      <div className="relative -mt-16">
        {getAvatar(imageUrl(user.profilePicture), user.username, 16)}
        {/* Edit Profile Picture Icon */}
        {currentUserId === user._id && (
          <label className="absolute bottom-1 right-1 bg-black bg-opacity-50 hover:bg-opacity-70 p-1.5 rounded-full cursor-pointer">
            <FiCamera className="text-white w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureChange}
            />
          </label>
        )}
      </div>

      {/* Username + Follow Counts */}
      <div className="mt-6 md:mt-8">
        <h1 className="text-xl md:text-2xl font-bold">{user.username}</h1>
        <div className="flex space-x-6 text-gray-600 mt-1 md:mt-2">
          <button onClick={() => setModalType("followers")} className="hover:underline">
            {user.followers?.length || 0} followers
          </button>
          <button onClick={() => setModalType("following")} className="hover:underline">
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

              // Optimistic UI update
              setUser((prev) => {
                const newFollowers = isFollowing
                  ? prev.followers.filter((f) => f._id !== currentUserId && f !== currentUserId)
                  : [...prev.followers, { _id: currentUserId }];
                return { ...prev, followers: newFollowers };
              });

              // Call backend
              const url = `${API_BASE}/users/${user._id}/${isFollowing ? "unfollow" : "follow"}`;
              await axios.post(url, {}, { headers: getAuthHeaders() });
            } catch (err) {
              console.error("Follow/unfollow error:", err);
            }
          }}
          className={`w-full text-white font-semibold py-2 rounded-lg shadow ${
            user.followers?.some((f) => f._id === currentUserId || f === currentUserId)
              ? "bg-gray-400 hover:bg-gray-500"
              : "bg-purple-600 hover:bg-purple-700"
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

	

{/* About Section */}
<div className="bg-white p-6 shadow-md rounded-2xl mt-1 border border-gray-100">
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center gap-2">
      <UserCircle className="text-purple-600" size={22} />
      <h2 className="font-semibold text-lg text-gray-800">About</h2>
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

  <div className="space-y-3 text-gray-700">
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
    <div className="bg-white rounded-2xl p-6 w-96 shadow-xl relative border border-gray-100 animate-scaleIn">
      
      {/* Close Button */}
      <button
        onClick={() => setIsEditingProfile(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
      >
        <FiX className="w-5 h-5" />
      </button>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
        <FiUser className="text-purple-600" />
        Edit Profile
      </h2>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1">
            <FiUser className="text-purple-500" /> Full Name
          </label>
          <input
            type="text"
            placeholder="Full Name"
            value={editData.fullName}
            onChange={(e) =>
              setEditData({ ...editData, fullName: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1">
            <FiInfo className="text-purple-500" /> Bio
          </label>
          <textarea
            placeholder="Write something about yourself..."
            value={editData.bio}
            onChange={(e) =>
              setEditData({ ...editData, bio: e.target.value })
            }
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1">
            <FaVenusMars className="text-purple-500" /> Gender
          </label>
          <select
            value={editData.gender}
            onChange={(e) =>
              setEditData({ ...editData, gender: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1">
            <FiCalendar className="text-purple-500" /> Date of Birth
          </label>
          <input
            type="date"
            value={editData.dob}
            onChange={(e) =>
              setEditData({ ...editData, dob: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1">
            <FiMapPin className="text-purple-500" /> Location
          </label>
          <input
            type="text"
            placeholder="Location"
            value={editData.location}
            onChange={(e) =>
              setEditData({ ...editData, location: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {/* Website */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1">
            <FiGlobe className="text-purple-500" /> Website
          </label>
          <input
            type="text"
            placeholder="https://example.com"
            value={editData.website}
            onChange={(e) =>
              setEditData({ ...editData, website: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1">
            <FiPhone className="text-purple-500" /> Phone
          </label>
          <input
            type="text"
            placeholder="0712 000 000"
            value={editData.phone}
            onChange={(e) =>
              setEditData({ ...editData, phone: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
          <p className="text-center text-gray-500">No posts yet.</p>
        ) : (
          userPosts.map((post) => {
            const postId = post._id;
            const likedByUser =
              Array.isArray(post.likes) &&
              post.likes.some((u) => (u && u._id ? u._id === currentUserId : u === currentUserId));
            return (
              <div key={postId} className="bg-white rounded-lg shadow-sm p-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-center space-x-3 mb-3 cursor-pointer"
                    onClick={() => router.push(`/profile/${post.author?.username ?? "guest"}`)}
                  >
                    {getAvatar(imageUrl(post.author?.profilePicture), post.author?.username, 8)}
                    <span className="font-semibold">{post.author?.username ?? "unknown"}</span>
                  </div>

                  <div className="text-sm text-gray-500">
                    {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
                  </div>
                </div>

                {/* Content */}
                {post.content && <p className="mb-2 text-sm">{post.content}</p>}

                {/* Image */}
                {post.image && (
                  <div className="rounded-md overflow-hidden mb-2">
                    <img src={imageUrl(post.image)} alt="Post" className="w-full object-cover" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center w-full mt-3 text-gray-600 relative">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post)}
                    disabled={!!actionLoading[postId]}
                    className="flex items-center space-x-1"
                  >
                    {likedByUser ? (
                      <FaHeart className="w-5 h-5 text-red-500" />
                    ) : (
                      <FiHeart className="w-5 h-5" />
                    )}
                    <span>{post.likes?.length || 0}</span>
                  </button>

                  {/* clickable count opens list */}
                  <button
                    onClick={() => toggleLikesList(post._id)}
                    className="text-sm text-gray-500 underline ml-3"
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
            className="flex items-center space-x-2 p-2 bg-gray-50 border border-gray-100 rounded-md hover:opacity-80 transition"
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

                  {/* Comment Count */}
                  <div className="flex items-center space-x-1 ml-4">
                    <FiMessageCircle className="w-5 h-5" />
                    <span>{post.comments?.length || 0}</span>
                  </div>

                  {/* Three-dot menu for Edit/Delete */}
{post.author?._id === currentUserId && (
  <div className="ml-auto relative">
    {/* Menu Button */}
    <button
      onClick={() =>
        setMenuOpenFor(menuOpenFor === post._id ? null : post._id)
      }
      className="p-1 hover:bg-gray-200 rounded-full"
    >
      <FiMoreHorizontal className="w-5 h-5" />
    </button>

    {/* Dropdown */}
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
</div>
);
})
)}
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

      {activeCommentsPost.comments.map((c, i) => {                                                                            const username = c.user?.username ?? "user";
        const avatarSrc = imageUrl(c.user?.profilePicture);
        const text = c.text ?? c;
        return (
  <div
    key={i}
    className="flex items-start space-x-2 border border-gray-200 rounded-lg p-3 bg-gray-50"
  >
    {/* Avatar */}
    <a href={`/profile/${c.user.username}`}>
      {getAvatar(avatarSrc, username, 6)}
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
    </div>                                                                                                              </div>
);
      })}
    </div>
  </div>
)}

      {/* Followers / Following Modal */}
{modalType && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white w-80 rounded-lg shadow-lg p-4 relative"ref={modalRef}>
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
                      ? "border-gray-300 text-gray-700 hover:bg-gray-100"
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
