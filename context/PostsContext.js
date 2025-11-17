import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import config from '../src/config';

const PostsContext = createContext();

export function PostsProvider({ children }) {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);

  // 🧩 Fetch posts from backend
  useEffect(() => {
    if (!token) return;
    fetch(`${config.apiUrl}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error loading posts:", err));
  }, [token]);

  // ➕ Create new post
  const addPost = async (content) => {
    if (!token) return;
    const res = await fetch(`${config.apiUrl}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok) setPosts((prev) => [data.post, ...prev]);
  };

  // ❤️ Like/unlike
  const toggleLike = async (postId) => {
    if (!token) return;
    const res = await fetch(`${config.apiUrl}/posts/${postId}/like`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, likes: Array(data.likes).fill("temp") } : p
        )
      );
    }
  };

  // 💬 Add comment
  const addComment = async (postId, text) => {
    if (!token) return;
    const res = await fetch(`${config.apiUrl}/posts/${postId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? data.post : p))
      );
    }
  };



  return (
    <PostsContext.Provider value={{ posts, addPost, toggleLike, addComment, setPosts}}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
