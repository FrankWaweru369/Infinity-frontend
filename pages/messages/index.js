import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import config from "../../src/config";

const API_BASE = config.apiUrl;

export default function MessagesInbox() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [showChatPicker, setShowChatPicker] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);

  const router = useRouter();

  // Load token safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  // Fetch inbox
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


  // Avatar helper
  const getAvatar = (url, name) => {
    if (url && url.startsWith("http")) return url;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "User"
    )}&background=7c3aed&color=fff`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading messages...
      </div>
    );
  }
const getUserIdFromToken = () => {
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1]))?.id;
  } catch {
    return null;
  }
};

const currentUserId = getUserIdFromToken();
  return (
    <>
      {/* Header */}
<div className="sticky top-0 z-30 px-4 py-4 flex items-center gap-3 shadow-md bg-white dark:bg-gray-900">

  <button
    onClick={() => router.back()}
    className="text-2xl font-bold text-gray-700 dark:text-gray-200 hover:text-purple-600 transition"
  >
    ←
  </button>

  <h1 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 tracking-wide">
    Messages
  </h1>

</div>

      {/* Messages List */}
      <div className="p-4 space-y-3">
        {conversations.length > 0 ? (
          conversations.map((msg) => {
            const otherUser =
  msg.sender?._id === currentUserId
    ? msg.receiver
    : msg.sender;

const isUnread =
  !msg.seen &&
  msg.sender?._id !== currentUserId;

            return (
              <Link
                key={msg._id}
                href={`/messages/${otherUser?._id}`}
              >
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer">

                  {/* Avatar */}
                  <img
                    src={getAvatar(
                      otherUser?.profilePicture,
                      otherUser?.username
                    )}
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover bg-gray-200"
                  />

                  {/* Message preview */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        isUnread
                          ? "font-bold text-black dark:text-white"
                          : "font-semibold text-gray-800 dark:text-white"
                      }`}
                    >
                      {otherUser?.username || "Unknown"}
                    </p>

                    <p
                      className={`text-xs truncate ${
                        isUnread
                          ? "font-bold text-gray-800 dark:text-gray-200"
                          : "text-gray-500"
                      }`}
                    >
                      {msg.text}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {/* Unread dot */}
{isUnread && (
  <span className="mt-1 px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full">
    NEW
  </span>
)}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="text-center text-gray-500 py-6">
            No messages yet
          </p>
        )}
      </div>

      {/* Floating New Chat Button */}
      <button
  onClick={async () => {

    try {
      const res = await axios.get(
        `${API_BASE}/users/chat-connections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setChatUsers(res.data);
      setShowChatPicker(true);
    } catch (err) {

      console.error(err);
    }
  }}
  className="fixed bottom-5 right-5 bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-purple-700 transition z-40"
>
  + Message
</button>

      {/* Chat Picker Modal */}
      {showChatPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:w-96 max-h-[70vh] overflow-y-auto p-4 shadow-xl">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg dark:text-white">
                Start a Message
              </h2>

              <button
                onClick={() => setShowChatPicker(false)}
                className="text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Users List */}
            {chatUsers.length > 0 ? (
              chatUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => {
                    router.push(`/messages/${u._id}`);
                    setShowChatPicker(false);
                  }}
                  className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">

                    {/* Avatar */}
                    <img
                      src={getAvatar(u.profilePicture, u.username)}
                      alt={u.username}
                      className="w-10 h-10 rounded-full object-cover bg-gray-200"
                    />

                    {/* Username */}
                    <div className="text-left">
                      <p className="font-medium dark:text-white">
                        {u.username}
                      </p>

                      {u.isMutual && (
                        <p className="text-xs text-purple-600">
                          Mutual connection
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">
                No connections available
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
