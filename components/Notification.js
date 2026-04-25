import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { FiBell } from "react-icons/fi";
import axios from "axios";
import config from "../src/config";
import Avatar from "./Avatar";

const API_BASE = config.apiUrl;

export default function Notifications({ token }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); // ✅ NEW
  const bellRef = useRef(null);
  const router = useRouter();

  // Detect mobile vs desktop
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Fetch unread count on load (fix red dot)
  useEffect(() => {
    if (!token) return;

    const fetchUnread = async () => {
      try {
        const res = await axios.get(`${API_BASE}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUnreadCount(res.data.count);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUnread();
  }, [token]);

  // ✅ Fetch notifications + mark as read when opened
  useEffect(() => {
    if (!open || !token) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_BASE}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNotifications(res.data.notifications || []);

        // Mark all as read
        await axios.patch(
          `${API_BASE}/notifications/read-all`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
  }, [open, token]);

  // Desktop dropdown position
  const rect = bellRef.current?.getBoundingClientRect();

const handleNotificationClick = async (notification) => {
  try {
    await axios.patch(
      `${API_BASE}/notifications/${notification._id}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setNotifications(prev =>
      prev.map(n =>
        n._id === notification._id ? { ...n, isRead: true } : n
      )
    );

    setOpen(false);

    if (
      (notification.type === "LIKE" || notification.type === "COMMENT") &&
      notification.post?._id
    ) {
      router.push(`/post/${notification.post._id}`);
      return;
    }

    if (
      notification.type === "FOLLOW" &&
      notification.sender?.username
    ) {
      router.push(`/profile/${notification.sender.username}`);
      return;
    }

    router.push("/dashboard");
  } catch (err) {
    console.error("Failed to open notification:", err);
  }
};

  return (
    <>
      {/* 🔔 Bell */}
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className="relative text-gray-700 dark:text-gray-200 hover:opacity-80 transition"
      >
        <FiBell size={22} />

        {/* ✅ Red badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[10px] flex items-center justify-center bg-red-500 text-white rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 🔽 Panel / Dropdown */}
      {open &&
        (isMobile ? (
          /* MOBILE */
          <div className="fixed inset-x-0 top-16 z-[9999] bg-white dark:bg-gray-900 shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-lg">
              Notifications
            </div>

            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <div
  key={n._id}
  onClick={() => handleNotificationClick(n)}
  className={`flex items-center gap-3 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
    !n.isRead ? "bg-purple-50 dark:bg-gray-800" : ""
  }`}
>
                  {/* Avatar */}
                  <Avatar
                    src={n.sender?.profilePicture}
                    username={n.sender?.username}
                    size={40}
                  />

                  {/* Message */}
                  <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">
                      {n.sender?.username}
                    </span>{" "}
                    {n.type === "LIKE" && "liked your post"}
                    {n.type === "COMMENT" && "commented on your post"}
                    {n.type === "FOLLOW" && "started following you"}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* DESKTOP */
          rect && (
            <div
              className="fixed z-[9999] w-80 bg-white dark:bg-gray-900 shadow-lg rounded-lg max-h-[400px] overflow-y-auto"
              style={{
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
              }}
            >
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold">
                Notifications
              </div>

              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
                      !n.read ? "bg-purple-50 dark:bg-gray-800" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <img
                      src={n.sender?.profilePicture || "/default-avatar.png"}
                      alt={n.sender?.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />

                    {/* Message */}
                    <div className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-semibold">
                        {n.sender?.username}
                      </span>{" "}
                      {n.type === "LIKE" && "liked your post"}
                      {n.type === "COMMENT" && "commented on your post"}
                      {n.type === "FOLLOW" && "started following you"}
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        ))}
    </>
  );
}
