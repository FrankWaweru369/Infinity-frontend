"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiHeart,
  FiMessageCircle,
  FiMoreHorizontal,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Link from "next/link";
import axios from "axios";
import config from '../src/config';
import PostCarousel from "./PostCarousel";

const API_BASE = config.apiUrl;

export default function PostCard({ post: initialPost, user, token: passedToken }) {
  const router = useRouter();
  const token = passedToken || (typeof window !== 'undefined' ? localStorage.getItem("token") : null);
  
  const [post, setPost] = useState(initialPost);
  const [likedPosts, setLikedPosts] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [likesListOpenFor, setLikesListOpenFor] = useState(null);
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [recommentInputs, setRecommentInputs] = useState({});

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
      const userId = user?._id || user?.id;
      const isLiked = initialPost.likes?.some(like => {
        const lId = like._id || like;
        return lId === userId;
      });
      setLikedPosts({ [initialPost._id]: !!isLiked });
    }
  }, [initialPost, user]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const updateUI = (updatedData) => {
    setPost(updatedData);
    if (activeCommentsPost) setActiveCommentsPost(updatedData);
  };

  const imageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    const base = API_BASE.replace("/api", "").replace(/\/$/, "");
    return `${base}${img.startsWith("/") ? img : `/${img}`}`;
  };

  const getAvatar = (src, username, size = 8) => {
    const initials = username?.charAt(0).toUpperCase() || "U";
    const sizeClass = `w-${size} h-${size}`;
    if (src) return <img src={src} className={`${sizeClass} rounded-full object-cover`} alt="" />;
    return (
      <div className={`${sizeClass} rounded-full bg-black text-white flex items-center justify-center text-xs font-bold`}>
        {initials}
      </div>
    );
  };

  // --- Dashboard Logic Handlers ---
  const handleLike = async (p) => {
    const wasLiked = likedPosts[p._id];
    setLikedPosts(prev => ({ ...prev, [p._id]: !wasLiked }));
    try {
      const res = await axios.put(`${API_BASE}/posts/${p._id}/like`, {}, getAuthHeaders());
      updateUI(res.data);
    } catch (err) {
      setLikedPosts(prev => ({ ...prev, [p._id]: wasLiked }));
    }
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    try {
      await axios.post(`${API_BASE}/posts/${postId}/comment`, { text }, getAuthHeaders());
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      const res = await axios.get(`${API_BASE}/posts/${postId}`, getAuthHeaders());
      updateUI(res.data);
    } catch (err) { console.error(err); }
    finally { setCommentLoading(prev => ({ ...prev, [postId]: false })); }
  };

  const handleLikeComment = async (postId, commentId) => {
    try {
      const res = await axios.put(`${API_BASE}/posts/${postId}/comments/${commentId}/like`, {}, getAuthHeaders());
      updateUI(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddRecomment = async (postId, commentId) => {
    const key = `${postId}-${commentId}`;
    const text = recommentInputs[key];
    if (!text?.trim()) return;
    try {
      await axios.post(`${API_BASE}/posts/${postId}/comments/${commentId}/recomment`, { text }, getAuthHeaders());
      setRecommentInputs(prev => ({ ...prev, [key]: "" }));
      const res = await axios.get(`${API_BASE}/posts/${postId}`, getAuthHeaders());
      updateUI(res.data);
    } catch (err) { console.error(err); }
  };

  if (!post) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 mb-4">
      {/* Original Header Design */}
      <div className="flex justify-between items-center mb-3">
        <Link href={`/profile/${post.author?.username}`}>
  <div className="flex items-center space-x-3 hover:opacity-80 transition">
    {getAvatar(
      imageUrl(post.author?.profilePicture),
      post.author?.username,
      8
    )}
    <span className="font-semibold hover:underline">
      {post.author?.username}
    </span>
  </div>
</Link>
        <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
      </div>

      <p className="mb-2 text-sm dark:text-gray-200">{post.content}</p>

      {post.images?.length > 0 ? (
        <PostCarousel images={post.images} />
      ) : post.image ? (
        <img src={post.image} className="rounded-md w-full object-cover" alt="" />
      ) : null}

      {/* Action Icons */}
      <div className="flex items-center mt-2 text-gray-600 w-full relative">
        <div className="flex items-center space-x-4">
          <button onClick={() => handleLike(post)} className="flex flex-col items-center">
            {likedPosts[post._id] ? <FaHeart className="w-5 h-5 text-red-500" /> : <FiHeart className="w-5 h-5" />}
            <span className="text-xs mt-1">{post.likes?.length || 0}</span>
          </button>
          
          <button onClick={() => setLikesListOpenFor(likesListOpenFor === post._id ? null : post._id)} className="text-sm underline">
            View likers
          </button>

          <div className="flex items-center space-x-1">
            <FiMessageCircle className="w-5 h-5" />
            <span>{post.comments?.length || 0}</span>
          </div>
        </div>

        {post.author?._id === user?._id && (
          <div className="ml-auto relative">
            <button onClick={() => setMenuOpenFor(menuOpenFor === post._id ? null : post._id)} className="p-1 hover:bg-gray-200 rounded-full">
              <FiMoreHorizontal className="w-5 h-5" />
            </button>
            {menuOpenFor === post._id && (
              <div className="absolute right-0 mt-2 w-24 bg-white border rounded shadow-md z-50">
                <button 
                  onClick={async () => {
                    if(confirm("Delete?")) {
                      await axios.delete(`${API_BASE}/posts/${post._id}`, getAuthHeaders());
                      router.push("/dashboard");
                    }
                  }} 
                  className="w-full text-left px-3 py-1 text-red-500 text-sm hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Original Inline Comments Style */}
      <div className="mt-3 space-y-2">
        {post.comments?.slice(0, 1).map((c, i) => (
          <div key={i} className="flex items-start space-x-2 border border-gray-200 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            {getAvatar(imageUrl(c.user?.profilePicture), c.user?.username, 8)}
            <div className="flex flex-col">
              <span className="font-semibold text-sm dark:text-gray-300">{c.user?.username}</span>
              <p className="text-gray-700 text-sm pl-2 mt-1 border-l-2 border-purple-200 dark:text-gray-100">{c.text}</p>
            </div>
          </div>
        ))}
        
        {post.comments?.length > 1 && (
          <button onClick={() => setActiveCommentsPost(post)} className="text-xs text-purple-600">
            View all {post.comments.length} comments
          </button>
        )}

        <div className="flex items-center space-x-2 mt-2">
          <input 
            type="text" 
            value={commentInputs[post._id] || ""} 
            onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
            placeholder="Add a comment..." 
            className="flex-1 border rounded-md p-2 text-sm dark:bg-gray-800 dark:text-white"
          />
          <button onClick={() => handleComment(post._id)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">
            Post
          </button>
        </div>
      </div>

      {/* Original Enhanced Comments Modal */}
      {activeCommentsPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md max-h-[80vh] overflow-y-auto rounded-lg p-4 relative shadow-lg">
            <button onClick={() => setActiveCommentsPost(null)} className="absolute top-2 right-2 dark:text-white"><FiX className="w-5 h-5" /></button>
            <h2 className="font-bold text-lg mb-4 dark:text-white">Comments ({post.comments?.length || 0})</h2>
            
            <div className="space-y-4">
              {post.comments?.map((comment) => (
                <div key={comment._id} className="border-b pb-3 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    {getAvatar(imageUrl(comment.user?.profilePicture), comment.user?.username, 8)}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm dark:text-gray-300">{comment.user?.username}</span>
                        <button onClick={() => handleLikeComment(post._id, comment._id)} className="flex items-center space-x-1">
                          {comment.likes?.some(l => (l._id || l) === (user?._id || user?.id)) ? <FaHeart className="text-red-500 w-3 h-3" /> : <FiHeart className="w-3 h-3" />}
                          <span className="text-xs">{comment.likeCount || 0}</span>
                        </button>
                      </div>
                      <p className="text-gray-700 text-sm mt-1 dark:text-gray-100">{comment.text}</p>
                      
                      <button 
                        onClick={() => setExpandedComments(p => ({ ...p, [comment._id]: !p[comment._id] }))}
                        className="text-xs text-purple-600 mt-2"
                      >
                        {comment.recommentCount || 0} Recomments
                      </button>

                      {expandedComments[comment._id] && (
                        <div className="mt-3 ml-4 pl-3 border-l-2 border-gray-300">
                          {comment.recomments?.map((re) => (
                            <div key={re._id} className="flex items-start space-x-2 mb-2">
                              {getAvatar(imageUrl(re.user?.profilePicture), re.user?.username, 6)}
                              <div className="flex-1">
                                <span className="font-semibold text-xs dark:text-gray-400">{re.user?.username}</span>
                                <p className="text-xs dark:text-gray-200">{re.text}</p>
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <input 
                              type="text" 
                              value={recommentInputs[`${post._id}-${comment._id}`] || ""}
                              onChange={(e) => setRecommentInputs({ ...recommentInputs, [`${post._id}-${comment._id}`]: e.target.value })}
                              placeholder="Write a recomment..."
                              className="flex-1 border rounded p-1 text-xs dark:bg-gray-900 dark:text-white"
                            />
                            <button onClick={() => handleAddRecomment(post._id, comment._id)} className="bg-purple-600 text-white px-2 py-1 rounded text-xs">Post</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

