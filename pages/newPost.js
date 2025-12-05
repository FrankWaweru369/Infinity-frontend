// pages/newPost.js
import { useState, useRef } from 'react';
import { FiX, FiImage, FiVideo, FiMusic, FiUpload } from 'react-icons/fi';
import { useRouter } from 'next/router';
import config from '../src/config';

const API_BASE = config.apiUrl;



export default function NewPostPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('post');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [songName, setSongName] = useState('');

  // Get auth headers (assuming similar to your dashboard)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size for reels
    if (activeTab === 'reel' && selectedFile.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle post submission
  const handlePostSubmit = async (e) => {
  e.preventDefault();
  
  // Validation
  if (activeTab === 'reel' && !file) {
    alert('Please select a video for your reel');
    return;
  }
  
  if (!caption.trim() && !file) {
    alert('Please add a caption or select a file');
    return;
  }

  setUploading(true);

  const formData = new FormData();
  formData.append("content", caption);
  
  if (file) {
    formData.append(activeTab === 'post' ? 'image' : 'video', file);
  }
  
  
  if (activeTab === 'reel' && songName.trim()) {
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
  setCaption('');
  setFile(null);
  setPreview(null);
  setSongName(''); 
  if (fileInputRef.current) fileInputRef.current.value = "";
};

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header with Tabs */}
      <div className="bg-white border-b px-4 pt-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">
            Create {activeTab === 'post' ? 'Post' : 'Reel'}
          </h1>
          <button 
            onClick={() => router.back()}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <FiX className="w-5 h-5 text-gray-600" />
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
            ref={fileInputRef}
            type="file"
            accept={activeTab === 'post' ? 'image/*' : 'video/*'}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* POST CREATION */}
          {activeTab === 'post' ? (
            <div className="space-y-4">
              {/* What's on your mind */}
              <div className="bg-white rounded-lg p-4">
                <h2 className="font-medium text-gray-800 mb-2">
                  What's on your mind?
                </h2>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  rows={3}
                  disabled={uploading}
                />
              </div>

              {/* Preview */}
              {preview && (
                <div className="bg-white rounded-lg p-4">
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

              {/* Add Image Section */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-700 mb-3">
                  <div className={`w-4 h-4 flex items-center justify-center text-sm ${file ? 'text-green-500' : 'text-gray-400'}`}>
                    {file ? '✓' : '☐'}
                  </div>
                  <span className="text-sm font-medium">
                    {file ? 'Image Selected' : 'Add Image'}
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={uploading}
                  className={`w-full border-2 border-dashed ${
                    file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-purple-400'
                  } rounded-lg p-6 text-center ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <FiImage className={`w-12 h-12 mx-auto mb-2 ${file ? 'text-green-400' : 'text-gray-400'}`} />
                  <p className={`text-sm font-medium ${file ? 'text-green-600' : 'text-gray-800'}`}>
                    {file ? 'Tap to change image' : 'Tap to browse files'}
                  </p>
                </button>
              </div>

              {/* Post Button */}
              <div className="sticky bottom-0 bg-gray-50 pt-4">
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
                <div className="bg-white rounded-lg p-4">
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
              <div className="bg-white rounded-lg p-4">
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
              <div className="bg-white rounded-lg p-4">
                <h2 className="font-medium text-gray-800 mb-2">
                  Caption
                </h2>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your reel..."
                  className="w-full h-16 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  rows={2}
                  disabled={uploading}
                />
              </div>

             {/* Music */}
<div className="bg-white rounded-lg p-4">
  <h2 className="font-medium text-gray-800 mb-2">
    Music
  </h2>
  <input
    type="text"
    value={songName}
    onChange={(e) => setSongName(e.target.value)}
    placeholder="Song name (leave blank for Original Sound)..."
    className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    disabled={uploading}
  />
  <p className="text-xs text-gray-500 mt-1">
    Leave empty to use Original Sound from your video
  </p>
</div> 

              {/* Upload Button */}
              <div className="sticky bottom-0 bg-gray-50 pt-4">
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
