// pages/admin/dashboard.js
import { useState, useEffect } from "react";
import axios from "axios";
import { FaUsers, FaClock, FaChartBar, FaEye } from "react-icons/fa";

const API_BASE = "http://localhost:10000/api/analytics";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_BASE}/summary`);
        setAnalytics(res.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-10 text-center text-white">Loading Dashboard...</div>;
  if (!analytics) return <div className="p-10 text-center text-red-500">Failed to load analytics.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-8 font-sans">
      <h1 className="text-4xl font-bold mb-6 tracking-wider">Infinity Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <SummaryCard title="Total Users" value={analytics.totalUsers} icon={<FaUsers />} color="cyan" />
        <SummaryCard title="Avg Session Duration (s)" value={analytics.averageSessionDuration} icon={<FaClock />} color="green" />
        <SummaryCard title="Most Active Users" value={analytics.mostActiveUsers.length} icon={<FaChartBar />} color="purple" />
        <SummaryCard title="Most Viewed Pages" value={analytics.mostViewedPages.length} icon={<FaEye />} color="pink" />
      </div>

      {/* Most Active Users Table */}
<Section title="Most Active Users">
  <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
    <thead className="bg-gray-700 text-left">
      <tr>
        <th className="px-4 py-2">Username</th>
        <th className="px-4 py-2">Visits</th>
        <th className="px-4 py-2">Last Page</th>
      </tr>
    </thead>
    <tbody>
      {analytics.mostActiveUsers.slice(0, 10).map((user) => (
        <tr key={user._id} className="border-b border-gray-700">
          <td className="px-4 py-2 flex items-center space-x-2">
            <img src={user.user.profilePicture} className="w-8 h-8 rounded-full" alt="avatar" />
            <span>{user.user.username}</span>
          </td>
          <td className="px-4 py-2">{user.numberOfVisits}</td>
          <td className="px-4 py-2">{user.lastVisitedPage}</td>
        </tr>
      ))}
    </tbody>
  </table>
</Section>

      {/* Most Viewed Pages Table */}
      <Section title="Most Viewed Pages">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-700 text-left">
            <tr>
              <th className="px-4 py-2">Page</th>
              <th className="px-4 py-2">Views</th>
            </tr>
          </thead>
          <tbody>
            {analytics.mostViewedPages.map((page, idx) => (
              <tr key={idx} className="border-b border-gray-700">
                <td className="px-4 py-2">{page._id}</td>
                <td className="px-4 py-2">{page.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

// ---------- Summary Card Component ----------
const SummaryCard = ({ title, value, icon, color }) => {
  const colors = {
    cyan: "bg-cyan-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500"
  };

  return (
    <div className={`flex items-center p-5 rounded-xl shadow-lg ${colors[color]} hover:scale-105 transition-transform`}>
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <p className="text-sm opacity-75">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

// ---------- Section Wrapper ----------
const Section = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-2xl font-semibold mb-4">{title}</h2>
    {children}
  </div>
);
