import { useTheme } from '../context/ThemeContext';
import { useState } from "react";
import { useRouter } from "next/router";
import config from '../src/config';

export default function Login() {
  const { isDarkMode } = useTheme(); // Add dark mode support
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const subscribeUserToPush = async (token) => {
  try {
    if (!("serviceWorker" in navigator)) return;

    await navigator.serviceWorker.register("/sw.js");
    const registration = await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    await fetch(`${config.apiUrl}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });
  } catch (err) {
    console.error("Push subscription failed:", err.message);
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${config.apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Save token + user in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      await subscribeUserToPush(data.token);

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-infinityBgDark">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md w-96 space-y-4"
      >
        <h1 className="text-xl font-bold text-center text-gray-800 dark:text-infinityTextDark">Login</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 dark:border-infinityBorderDark rounded p-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-infinityTextDark"
          required
        />

<div className="relative w-full">
  <input
    type={showPassword ? "text" : "password"}
    name="password"
    placeholder="Password"
    value={form.password}
    onChange={handleChange}
    className="w-full border border-gray-300 dark:border-infinityBorderDark rounded p-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-infinityTextDark pr-12"
    required
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-sm text-gray-600 select-none"
  >
    {showPassword ? "Hide" : "Show"}
  </span>
</div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
	  <p className="text-center text-sm text-gray-600 dark:text-infinityTextSecondaryDark">
  Don't have an account?{" "}
  <span
    onClick={() => router.push("/register")}
    className="text-purple-600 cursor-pointer font-semibold hover:underline"
  >
    Register
  </span>
</p>
      </form>
    </div>
  );
}
