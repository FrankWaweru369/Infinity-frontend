import { useEffect, useState, useRef } from "react";
import { FiBell } from "react-icons/fi";
import axios from "axios";
import config from "../src/config";

const API_BASE = config.apiUrl;

export default function Notifications({ token }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);

  // Detect mobile vs desktop
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch notifications when dropdown/panel opens
  useEffect(() => {
    if (!open || !token) return;

    axios
      .get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setNotifications(res.data.notifications || []))
      .catch(err => console.error("Failed to fetch notifications:", err));
  }, [open, token]);

  // Desktop dropdown position
  const rect = bellRef.current?.getBoundingClientRect();

  return (
    <>
      {/* 🔔 Bell */}
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className="relative text-gray-700 dark:text-gray-200 hover:opacity-80 transition"
      >
        <FiBell size={22} />
        {/* Unread badge */}
        {notifications.some(n => !n.isRead) && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {/* 🔽 Panel / Dropdown */}
      {open && (
        isMobile ? (
          /* MOBILE: Full-page slide-down panel */
          <div className="fixed inset-x-0 top-16 z-[9999] bg-white dark:bg-gray-900 shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-lg">
              Notifications
            </div>

            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No notifications yet
              </p>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <span className="font-medium">{n.sender?.username}</span>{" "}
                  {n.message}
                </div>
              ))
            )}
          </div>
        ) : (
          /* DESKTOP: Dropdown below bell */
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
                notifications.map(n => (
                  <div
                    key={n._id}
                    className="px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <span className="font-medium">{n.sender?.username}</span>{" "}
                    {n.message}
                  </div>
                ))
              )}
            </div>
          )
        )
      )}
    </>
  );
}
