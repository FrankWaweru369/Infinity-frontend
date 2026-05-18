import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import config from "../../src/config";

const API_BASE = config.apiUrl;

export default function ChatPage() {
  const router = useRouter();
  const { userId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [token, setToken] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [presence, setPresence] = useState(null);

  const bottomRef = useRef(null);
  const lastMsgRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  const currentUserId = (() => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1]))?.id;
    } catch {
      return null;
    }
  })();

  const getAvatar = (url, name) => {
    if (url && url.startsWith("http")) return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "User"
    )}&background=7c3aed&color=fff`;
  };

  const formatLastActive = (date) => {
    if (!date) return "unknown";

    const diff = (Date.now() - new Date(date)) / 1000;

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // 📥 FIXED FETCH (CRITICAL FIX HERE)
  const fetchMessages = async () => {
    if (!token || !userId) return;

    try {
      const res = await fetch(`${API_BASE}/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      // ✅ FIX: handle BOTH array and object responses
      const msgs = Array.isArray(data)
        ? data
        : Array.isArray(data.messages)
        ? data.messages
        : [];

      setMessages(msgs);

      // 👤 optional user + presence (safe fallback)
      if (data.user) {
        setOtherUser(data.user);
        setPresence({
          isOnline: data.user.isOnline,
          lastActive: data.user.lastActive,
        });
      } else if (msgs.length > 0) {
        const first = msgs[0];
        const user =
          first.sender?._id === currentUserId
            ? first.receiver
            : first.sender;

        setOtherUser(user);
      }

      // 🔽 auto scroll fix
      const last = msgs[msgs.length - 1];
      if (last && last._id !== lastMsgRef.current) {
        lastMsgRef.current = last._id;

        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: userId,
          text,
        }),
      });

      const newMsg = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, newMsg]);
        setText("");

        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token && userId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [token, userId]);

  return (
    <div className="h-screen bg-white dark:bg-black">

      {/* 🔝 HEADER */}
      <div className="fixed top-0 left-0 right-0 h-16 flex items-center gap-3 px-3 border-b dark:border-gray-800 bg-white dark:bg-black z-20">

        <button
          onClick={() => router.back()}
          className="text-purple-600 text-2xl font-bold px-3 py-2 rounded-full hover:bg-purple-100 dark:hover:bg-gray-800"
        >
          ←
        </button>

        {otherUser && (
          <>
            <img
              src={getAvatar(otherUser.profilePicture, otherUser.username)}
              className="w-10 h-10 rounded-full"
            />

            <div>
              <p className="font-semibold text-sm dark:text-white">
                {otherUser.username}
              </p>

              <p className="text-xs text-gray-500">
                {presence?.isOnline ? (
                  <span className="text-green-500">● Online</span>
                ) : (
                  `Last active ${formatLastActive(presence?.lastActive)}`
                )}
              </p>
            </div>
          </>
        )}
      </div>

      {/* 💬 MESSAGES */}
      <div className="absolute top-16 bottom-16 left-0 right-0 overflow-y-auto p-4 space-y-3">

        {messages.map((msg) => {
          const isMe = msg.sender?._id === currentUserId;

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-2 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >

              {!isMe && (
                <img
                  src={getAvatar(
                    msg.sender?.profilePicture,
                    msg.sender?.username
                  )}
                  className="w-6 h-6 rounded-full"
                />
              )}

              <div className="flex flex-col max-w-xs">

                <div
                  className={`px-4 py-2 rounded-2xl text-sm shadow
                  ${
                    isMe
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-800 dark:text-white"
                  }`}
                >
                  {msg.text}
                </div>

                <span className="text-[10px] text-gray-400 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ⌨ INPUT */}
      <div className="fixed bottom-0 left-0 right-0 h-16 flex items-center gap-2 px-3 border-t dark:border-gray-800 bg-white dark:bg-black z-20">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:border-gray-700"
        />

        <button
          onClick={handleSend}
          className="bg-purple-600 text-white px-5 py-2 rounded-full"
        >
          Send
        </button>

      </div>
    </div>
  );
}
