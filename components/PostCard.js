import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiHeart, FiMessageCircle, FiMoreHorizontal, FiX } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const PostCard = ({ 
  post, 
  currentUser, 
  getAvatar, 
  onLike, 
  onComment, 
  onEdit, 
  onDelete, 
  imageUrl,
  commentInputs = {},
  setCommentInputs,
  commentLoading = {}
}) => {
  const [likesListOpenFor, setLikesListOpenFor] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLikesList = (postId) => {
    setLikesListOpenFor(likesListOpenFor === postId ? null : postId);
  };

  const handleCommentSubmit = (postId) => {
    if (onComment && commentInputs[postId]?.trim()) {
      onComment(postId, commentInputs[postId]);
    }
  };

  return (
    <>
      {/* Post Card */}
      <div key={post._id} className="bg-white rounded-lg shadow-sm p-4 mb-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <Link
            href={`/profile/${post.author?.username}`}
            className="flex items-center space-x-3 hover:opacity-80 transition"
          >
            {getAvatar(imageUrl(post.author?.profilePicture), post.author?.username, 8)}
            <span className="font-semibold hover:underline">
              {post.author?.username}
            </span>
          </Link>
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
              onClick={() => onLike?.(post)}
              className="flex items-center space-x-1"
            >
              {post.likes?.some((u) => u._id === currentUser?._id) ? (
                <FaHeart className="w-5 h-5 text-red-500" />
              ) : (
                <FiHeart className="w-5 h-5" />
              )}
              <span>{post.likes?.length || 0}</span>
            </button>

            {/* Clickable count opens list */}
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
                      <Link
                        key={u._id}
                        href={`/profile/${u.username}`}
                        className="flex items-center space-x-2 mb-2 hover:opacity-80 transition"
                      >
                        {getAvatar(imageUrl(u.profilePicture), u.username, 6)}
                        <span className="text-sm hover:underline">{u.username}</span>
                      </Link>
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

            {/* Comment count */}
            <div className="flex items-center space-x-1">
              <FiMessageCircle className="w-5 h-5" />
              <span>{post.comments?.length || 0}</span>
            </div>
          </div>

          {/* Three-dot menu only on the right */}
          {post.author?._id === currentUser?._id && (
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
                    onClick={() => onEdit?.(post)}
                    className="w-full text-left px-3 py-1 text-blue-500 text-sm hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete?.(post._id)}
                    className="w-full text-left px-3 py-1 text-red-500 text-sm hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comments Section */}
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
                    <Link href={`/profile/${c.user.username}`}>
                      {getAvatar(avatarSrc, username, 8)}
                    </Link>

                    {/* Username + Comment */}
                    <div className="flex flex-col">
                      <Link
                        href={`/profile/${c.user.username}`}
                        className="font-semibold text-sm hover:underline text-gray-800"
                      >
                        {username}
                      </Link>
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
              value={commentInputs[post._id] || ''}
              onChange={(e) =>
                setCommentInputs({
                  ...commentInputs,
                  [post._id]: e.target.value,
                })
              }
              placeholder="Add a comment..."
              className="flex-1 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
            />
            <button
              onClick={() => handleCommentSubmit(post._id)}
              disabled={commentLoading[post._id] || !commentInputs[post._id]?.trim()}
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
                  className="flex items-start space-x-2 border border-gray-200 rounded-lg p-3 bg-gray-50 mb-2"
                >
                  {/* Avatar */}
                  <Link href={`/profile/${c.user.username}`}>
                    {getAvatar(avatarSrc, username, 8)}
                  </Link>

                  {/* Username + Comment */}
                  <div className="flex flex-col">
                    <Link
                      href={`/profile/${c.user.username}`}
                      className="font-semibold text-sm hover:underline text-gray-800"
                    >
                      {username}
                    </Link>
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
    </>
  );
};

export default PostCard;
