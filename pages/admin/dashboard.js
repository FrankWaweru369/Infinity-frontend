// pages/admin/dashboard.js
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaUsers, FaClock, FaChartBar, FaEye, 
  FaUser, FaDesktop, FaMobileAlt, FaGlobe,
  FaBolt, FaNetworkWired, FaRocket, FaChartLine,
  FaTimes, FaCalendar, FaHourglassHalf, FaFire,
  FaHistory, FaLaptop, FaTabletAlt, FaSearch
} from "react-icons/fa";
import { TbRefresh, TbChartBar as TbChartBarIcon } from "react-icons/tb";
import { IoStatsChart } from "react-icons/io5";

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/analytics`
  : 'http://localhost:10000/api/analytics';

// Helper functions at TOP LEVEL
const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
};

const formatTimeAgo = (date) => {
  if (!date) return 'Never';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// Main Dashboard Component
function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // User Modal State
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userDetailData, setUserDetailData] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all analytics data
  const fetchAllData = async () => {
    try {
      const [summaryRes, onlineRes, activityRes, overviewRes] = await Promise.all([
        axios.get(`${API_BASE}/summary`),
        axios.get(`${API_BASE}/online-users`),
        axios.get(`${API_BASE}/user-activity?limit=10`),
        axios.get(`${API_BASE}/dashboard-overview`)
      ]);

      setAnalytics(summaryRes.data);
      setOnlineUsers(onlineRes.data.onlineUsers || []);
      setUserActivity(activityRes.data.userActivities || []);
      setDashboardStats(overviewRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details for modal
  const fetchUserDetails = async (userId) => {
    setUserDetailLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/user-activity/${userId}`);
      console.log("User data:", response.data); // Debug log
      setUserDetailData(response.data);
    } catch (error) {
      console.error("Error fetching user details:", error);
      // Fallback data
      setUserDetailData({
        userInfo: { username: "Unknown", email: "N/A" },
        summary: { totalVisits: 0, totalTimeSpent: 0, devicesUsed: 0 },
        topPages: [],
        recentVisits: [],
        pagesVisited: []
      });
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Handle user click
  const handleUserClick = async (userId) => {
    setSelectedUserId(userId);
    setIsUserModalOpen(true);
    await fetchUserDetails(userId);
  };

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) return <DashboardSkeleton />;
  if (!analytics) return <div className="p-10 text-center text-red-500">Failed to load analytics.</div>;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6 md:p-8 font-sans overflow-x-hidden">
        
        {/* Header */}
        <header className="mb-8 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                  INFINITY ANALYTICS
                </span>
              </h1>
              <p className="text-gray-400 text-lg">Real-time platform intelligence dashboard</p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button 
                onClick={fetchAllData}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center space-x-2 hover:scale-105 transition-all duration-200 shadow-lg shadow-cyan-500/20"
              >
                <TbRefresh className="text-lg" />
                <span>Refresh Data</span>
              </button>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                <span className="text-sm text-gray-400">Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
              </div>
            </div>
          </div>
          
          {/* Last updated */}
          <div className="absolute right-0 top-0 text-xs text-gray-500">
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--'}
          </div>
        </header>

        {/* GLOWING ORBS BACKGROUND */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* MAIN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left Column: Overview Stats */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Real-time Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FuturisticCard 
                title="Total Users" 
                value={analytics.totalUsers} 
                icon={<FaUsers className="text-2xl" />}
                gradient="from-cyan-500 to-blue-600"
                change="+12%"
              />
              
              <FuturisticCard 
                title="Online Now" 
                value={onlineUsers.length} 
                icon={<FaBolt className="text-2xl" />}
                gradient="from-green-500 to-emerald-600"
                glow={onlineUsers.length > 0}
              />
              
              <FuturisticCard 
                title="Avg Session" 
                value={`${Math.round(analytics.averageSessionDuration || 0)}s`} 
                icon={<FaClock className="text-2xl" />}
                gradient="from-purple-500 to-violet-600"
              />
              
              <FuturisticCard 
                title="24h Activity" 
                value={dashboardStats?.stats?.recentActivity || 0} 
                icon={<FaChartLine className="text-2xl" />}
                gradient="from-pink-500 to-rose-600"
              />
            </div>

            {/* ONLINE USERS SECTION */}
            <div className="cyber-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <h2 className="text-xl font-bold">Live Users</h2>
                  <span className="ml-3 px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
                    {onlineUsers.length} active
                  </span>
                </div>
                <div className="text-sm text-gray-400">Last 5 minutes</div>
              </div>
              
              {onlineUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {onlineUsers.map(user => (
                    <div 
                      key={user.userId} 
                      className="bg-gray-900/50 rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer hover:scale-[1.02]"
                      onClick={() => handleUserClick(user.userId)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img 
                            src={user.profilePicture || '/default-avatar.png'} 
                            className="w-12 h-12 rounded-full border-2 border-cyan-500"
                            alt={user.username}
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                        </div>
                        <div>
                          <h3 className="font-bold">{user.username}</h3>
                          <p className="text-sm text-cyan-400 truncate">{user.currentPage}</p>
                          <p className="text-xs text-gray-400">{formatTimeAgo(user.lastSeen)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                  <FaGlobe className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>No users online in the last 5 minutes</p>
                  <p className="text-sm mt-1">Activity will appear here when users are active</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Quick Stats */}
          <div className="space-y-6">
            
            {/* USER ACTIVITY LIST */}
            <div className="cyber-card">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaUser className="mr-2 text-cyan-400" />
                Recent Activity
              </h2>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {userActivity.map(activity => (
                  <div 
                    key={activity.userId} 
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 hover:bg-gray-800/50 transition-all cursor-pointer hover:scale-[1.02]"
                    onClick={() => handleUserClick(activity.userId)}
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={activity.profilePicture || '/default-avatar.png'} 
                        className="w-10 h-10 rounded-full"
                        alt={activity.username}
                      />
                      <div>
                        <h4 className="font-medium">{activity.username}</h4>
                        <p className="text-xs text-gray-400">{formatTimeAgo(activity.lastSeen)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{activity.totalVisits} visits</div>
                      <div className="text-xs text-gray-400">{formatDuration(activity.totalTimeSpent)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP PAGES */}
            <div className="cyber-card">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaEye className="mr-2 text-purple-400" />
                Top Pages
              </h2>
              
              <div className="space-y-3">
                {dashboardStats?.topPages?.slice(0, 5).map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-800/30 rounded transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded">
                        <span className="font-bold text-sm">{idx + 1}</span>
                      </div>
                      <div className="truncate max-w-[150px] font-mono text-sm">{page._id}</div>
                    </div>
                    <div className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded text-sm">
                      {page.visits} views
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM SECTION: DETAILED TABLES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Most Active Users Table */}
          <div className="cyber-card">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaChartBar className="mr-2 text-green-400" />
              Most Active Users
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Visits</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.mostActiveUsers?.slice(0, 8).map((user, idx) => (
                    <tr 
                      key={user.user?._id || idx} 
                      className="border-b border-gray-900/50 hover:bg-gray-800/30 cursor-pointer"
                      onClick={() => user.user?._id && handleUserClick(user.user._id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={user.user?.profilePicture} 
                            className="w-8 h-8 rounded-full"
                            alt={user.user?.username}
                          />
                          <span>{user.user?.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-800 rounded-full h-2 mr-3">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (user.numberOfVisits / 100) * 100)}%` }}
                            ></div>
                          </div>
                          <span>{user.numberOfVisits}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{user.lastVisitedPage || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Most Viewed Pages Table */}
          <div className="cyber-card">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaNetworkWired className="mr-2 text-pink-400" />
              Most Viewed Pages
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Page URL</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Views</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.mostViewedPages?.slice(0, 8).map((page, idx) => (
                    <tr key={idx} className="border-b border-gray-900/50 hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-mono text-sm truncate max-w-[200px]">
                        {page._id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-800 rounded-full h-2 mr-3">
                            <div 
                              className="bg-gradient-to-r from-pink-500 to-rose-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (page.count / 1000) * 100)}%` }}
                            ></div>
                          </div>
                          <span>{page.count}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs bg-gray-800 text-green-400">
                          ▲ 12%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <footer className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Infinity Analytics Dashboard • Real-time monitoring • v1.0</p>
          <p className="mt-1">Data updates every 30 seconds • Last refresh: {lastUpdated?.toLocaleTimeString()}</p>
        </footer>

      </div>

      {/* USER DETAIL MODAL */}
      {isUserModalOpen && (
        <UserDetailModal
          userDetailData={userDetailData}
          loading={userDetailLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => {
            setIsUserModalOpen(false);
            setUserDetailData(null);
          }}
        />
      )}
    </>
  );
}

// =================== COMPONENTS ===================

const FuturisticCard = ({ title, value, icon, gradient, change, glow = false }) => {
  return (
    <div className={`relative bg-gray-900/40 backdrop-blur-sm rounded-2xl p-5 border border-gray-800 hover:border-${gradient.split('-')[1]}-500/30 transition-all duration-300 hover:scale-[1.02] group ${glow ? 'shadow-lg shadow-green-500/10' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-900/20 rounded-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20`}>
            {icon}
          </div>
          {change && (
            <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">
              {change}
            </span>
          )}
        </div>
        
        <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
        <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {value}
        </div>
        
        {/* Animated bottom bar */}
        <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${gradient} rounded-full animate-pulse`}
            style={{ width: '70%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-8">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-800 rounded w-1/4 mb-6"></div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-gray-900/50 rounded-2xl"></div>
          ))}
        </div>
        
        {/* Table skeletons */}
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-gray-900/50 rounded-2xl"></div>
          <div className="h-64 bg-gray-900/50 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
};

// USER DETAIL MODAL COMPONENT
const UserDetailModal = ({ userDetailData, loading, activeTab, setActiveTab, onClose }) => {
  
  const renderOverview = () => {
    const user = userDetailData?.userInfo;
    const summary = userDetailData?.summary || {};
    
    return (
      <div className="space-y-6">
        {/* User Profile Card */}
        <div className="cyber-card">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={user?.profilePicture || '/default-avatar.png'} 
                className="w-20 h-20 rounded-full border-4 border-cyan-500/30"
                alt={user?.username}
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                <FaUser className="text-xs" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {user?.username || 'Unknown User'}
              </h2>
              <p className="text-gray-400">{user?.email || 'N/A'}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="flex items-center text-sm text-gray-400">
                  <FaCalendar className="mr-1" />
                  Joined: {formatDate(user?.createdAt)}
                </span>
                <span className="flex items-center text-sm text-gray-400">
                  <FaHourglassHalf className="mr-1" />
                  Last seen: {formatDate(summary?.lastSeen)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<FaChartBar />}
            label="Total Visits"
            value={summary?.totalVisits || 0}
            color="cyan"
          />
          <StatCard 
            icon={<FaClock />}
            label="Total Time"
            value={formatDuration(summary?.totalTimeSpent || 0)}
            color="purple"
          />
          <StatCard 
            icon={<IoStatsChart />}
            label="Avg Session"
            value={`${Math.round((summary?.totalTimeSpent || 0) / (summary?.totalVisits || 1))}s`}
            color="green"
          />
          <StatCard 
            icon={<FaFire />}
            label="Devices Used"
            value={summary?.devicesUsed || 0}
            color="pink"
          />
        </div>
      </div>
    );
  };

  const renderPageAnalytics = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4">Most Visited Pages</h3>
      {userDetailData?.topPages?.length > 0 ? (
        userDetailData.topPages.map((page, index) => (
          <div key={index} className="cyber-card hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-center mb-2">
              <div className="font-mono text-sm truncate max-w-[200px]">
                {page.page || page._id}
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-2 py-1 bg-cyan-900/30 text-cyan-400 rounded text-xs">
                  {page.visits || page.count} visits
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">No page data available</div>
      )}
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {userDetailData?.recentVisits?.length > 0 ? (
          userDetailData.recentVisits.map((visit, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 cyber-card hover:bg-gray-800/30 transition-all">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                {visit.userAgent?.includes('Mobile') ? <FaMobileAlt /> : <FaLaptop />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{visit.page}</span>
                  <span className="text-sm text-cyan-400">{formatDuration(visit.duration)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>{formatTimeAgo(visit.createdAt)}</span>
                  <span>{new Date(visit.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No recent activity</div>
        )}
      </div>
    </div>
  );

  const renderDevices = () => (
    <div className="cyber-card">
      <h3 className="text-lg font-bold mb-4">Pages Visited</h3>
      <div className="space-y-2">
        {userDetailData?.pagesVisited?.length > 0 ? (
          userDetailData.pagesVisited.map((page, index) => (
            <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-800/30 rounded">
              <span className="font-mono text-sm">{page.page}</span>
              <span className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm">
                {page.count} times
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">No page history</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900/80 to-black/80">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                User Analytics
              </h2>
              <p className="text-gray-400">Detailed activity analysis</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                <p className="mt-4 text-gray-400">Loading user analytics...</p>
              </div>
            ) : userDetailData ? (
              <>
                {/* Tabs */}
                <div className="flex space-x-1 mb-6 p-1 bg-gray-900/50 rounded-lg">
                  {['overview', 'pages', 'timeline', 'devices'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === tab
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="animate-fadeIn">
                  {activeTab === 'overview' && renderOverview()}
                  {activeTab === 'pages' && renderPageAnalytics()}
                  {activeTab === 'timeline' && renderTimeline()}
                  {activeTab === 'devices' && renderDevices()}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-red-400">
                Failed to load user data
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Helper StatCard component
const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    cyan: 'border-cyan-500/30 text-cyan-400',
    purple: 'border-purple-500/30 text-purple-400',
    green: 'border-green-500/30 text-green-400',
    pink: 'border-pink-500/30 text-pink-400'
  };

  return (
    <div className={`cyber-card border ${colorClasses[color]}`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]} bg-opacity-20`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Add cyber styles
const cyberStyles = `
  .cyber-card {
    background: rgba(20, 20, 30, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 243, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .cyber-card:hover {
    border-color: rgba(0, 243, 255, 0.3);
    box-shadow: 
      0 12px 48px rgba(0, 243, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;

// Add styles component
const CyberStyles = () => <style jsx global>{cyberStyles}</style>;

// Final export
export default function DashboardWithStyles() {
  return (
    <>
      <CyberStyles />
      <AdminDashboard />
    </>
  );
}
