import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../src/config";
import PostCard from "../../components/PostCard";

const API_BASE = config.apiUrl;

export default function SinglePostPage() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API_BASE}/posts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPost(res.data.post);
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) return <p className="p-4">Loading post...</p>;
  if (!post) return <p className="p-4">Post not found</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <PostCard post={post} />
    </div>
  );
}
