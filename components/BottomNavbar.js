"use client";
import React from "react";
import { FiHome, FiSearch, FiPlusCircle, FiUser, FiFilm } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function BottomNavbar() {
  const { user, loading } = useAuth();


  if (loading) return null;


  const username = user?.username || "";

  const handleComingSoon = (page) => {
    alert(`${page} page is still in development. This feature will be updated soon!`);
  };

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0
        flex justify-around items-center
        py-2 bg-white/80 backdrop-blur-xl
        border-t border-gray-300
        z-50
      "
    >
      {/* Home */}
      <Link href="/dashboard">
  <div className="flex flex-col items-center">
    <FiHome className="w-6 h-6" />
    <span className="text-xs mt-1">Home</span>
  </div>
</Link>

      {/* Explore */}
      <button
        onClick={() => handleComingSoon("Explore")}
        className="flex flex-col items-center"
      >
        <FiSearch className="w-6 h-6" />
        <span className="text-xs mt-1">Explore</span>
      </button>

      {/* Post */}
      <button
        onClick={() => handleComingSoon("Post")}
        className="
          bg-purple-600 p-3 rounded-full text-white
          -mt-8 shadow-lg
        "
      >
        <FiPlusCircle className="w-7 h-7" />
      </button>

      {/* Reels */}
      <button
        onClick={() => handleComingSoon("Reels")}
        className="flex flex-col items-center"
      >
        <FiFilm className="w-6 h-6" />
        <span className="text-xs mt-1">Reels</span>
      </button>

      {/* Profile */}
      <Link href={`/profile/${username}`}>
  <div className="flex flex-col items-center">
    <FiUser className="w-6 h-6" />
    <span className="text-xs mt-1">Profile</span>
  </div>
</Link>	
    </div>
  );
}
