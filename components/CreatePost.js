import { FiImage, FiSend, FiX } from "react-icons/fi";
import { useState } from "react";

export default function CreatePost({ onPost }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const removeImage = () => setImage(null);

  const handlePost = () => {
    if (text.trim() || image) {
      const newPost = {
        id: Date.now(),
        text,
        image,
      };
      onPost(newPost); // send new post to parent
      setText("");
      setImage(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-infinityPurple outline-none"
        rows={3}
      />

      {image && (
        <div className="relative">
          <img
            src={image}
            alt="Preview"
            className="rounded-xl max-h-60 object-cover w-full"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <FiX />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 text-gray-600 hover:text-infinityPurple cursor-pointer">
          <FiImage /> <span>Add Image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>

        <button
          onClick={handlePost}
          className="bg-infinityPurple text-white px-4 py-2 rounded-xl hover:bg-infinityPink transition"
        >
          <FiSend className="inline mr-1" /> Post
        </button>
      </div>
    </div>
  );
}
