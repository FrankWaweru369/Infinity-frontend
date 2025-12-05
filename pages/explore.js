import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiSearch, FiUsers, FiFileText, FiUserPlus, FiUserCheck, FiFilter, FiHome, FiUser, FiVideo, FiPlus, FiMoreHorizontal,FiHeart,FiMessageCircle, FiShare, FiArrowRight } from 'react-icons/fi';
import config from '../src/config';
import axios from 'axios';
                                                                                                     const API_BASE = config.apiUrl;

export default function Explore() {

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('users');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [discoveryData, setDiscoveryData] = useState({ users: [], posts: [] });
  const [followLoading, setFollowLoading] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentUserData, setCurrentUserData] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const router = useRouter();


useEffect(() => {
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setAuthChecking(false);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        let userData;
        if (data.user) {
          userData = data.user;
        } else if (data._id || data.id) {
          userData = data;
        }
        
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setAuthChecking(false);
    }
  };
  
  fetchCurrentUser();
}, []);


  // Enhanced discovery data loading with error handling
  useEffect(() => {
    loadDiscoveryData();
  }, []);

  const loadDiscoveryData = async () => {
    try {
      await Promise.all([fetchSuggestedUsers(), fetchPopularPosts()]);
    } catch (error) {
      console.error('Error loading discovery data:', error);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrl}/explore/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      
      if (data.users) {
        
        const usersWithStatus = data.users.map(user => ({
          ...user,
          
          isFollowing: user.isFollowing || false
        }));
        setDiscoveryData(prev => ({ ...prev, users: usersWithStatus }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

	useEffect(() => {
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      }
    } catch (error) {
      console.error('Error getting current user ID:', error);
    }
  };

  getCurrentUserId();
}, []);

useEffect(() => {
  if (!currentUserId) return;

  const start = Date.now();

  return () => {
    const duration = Math.floor((Date.now() - start) / 1000);

    axios.post(`${API_BASE}/analytics/visit`, {
      userId: currentUserId,
      page: window.location.pathname,
      duration
    }).catch(err => console.error("Analytics tracking error:", err));
  };
}, [currentUserId]);

  const fetchPopularPosts = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/explore/posts`);
      const data = await response.json();
      if (data.posts) {
        setDiscoveryData(prev => ({ ...prev, posts: data.posts }));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // Debounced search function
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setHasSearched(false);
      setResults([]);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = searchType === 'users' 
        ? `/explore/search/users?q=${encodeURIComponent(searchQuery)}`
        : `/explore/search/posts?q=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(`${config.apiUrl}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.users || data.posts) {
        const items = searchType === 'users' ? data.users : data.posts;
        setResults(items);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, searchType]);

 const handleFollow = async (userId) => {
  setFollowLoading(prev => ({ ...prev, [userId]: true }));
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please log in to follow users');
      return;
    }

    const response = await fetch(`${config.apiUrl}/users/${userId}/follow`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    // ✅ FIXED: Update the followers array to reflect the change
    setDiscoveryData(prev => ({
      ...prev,
      users: prev.users.map(user => {
        if (user._id === userId) {
          // Add current user to followers array and set isFollowing to true
        
          return { 
            ...user, 
            isFollowing: true,
            followers: [...user.followers, currentUserId] // Add current user to followers
          };
        }
        return user;
      })
    }));
    
    setResults(prev => prev.map(user => {
      if (user._id === userId) {
        
        return { 
          ...user, 
          isFollowing: true,
          followers: [...user.followers, currentUserId] // Add current user to followers
        };
      }
      return user;
    }));
    
  } catch (error) {
    console.error('Error following user:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setFollowLoading(prev => ({ ...prev, [userId]: false }));
  }
};

const handleUnfollow = async (userId) => {
  setFollowLoading(prev => ({ ...prev, [userId]: true }));
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please log in to unfollow users');
      return;
    }

    const response = await fetch(`${config.apiUrl}/users/${userId}/unfollow`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    // ✅ FIXED: Update the followers array to reflect the change
    setDiscoveryData(prev => ({
      ...prev,
      users: prev.users.map(user => {
        if (user._id === userId) {
          
          return { 
            ...user, 
            isFollowing: false,
            followers: user.followers.filter(id => id.toString() !== currentUserId.toString())
          };
        }
        return user;
      })
    }));
    
    setResults(prev => prev.map(user => {
      if (user._id === userId) {

        return { 
          ...user, 
          isFollowing: false,
          followers: user.followers.filter(id => id.toString() !== currentUserId.toString())
        };
      }
      return user;
    }));
    
  } catch (error) {
    console.error('Error unfollowing user:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setFollowLoading(prev => ({ ...prev, [userId]: false }));
  }
}; 

// Enhanced avatar with online status
  const getAvatar = (src, username, size = 8, isOnline = false) => {
    const getInitials = (name) => {
      if (!name) return "U";
      return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
    };

    const sizeClasses = {
      6: 'w-6 h-6 text-xs',
      8: 'w-8 h-8 text-sm', 
      12: 'w-12 h-12 text-base',
      16: 'w-16 h-16 text-lg'
    };

    return (
      <div className="relative">
        {src ? (
          <img 
            src={src} 
            alt={username || "User"} 
            className={`rounded-full ${sizeClasses[size]} object-cover border-2 border-white shadow-sm`} 
          />
        ) : (
          <div className={`rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-semibold ${sizeClasses[size]} border-2 border-white shadow-sm`}>
            {getInitials(username)}
          </div>
        )}
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>
    );
  };

  // Filter results based on active filter
  const filteredResults = results.filter(item => {
    if (activeFilter === 'all') return true;
    if (searchType === 'users') {
      return activeFilter === 'verified' ? item.isVerified : true;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      <div className="max-w-4xl mx-auto p-4">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Discover Infinity
          </h1>
          <p className="text-gray-600">Find amazing people and content</p>
        </div>

        {/* Enhanced Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex space-x-3 mb-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${searchType === 'users' ? 'users, names...' : 'posts, topics...'}`}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <FiSearch className="w-5 h-5" />
              )}
              <span>Search</span>
            </button>
          </div>

          {/* Enhanced Type Selector */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setSearchType('users')}
              className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-200 flex items-center justify-center space-x-2 ${
                searchType === 'users' 
                  ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiUsers className="w-5 h-5" />
              <span className="font-medium">Users</span>
            </button>
            <button
              onClick={() => setSearchType('posts')}
              className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-200 flex items-center justify-center space-x-2 ${
                searchType === 'posts' 
                  ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiFileText className="w-5 h-5" />
              <span className="font-medium">Posts</span>
            </button>
          </div>

          {/* Quick Filters */}
          {hasSearched && results.length > 0 && (
            <div className="flex items-center space-x-2">
              <FiFilter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Filter:</span>
              {['all', 'verified', 'popular'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                    activeFilter === filter
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Content Area */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Searching {searchType}...</p>
              <p className="text-sm text-gray-400 mt-1">Looking for "{searchQuery}"</p>
            </div>
          ) : hasSearched ? (
            // Enhanced Search Results
            filteredResults.length > 0 ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {filteredResults.length} {searchType} found for "{searchQuery}"
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {activeFilter !== 'all' ? `Filtered: ${activeFilter}` : 'All results'}
                  </span>
                </div>
                
                {searchType === 'users' ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredResults.map(user => (
                      <div key={user._id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getAvatar(user.profilePicture, user.username, 12, user.isOnline)}
                            <div>
                              <Link href={`/profile/${user.username}`} className="font-semibold text-gray-800 hover:text-purple-600 transition-colors group-hover:text-purple-600">
                                {user.username}
                              </Link>
                              <p className="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                                <span> {user.followers?.length || 0} followers</span>
                                <span>•</span>
                                <span> {user.following?.length || 0} following</span>
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => user.isFollowing ? handleUnfollow(user._id) : handleFollow(user._id)}
                            disabled={followLoading[user._id]}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                              user.isFollowing
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {followLoading[user._id] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : user.isFollowing ? (
                              <>
                                <FiUserCheck className="w-4 h-4" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <FiUserPlus className="w-4 h-4" />
                                <span>Follow</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredResults.map(post => (
                      <div key={post._id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 group">
                        <div className="flex items-center space-x-3 mb-3">
                          {getAvatar(post.author?.profilePicture, post.author?.username, 10)}
                          <div className="flex-1">
                            <Link href={`/profile/${post.author?.username}`} className="font-semibold text-gray-800 hover:text-purple-600 transition-colors">
                              {post.author?.username}
                            </Link>
                            <p className="text-xs text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              <span>❤️ {post.likes?.length || 0} likes</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              <span>💬 {post.comments?.length || 0} comments</span>
                            </span>
                          </div>
                          <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                            View Post →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <FiSearch className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No {searchType} found</h3>
                <p className="text-gray-500 mb-4">We couldn't find any {searchType} matching "{searchQuery}"</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setHasSearched(false);
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  ← Back to discovery
                </button>
              </div>
            )
          ) : (
            // Enhanced Discovery Content
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Discover {searchType === 'users' ? 'Amazing People' : 'Trending Content'}
              </h2>
              
              {searchType === 'users' ? (
                // Enhanced Users Discovery
                discoveryData.users.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {discoveryData.users.map(user => (
                      <div key={user._id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getAvatar(user.profilePicture, user.username, 12, user.isOnline)}
                            <div>
                              <Link href={`/profile/${user.username}`} className="font-semibold text-gray-800 hover:text-purple-600 transition-colors group-hover:text-purple-600">
                                {user.username}
                              </Link>
                              <p className="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                                <span>👥 {user.followers?.length || 0} followers</span>
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => user.isFollowing ? handleUnfollow(user._id) : handleFollow(user._id)}
                            disabled={followLoading[user._id]}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                              user.isFollowing
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {followLoading[user._id] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : user.isFollowing ? (
                              <>
                                <FiUserCheck className="w-4 h-4" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <FiUserPlus className="w-4 h-4" />
                                <span>Follow</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <FiUsers className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No users to discover yet</h3>
                    <p className="text-gray-500">Check back later for user recommendations</p>
                  </div>
                )
              ) : (
                discoveryData.posts.length > 0 ? (
  <div className="grid gap-6">
    {discoveryData.posts.map(post => (
      <div key={post._id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group">
        
        {/* Author Info */}
        <div className="flex items-center space-x-3 mb-4">
          {getAvatar(post.author?.profilePicture, post.author?.username, 12)}
          <div className="flex-1">
            <Link 
              href={`/profile/${post.author?.username}`} 
              className="font-semibold text-gray-900 hover:text-purple-600 transition-colors group-hover:text-purple-600"
            >
              {post.author?.username}
            </Link>
            <p className="text-sm text-gray-500 flex items-center space-x-2">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-800 leading-relaxed text-[15px] whitespace-pre-line">
            {post.content}
          </p>
          
          {/* Post Image if exists */}
          {post.image && (
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
              <img 
                src={post.image} 
                alt="Post content" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
        </div>

        {/* Non-interactive Engagement Metrics - Just for display */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-6">
            {/* Like Count */}
            <div className="flex items-center space-x-2">
              <FiHeart className="w-4 h-4 text-gray-400" />
              <span>{post.likesCount || post.likes?.length || 0}</span>
            </div>

            {/* Comment Count */}
            <div className="flex items-center space-x-2">
              <FiMessageCircle className="w-4 h-4 text-gray-400" />
              <span>{post.commentsCount || post.comments?.length || 0}</span>
            </div>
          </div>
          
          {/* Read Time */}
          <span className="text-gray-400 text-xs">
            {Math.ceil(post.content?.length / 200) || 1} min read
          </span>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="text-center py-12">
    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
      <FiFileText className="w-10 h-10 text-purple-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts to discover yet</h3>
    <p className="text-gray-500">Check back later for trending content</p>
  </div>
)              )}
            </div>
          )}
        </div>
      </div>
	  {/* bottom navbar */}
<div className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 flex justify-around items-center py-1">
  {/* Home */}
  <div
    onClick={() => router.push("/dashboard")}
    className={`flex flex-col items-center transition cursor-pointer ${
      router.pathname === "/dashboard"
        ? "text-purple-600"
        : "text-gray-700 hover:text-purple-600"
    }`}
  >
    <FiHome className="w-5 h-5" />
    <span className="text-xs">Home</span>
  </div>


  <div
    onClick={() => router.push("/explore")}
    className={`flex flex-col items-center transition cursor-pointer ${
      router.pathname === "/explore"
        ? "text-purple-600"
        : "text-gray-700 hover:text-purple-600"
    }`}
  >
    <FiSearch className="w-5 h-5" />
    <span className="text-xs">Explore</span>
  </div>

  {/* Floating Post Button - Centered */}
<div className="relative -top-1">                                                                      <Link href="/newPost">
    <button                                                                                                className="bg-purple-600 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 transition border-2 border-white"
    >
      <FiPlus className="w-6 h-6" />                                                                     </button>
  </Link>                                                                                            </div>

  {/* Reels */}
  <div
    onClick={() => router.push("/reels")}
    className={`flex flex-col items-center transition cursor-pointer ${
      router.pathname === "/reels"
        ? "text-purple-600"
        : "text-gray-700 hover:text-purple-600"
    }`}
  >
    <FiVideo className="w-5 h-5" />
    <span className="text-xs">Reels</span>
  </div>

  
{/* Profile */}
{authChecking ? (
  <div className="flex flex-col items-center text-gray-400">
    <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-purple-600 animate-spin"></div>
    <span className="text-xs mt-1">...</span>
  </div>
) : user?.username ? (
  <Link 
    href={`/profile/${user.username}`} 
    className="transition"
    onClick={(e) => {
      e.preventDefault();
      router.push(`/profile/${user.username}`);
    }}
  >
    <div className={`flex flex-col items-center ${
      router.pathname.includes("/profile")
        ? "text-purple-600"
        : "text-gray-700 hover:text-purple-600"
    }`}>
      <FiUser className="w-5 h-5" />
      <span className="text-xs">Profile</span>
    </div>
  </Link>
) : (
  <button
    onClick={() => {
      alert('No user found! Redirecting to login...');
      router.push('/login');
    }}
    className="flex flex-col items-center text-gray-700 hover:text-purple-600 transition"
  >
    <FiUser className="w-5 h-5" />
    <span className="text-xs">Profile</span>
  </button>
)}
</div>
    </div>
  );
}
