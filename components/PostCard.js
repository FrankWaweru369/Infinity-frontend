// components/PostCard.js
import { FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";

export default function PostCard({ user, content, image }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-4">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-10 h-10 rounded-full border border-gray-300"
        />
        <div>
          <h3 className="font-semibold text-gray-800">{user.name}</h3>
          <p className="text-sm text-gray-500">2h ago</p>
        </div>
      </div>

      {/* Post Content */}
      <div>
        <p className="text-gray-700">{content}</p>
        {image && (
          <img
            src={image}
            alt="post"
            className="mt-3 rounded-xl w-full object-cover max-h-80"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between text-gray-500 pt-2 border-t border-gray-200">
        <button className="flex items-center gap-1 hover:text-infinity-dark">
          <FiHeart /> <span>Like</span>
        </button>
        <button className="flex items-center gap-1 hover:text-infinity-dark">
          <FiMessageCircle /> <span>Comment</span>
        </button>
        <button className="flex items-center gap-1 hover:text-infinity-dark">
          <FiShare2 /> <span>Share</span>
        </button>
      </div>
    </div>
  );
}
