import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, TrendingUp, FileCode, AlertTriangle, Clock } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reviewAPI.getStats().catch(() => ({ data: { stats: { total_reviews: 0, average_score: 0, languages: [] } } })),
      reviewAPI.getAll({}).catch(() => ({ data: { reviews: [] } })),
    ]).then(([statsRes, reviewsRes]) => {
      setStats(statsRes.data.stats);
      setRecentReviews(reviewsRes.data.reviews.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  const statCards = [
    { label: 'Total Reviews', value: stats?.total_reviews || 0, icon: FileCode, color: 'bg-blue-500' },
    { label: 'Average Score', value: `${stats?.average_score || 0}/100`, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Languages Used', value: stats?.languages?.length || 0, icon: AlertTriangle, color: 'bg-amber-500' },
    { label: 'This Week', value: recentReviews.length, icon: Clock, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your code reviews</p>
        </div>
        <Link
          to="/review/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          New Review
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                <Icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Score Trend</h3>
          {recentReviews.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={recentReviews.reverse().map(r => ({
                name: r.file_name || r.language?.slice(0, 6) || 'Review',
                score: r.overall_score,
              }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No reviews yet. Start your first review!
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Languages</h3>
          {stats?.languages?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.languages}
                  dataKey="count"
                  nameKey="language"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ language, count }) => `${language} (${count})`}
                >
                  {stats.languages.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No language data yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Reviews</h3>
        {recentReviews.length > 0 ? (
          <div className="space-y-3">
            {recentReviews.map(review => (
              <Link
                key={review.id}
                to={`/review/${review.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                    review.overall_score >= 70 ? 'bg-green-500' : review.overall_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {review.overall_score}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.file_name || 'Code Review'}</p>
                    <p className="text-sm text-gray-500">{review.language} · {review.Project?.project_name || 'Project'}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No reviews yet. <Link to="/review/new" className="text-blue-600 hover:underline">Create your first review</Link>
          </div>
        )}
      </div>
    </div>
  );
}
