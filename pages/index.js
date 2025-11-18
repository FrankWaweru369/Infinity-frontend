// pages/index.js
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-infinityBlue via-infinityPurple to-infinityPink text-white">
      <h1 className="text-5xl font-bold mb-4">Welcome to Infinity</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        Beyond the scroll, real connections are made.<br></br>
Click register or login to continue.
      </p>

      <div className="flex space-x-4">
        <a
          href="/login"
          className="px-6 py-2 rounded-lg bg-white text-infinityBlue font-semibold hover:bg-gray-200 transition"
        >
          Login
        </a>
        <a
          href="/register"
          className="px-6 py-2 rounded-lg bg-infinityPink text-white font-semibold hover:bg-pink-500 transition"
        >
          Register
        </a>
      </div>
    </div>
  );
}
