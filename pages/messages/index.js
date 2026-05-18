import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import config from '../../src/config';

const API_BASE = config.apiUrl;

export default function MessagesInbox() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const router = useRouter();

  // 🔐 Safe token loading (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  // 📥 Fetch inbox
  const fetchInbox = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load inbox");
      }

      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Inbox error:", err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInbox();
    }
  }, [token]);

  // 🧠 Get current user id from token safely
  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1]))?.id;
    } catch {
      return null;
    }
  };

	const getAvatar = (url, name) => {
  if (url && url.startsWith("http")) return url;

  // fallback: initials avatar
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=7c3aed&color=fff`;
};

  const currentUserId = getUserIdFromToken();

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4">
      {/* Header */}
      <h1 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Messages
      </h1>

      {/* Loading state */}
      {loading && (
        <p className="text-sm text-gray-500">Loading conversations...</p>
      )}

      {/* Empty state */}
      {!loading && conversations.length === 0 && (
        <p className="text-sm text-gray-500">No conversations yet</p>
      )}

      {/* Conversations list */}
      <div className="space-y-3">
        {conversations.map((msg) => {
          const otherUser =
            msg.sender?._id === currentUserId
              ? msg.receiver
              : msg.sender;

          return (
            <Link
              key={msg._id}
              href={`/messages/${otherUser?._id}`}
            >
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer">

                {/* Avatar */}
                <img
  src={getAvatar(otherUser?.profilePicture, otherUser?.username)}
  alt="avatar"
  className="w-10 h-10 rounded-full object-cover bg-gray-200"
/>

                {/* Message preview */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 dark:text-white">
                    {otherUser?.username || "Unknown"}
                  </p>

                  <p className="text-xs text-gray-500 truncate">
                    {msg.text}
                  </p>
                </div>

                {/* Time */}
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Floating new chat button */}
      <button
        onClick={() => {
          const id = prompt("Enter user ID to message:");
          if (id) router.push(`/messages/${id}`);
        }}
        className="fixed bottom-5 right-5 bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-purple-700 transition"
      >
        + Message
      </button>
    </div>
  );
}
