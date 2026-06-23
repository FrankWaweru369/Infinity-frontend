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
  const [sending, setSending] = useState(false);

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

 const getAvatar = (url, name, userId = null) => {

  // Check cache first
  if (
    userId &&
    typeof window !== "undefined"
  ) {
    const cached = localStorage.getItem(
      `infinity_avatar_${userId}`
    );

    if (cached) {
      return cached;
    }
  }


  // Use real avatar and cache it
  if (url && url.startsWith("http")) {

    if (
      userId &&
      typeof window !== "undefined"
    ) {
      localStorage.setItem(
        `infinity_avatar_${userId}`,
        url
      );
    }

    return url;
  }


  // Fallback avatar
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=7c3aed&color=fff`;
}; 

const saveMessagesCache = (id, data) => {
  if (!id) return;

  localStorage.setItem(
    `infinity_messages_${id}`,
    JSON.stringify({
      messages: data,
      savedAt: Date.now()
    })
  );
};


const getMessagesCache = (id) => {
  if (!id) return null;

  const cached = localStorage.getItem(
    `infinity_messages_${id}`
  );

  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached);

    // optional expiry: 24 hours
    if (
      Date.now() - parsed.savedAt >
      86400000
    ) {
      localStorage.removeItem(
        `infinity_messages_${id}`
      );
      return null;
    }

    return parsed.messages;

  } catch {
    return null;
  }
};

const saveUserCache = (id, user) => {
  if (!id || !user) return;

  localStorage.setItem(
    `infinity_chat_user_${id}`,
    JSON.stringify(user)
  );
};


const getUserCache = (id) => {
  if (!id || typeof window === "undefined") return null;

  const cached = localStorage.getItem(
    `infinity_chat_user_${id}`
  );

  return cached ? JSON.parse(cached) : null;
};

  // 📥 FIXED FETCH (CRITICAL FIX HERE)
  const fetchMessages = async () => {
  if (!token || !userId) return;

  try {

    // ⚡ Load cached messages first
    const cached = getMessagesCache(userId);

    if (cached) {
      setMessages(cached);
    }

const cachedUser = getUserCache(userId);

if (cachedUser) {
  setOtherUser(cachedUser);
}

    const res = await fetch(`${API_BASE}/messages/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });


    const data = await res.json();


    // ✅ FIX: handle BOTH array and object responses
    const msgs = Array.isArray(data)
      ? data
      : Array.isArray(data.messages)
      ? data.messages
      : [];


    if (data?.user) {

  setOtherUser(data.user);

  saveUserCache(
    userId,
    data.user
  );

}


    if (data?.presence) {
      setPresence(data.presence);
    }


    // Fresh server messages
    setMessages(msgs);


    // 💾 Save latest messages to cache
    saveMessagesCache(
      userId,
      msgs
    );


    // 👤 optional user + presence (safe fallback)
    if (data.user) {

      setOtherUser(data.user);

    } else if (msgs.length > 0) {

      const first = msgs[0];

      const user =
        first.sender?._id?.toString() ===
        currentUserId?.toString()
          ? first.receiver
          : first.sender;


      setOtherUser(user);

saveUserCache(
  userId,
  user
);
    }


    // 🔽 auto scroll fix
    const last = msgs[msgs.length - 1];

    if (
      last &&
      last._id !== lastMsgRef.current
    ) {

      lastMsgRef.current = last._id;


      setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);

    }


  } catch (err) {

    console.error(
      "Fetch error:",
      err
    );

  }
};

  const handleSend = async () => {
  const messageText = text.trim();

  if (!messageText || sending) return;

  setSending(true);

  const tempMessage = {
    _id: `temp-${Date.now()}`,
    text: messageText,
    createdAt: new Date(),
    sender: {
      _id: currentUserId,
    },
    pending: true,
  };


  // show instantly
  setMessages((prev) => {

  const updated = [
    ...prev,
    tempMessage,
  ];

  saveMessagesCache(
    userId,
    updated
  );

  return updated;
});

  // clear input immediately
  setText("");


  try {

    const res = await fetch(
      `${API_BASE}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: userId,
          text: messageText,
        }),
      }
    );


    const newMsg = await res.json();


    if (!res.ok) {
      throw new Error(
        newMsg.message || "Failed"
      );
    }


    // replace temporary message
   setMessages((prev) => {

  const updated = prev.map((msg) =>
    msg._id === tempMessage._id
      ? {
          ...newMsg,
          sender: newMsg.sender || {
            _id: currentUserId,
          },
          createdAt:
            newMsg.createdAt || new Date(),
        }
      : msg
  );


  saveMessagesCache(
    userId,
    updated
  );


  return updated;
}); 


    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);


  } catch (err) {

    console.error(err);


    // remove failed message
    setMessages((prev) => {

  const updated = prev.filter(
    (msg) =>
      msg._id !== tempMessage._id
  );


  saveMessagesCache(
    userId,
    updated
  );


  return updated;
});


    // return text back
    setText(messageText);

  } finally {

    setSending(false);

  }
}

const markSeen = async () => {
  if (!token || !userId) return;

  try {
    await fetch(
      `${API_BASE}/messages/seen/${userId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (err) {
    console.error("Mark seen error:", err);
  }
};

  useEffect(() => {
  if (token && userId) {

    markSeen();

    fetchMessages();

    const interval = setInterval(
      fetchMessages,
      4000
    );

    return () => clearInterval(interval);
  }
}, [token, userId]);


const formatLastActive = (date) => {
  if (!date) return "a while ago";

  const seconds = Math.floor(
    (new Date() - new Date(date)) / 1000
  );

  if (seconds < 60) {
    return "just now";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  return `${Math.floor(seconds / 86400)}d ago`;
};


const formatMessageTime = (date) => {
  const messageDate = new Date(date);
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const messageDay = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );

  const time = messageDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Today
  if (messageDay.getTime() === today.getTime()) {
    return time;
  }

  // Yesterday
  if (messageDay.getTime() === yesterday.getTime()) {
    return `Yesterday • ${time}`;
  }

  // Older
  return `${messageDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })} • ${time}`;
};

const getCachedAvatar = (userId, avatarUrl) => {
  if (!userId) return avatarUrl;

  const key = `infinity_avatar_${userId}`;

  const cached = localStorage.getItem(key);

  if (cached) {
    return cached;
  }

  if (avatarUrl) {
    localStorage.setItem(key, avatarUrl);
    return avatarUrl;
  }

  return "";
};

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

    <div className="flex items-center gap-3">

      {/* Avatar */}
     <img
  src={getAvatar(
    otherUser?.profilePicture,
    otherUser?.username,
    otherUser?._id
  )}
  alt={otherUser?.username || "User"}
  className="w-10 h-10 rounded-full object-cover bg-gray-200"
/> 

      {/* Username + Status */}
      <div className="min-w-0">
        <p className="font-bold text-[15px] text-purple-600 dark:text-purple-400 truncate">
          {otherUser?.username || "Unknown"}
        </p>

      <p className="text-xs text-gray-500">
  {presence?.isOnline ? (
    <span className="text-green-500 font-medium">
      ● Online
    </span>
  ) : presence?.lastActive ? (
    `Last active ${formatLastActive(
      presence.lastActive
    )}`
  ) : (
    "Loading activity..."
  )}
</p> 
      </div>

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
    msg.sender?.username,
    msg.sender?._id
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

               <span
  className={`text-[10px] mt-1 ${
    isMe
      ? "self-end text-black dark:text-gray-200"
      : "self-start text-gray-700 dark:text-gray-300"
  }`}
>
  {formatMessageTime(msg.createdAt)}
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
  disabled={sending}
  className={`px-5 py-2 rounded-full text-white ${
    sending
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-purple-600 hover:bg-purple-700"
  }`}
>
  {sending ? "Sending..." : "Send"}
</button>

      </div>
    </div>
  );
}
