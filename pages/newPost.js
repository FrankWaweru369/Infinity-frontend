import { useTheme } from '../context/ThemeContext';
// pages/newPost.js
import { useState, useRef } from 'react';
import { FiX, FiImage, FiVideo, FiMusic, FiUpload } from 'react-icons/fi';
import { useRouter } from 'next/router';
import config from '../src/config';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const API_BASE = config.apiUrl;



export default function NewPostPage() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('post');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null); 
const [preview, setPreview] = useState(null);

const [files, setFiles] = useState([]);
const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [songName, setSongName] = useState('');
  const [visibility, setVisibility] = useState("public");

const [allowLikes, setAllowLikes] = useState(true);

const [allowComments, setAllowComments] = useState(true);

const [allowRecomments, setAllowRecomments] = useState(true);

const [selectedUsers, setSelectedUsers] = useState([]);
const [searchUsers, setSearchUsers] = useState("");
const [userResults, setUserResults] = useState([]);

  // Get auth headers (assuming similar to your dashboard)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  };

  // Handle file selection
  const handleFileChange = (e) => {
  const selectedFiles = Array.from(e.target.files || []);
  if (selectedFiles.length === 0) return;

  // Reel validation (only one video expected)
  if (activeTab === "reel") {
    const reelFile = selectedFiles[0];

    if (reelFile.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return;
    }

    setFile(reelFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(reelFile);

    return;
  }

  // Image post mode (multiple images)
  setFiles(selectedFiles);

  const previewUrls = selectedFiles.map((file) =>
    URL.createObjectURL(file)
  );

  setPreviews(previewUrls);
};

  // Handle post submission
  const handlePostSubmit = async (e) => {
  e.preventDefault();
  
  // Validation
  if (activeTab === "reel" && !file) {
  alert("Please select a video for your reel");
  return;
}

if (activeTab === "post" && !caption.trim() && files.length === 0) {
  alert("Please add a caption or select at least one image");
  return;
}

if (activeTab === "reel" && !caption.trim() && !file) {
  alert("Please add a caption or select a video");
  return;
}

setUploading(true);

const formData = new FormData();

formData.append("content", caption);

// 🌍 Visibility
formData.append("visibility", visibility);

// 🎛 Interaction controls
formData.append("allowLikes", allowLikes);

formData.append(
  "allowComments",
  allowComments
);

formData.append(
  "allowRecomments",
  allowRecomments
);

formData.append(
  "allowedUsers",
  JSON.stringify(
    visibility === "personal"
      ? selectedUsers.map((u) => u._id)
      : []
  )
);

if (activeTab === "post") {
  files.forEach((img) => {
    formData.append("images", img);
  });
} else {
  formData.append("video", file);
}

if (activeTab === "reel" && songName.trim()) {
  formData.append("song_name", songName);
}

  try {
    const endpoint = activeTab === 'post' ? 'posts' : 'reels';
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      alert(`${activeTab === 'post' ? 'Post' : 'Reel'} created successfully!`);
      
      resetForm();
      setSongName('');
      router.push('/dashboard');
    } else {
      console.error(data.message || "Upload failed");
      alert(data.message || "Upload failed");
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("An error occurred. Please try again.");
  } finally {
    setUploading(false);
  }
};

const resetForm = () => {
  setCaption("");
  setSongName("");

  // Reel state
  setFile(null);
  setPreview(null);

  // Post images state
  setFiles([]);
  setPreviews([]);

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

const removeSelectedImage = (indexToRemove) => {
  setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  setPreviews((prev) => prev.filter((_, index) => index !== indexToRemove));
};

  const handleDragEnd = (result) => {
  if (!result.destination) return;

  const reorderedFiles = Array.from(files);
  const reorderedPreviews = Array.from(previews);

  const [movedFile] = reorderedFiles.splice(result.source.index, 1);
  const [movedPreview] = reorderedPreviews.splice(result.source.index, 1);

  reorderedFiles.splice(result.destination.index, 0, movedFile);
  reorderedPreviews.splice(result.destination.index, 0, movedPreview);

  setFiles(reorderedFiles);
  setPreviews(reorderedPreviews);
};

const handleUserSearch = async (query) => {

  setSearchUsers(query);

  if (!query.trim()) {
    setUserResults([]);
    return;
  }

  try {

    const res = await axios.get(
      `${API_BASE}/users/search?query=${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setUserResults(res.data || []);

  } catch (err) {
    console.error(err);
  }
};
  return (
    <div className="h-screen bg-gray-50 dark:bg-infinityBgDark flex flex-col">
      {/* Header with Tabs */}
      <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 border-b px-4 pt-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-infinityTextDark">
            Create {activeTab === 'post' ? 'Post' : 'Reel'}
          </h1>
          <button 
            onClick={() => router.back()}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (!uploading) {
                resetForm();
                setActiveTab('post');
              }
            }}
            disabled={uploading}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'post'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Post
          </button>
          <button
            onClick={() => {
              if (!uploading) {
                resetForm();
                setActiveTab('reel');
              }
            }}
            disabled={uploading}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'reel'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Reel
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handlePostSubmit} className="p-4 max-w-md mx-auto">
          {/* Hidden file input */}
          <input
  type="file"
  ref={fileInputRef}
  multiple
  accept="image/*"
  onChange={handleFileChange}
  className="hidden"
/>

            {/* POST CREATION */}
          {activeTab === 'post' ? (
            <div className="space-y-4">
              {/* What's on your mind */}
              <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 rounded-lg p-4">
<h2 className="font-medium text-gray-200 mb-2">
What's on your mind?
</h2>
<textarea
value={caption}
onChange={(e) => setCaption(e.target.value)}
placeholder="Share your thoughts..."
className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-4
00 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"

rows={3}  
              disabled={uploading}  
            />  
          </div>

{/* 🌍 Visibility & Interaction Settings */}

<div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4">  {/* Visibility */}

  <div>  
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">  
      Post Visibility  
    </label>  <select  
  value={visibility}  
  onChange={(e) => setVisibility(e.target.value)}  
  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"  
>  
  <option value="public">  
    Public  
  </option>  

  <option value="private">  
    Private  
  </option>  

  <option value="personal">  
    Personal  
  </option>  
</select>

  </div>  {/* Public interaction controls */}
{visibility === "public" && (
<div className="space-y-3">

<label className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">  

    <span className="text-sm text-gray-700 dark:text-gray-300">  
      Allow Likes  
    </span>  

    <input  
      type="checkbox"  
      checked={allowLikes}  
      onChange={() =>  
        setAllowLikes(!allowLikes)  
      }  
      className="w-4 h-4 accent-purple-600"  
    />  
  </label>  

  <label className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">  

    <span className="text-sm text-gray-700 dark:text-gray-300">  
      Allow Comments  
    </span>  

    <input  
      type="checkbox"  
      checked={allowComments}  
      onChange={() =>  
        setAllowComments(!allowComments)  
      }  
      className="w-4 h-4 accent-purple-600"  
    />  
  </label>  

  <label className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">  

    <span className="text-sm text-gray-700 dark:text-gray-300">  
      Allow Recomments  
    </span>  

    <input  
      type="checkbox"  
      checked={allowRecomments}  
      onChange={() =>  
        setAllowRecomments(!allowRecomments)  
      }  
      className="w-4 h-4 accent-purple-600"  
    />  
  </label>  

</div>

)}

{/* Personal Post User Selector */}
{visibility === "personal" && (

  <div className="mt-3 space-y-3">

    {/* Search Input */}
    <input
      type="text"
      value={searchUsers}
      onChange={(e) => handleUserSearch(e.target.value)}
      placeholder="Search users..."
      className="w-full border rounded-xl p-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-purple-500
                 dark:bg-gray-800 dark:border-gray-700"
    />

    {/* Search Results */}
    {userResults.length > 0 && (
      <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">

        {userResults.map((u) => {

          const alreadySelected = selectedUsers.some(
            (x) => x._id === u._id
          );

          return (
            <button
              key={u._id}
              type="button"
              disabled={alreadySelected}
              onClick={() => {
                if (!alreadySelected) {
                  setSelectedUsers([...selectedUsers, u]);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left transition
                ${
                  alreadySelected
                    ? "bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
            >

              <div className="flex items-center space-x-3">

                {getAvatar(
                  imageUrl(u.profilePicture),
                  u.username,
                  8
                )}

                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {u.username}
                </span>

              </div>

              {alreadySelected && (
                <span className="text-xs text-purple-600">
                  Added
                </span>
              )}

            </button>
          );
        })}
      </div>
    )}

    {/* Selected Users */}
    {selectedUsers.length > 0 && (
      <div className="flex flex-wrap gap-2">

        {selectedUsers.map((u) => (
          <div
            key={u._id}
            className="flex items-center space-x-2 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full"
          >

            <span className="text-sm">
              {u.username}
            </span>

            <button
              type="button"
              onClick={() =>
                setSelectedUsers(
                  selectedUsers.filter((x) => x._id !== u._id)
                )
              }
              className="text-xs hover:text-red-500"
            >
              ✕
            </button>

          </div>
        ))}

      </div>
    )}

  </div>

)}

{/* Private post info */}
{visibility === "private" && (
<div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">

<p className="text-sm text-purple-700 dark:text-purple-300">  
     Users will not be able to like or comment publicly.  
    They can only send private feedback visible only to you.  
  </p>  

</div>

)}

{/* Personal post info */}
{visibility === "personal" && (
<div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">

<p className="text-sm text-indigo-700 dark:text-indigo-300">  
   Only selected users will be able to view this post.  
  </p>  

</div>

)}

</div> 
              {/* Preview */}
              {preview && (
                <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 rounded-lg p-4">
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="rounded-lg w-full max-h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add Images Section */}
<div className="bg-white dark:bg-gray-900 rounded-lg p-4">
  <div className="flex items-center gap-2 text-gray-700 mb-3">
    <div
      className={`w-4 h-4 flex items-center justify-center text-sm ${
        files.length > 0 ? "text-green-500" : "text-gray-400"
      }`}
    >
      {files.length > 0 ? "✓" : "☐"}
    </div>

    <span className="text-sm font-medium">
      {files.length > 0
        ? `${files.length} image${files.length > 1 ? "s" : ""} selected`
        : "Add Images"}
    </span>
  </div>

  <button
    type="button"
    onClick={triggerFileInput}
    disabled={uploading}
    className={`w-full border-2 border-dashed ${
      files.length > 0
        ? "border-green-300 bg-green-50"
        : "border-gray-300 hover:border-purple-400"
    } rounded-lg p-6 text-center ${
      uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
    }`}
  >
    <FiImage
      className={`w-12 h-12 mx-auto mb-2 ${
        files.length > 0 ? "text-green-400" : "text-gray-400"
      }`}
    />

    <p
      className={`text-sm font-medium ${
        files.length > 0 ? "text-green-600" : "text-gray-800"
      }`}
    >
      {files.length > 0 ? "Tap to change images" : "Tap to browse files"}
    </p>
  </button>

  {/* Preview Grid */}

{previews.length > 0 && (
  <DragDropContext onDragEnd={handleDragEnd}>
    <Droppable droppableId="images" direction="horizontal">
      {(provided) => (
        <div
          className="grid grid-cols-3 gap-2 mt-4"
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          {previews.map((src, index) => (
            <Draggable
              key={index.toString()}
              draggableId={index.toString()}
              index={index}
            >
              {(provided) => (
                <div
                  className="relative"
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                >
                  <img
                    src={src}
                    alt={`preview-${index}`}
                    className="w-full h-24 object-cover rounded-md"
                  />

                  <button
                    type="button"
                    onClick={() => removeSelectedImage(index)}
                    className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-purple-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
)} 
</div>

              {/* Post Button */}
              <div className="sticky bottom-0 bg-gray-50 dark:bg-infinityBgDark pt-4">
                <button
                  type="submit"
                  disabled={uploading || (!caption.trim() && !file)}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          ) : (
            /* REEL CREATION */
            <div className="space-y-4">
              {/* Preview */}
              {preview && (
                <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 rounded-lg p-4">
                  <div className="relative">
                    <video
                      src={preview}
                      controls
                      className="rounded-lg w-full max-h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Select Video Section */}
              <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 rounded-lg p-4">
                <h2 className="font-medium text-gray-800 mb-3">
                  Select Video
                </h2>
                
                <button
  type="button"
  onClick={() => {
    // Clear input first
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  }}
  disabled={uploading}
  className={`w-full border-2 border-dashed ${
    file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-purple-400'
  } rounded-lg p-4 text-center ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
>
  <FiVideo className={`w-10 h-10 mx-auto mb-2 ${file ? 'text-green-400' : 'text-gray-400'}`} />
  <p className={`text-sm font-medium mb-1 ${file ? 'text-green-600' : 'text-gray-800'}`}>
    {file ? 'Video selected' : 'Tap to browse ALL files and folders'}
  </p>
  <p className="text-xs text-gray-500 mb-3">
    {file 
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB • ${file.type}`
      : 'Opens complete file browser • All file types • Max: 50MB'
    }
  </p>
  <div className="flex items-center gap-1 mx-auto text-gray-700 px-3 py-1.5 rounded text-sm">
    <FiUpload className="w-4 h-4" />
    <span>{file ? 'Change Video' : 'Browse Files'}</span>
  </div>
</button>


<input
  ref={fileInputRef}
  type="file"
  onChange={handleFileChange}
  className="hidden"
/>
              </div>

              {/* Caption Section */}
              <div className="bg-white dark:bg-gray-900 dark:bg-gray-900 rounded-lg p-4">
                <h2 className="font-medium text-gray-800 mb-2">
                  Caption
                </h2>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your reel..."
                  className="w-full h-16 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
		  rows={2}
                  disabled={uploading}
                />
              </div>

             {/* Music */}
<div className="bg-white dark:bg-gray-900 dark:bg-gray-900 rounded-lg p-4">
  <h2 className="font-medium text-gray-800 mb-2">
    Music
  </h2>
  <input
    type="text"
    value={songName}
    onChange={(e) => setSongName(e.target.value)}
    placeholder="Song name (leave blank for Original Sound)..."
    className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
		  disabled={uploading}
  />
  <p className="text-xs text-gray-500 mt-1">
    Leave empty to use Original Sound from your video
  </p>
</div> 

              {/* Upload Button */}
              <div className="sticky bottom-0 bg-gray-50 dark:bg-infinityBgDark pt-4">
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Reel'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
