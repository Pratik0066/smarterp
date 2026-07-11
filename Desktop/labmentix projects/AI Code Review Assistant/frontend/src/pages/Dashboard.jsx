import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Plus, TrendingUp, FileCode, AlertTriangle, Clock, ArrowRight, Code2, Shield } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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
    { label: 'Total Reviews', value: stats?.total_reviews || 0, icon: FileCode, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
    { label: 'Average Score', value: `${stats?.average_score || 0}/100`, icon: TrendingUp, color: 'bg-green-500', bgLight: 'bg-green-50' },
    { label: 'Languages', value: stats?.languages?.length || 0, icon: Code2, color: 'bg-purple-500', bgLight: 'bg-purple-50' },
    { label: 'Issues Found', value: recentReviews.reduce((sum, r) => sum + (r.ReviewFindings?.length || 0), 0), icon: AlertTriangle, color: 'bg-amber-500', bgLight: 'bg-amber-50' },
  ];

  const scoreDistribution = [
    { name: 'Excellent (80-100)', count: recentReviews.filter(r => r.overall_score >= 80).length },
    { name: 'Good (60-79)', count: recentReviews.filter(r => r.overall_score >= 60 && r.overall_score < 80).length },
    { name: 'Fair (40-59)', count: recentReviews.filter(r => r.overall_score >= 40 && r.overall_score < 60).length },
    { name: 'Poor (<40)', count: recentReviews.filter(r => r.overall_score < 40).length },
  ].filter(d => d.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your code review overview.</p>
        </div>
        <Link to="/review/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
          <Plus size={18} /> New Review
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bgLight }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`w-11 h-11 ${bgLight} rounded-xl flex items-center justify-center`}>
                <Icon size={20} className={`${color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Score Trend</h3>
          {recentReviews.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[...recentReviews].reverse().map((r, i) => ({
                review: i + 1,
                score: r.overall_score,
              }))}>
                <XAxis dataKey="review" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : recentReviews.length === 1 ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-blue-600">{recentReviews[0].overall_score}</span>
                </div>
                <p className="text-sm text-gray-500">Your only review score</p>
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileCode size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No reviews yet</p>
                <Link to="/review/new" className="text-blue-600 text-sm hover:underline">Start reviewing</Link>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Languages Used</h3>
          {stats?.languages?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.languages} dataKey="count" nameKey="language" cx="50%" cy="50%" outerRadius={70} label={({ language, count }) => `${language} (${count})`}>
                  {stats.languages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Code2 size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No language data yet</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Score Distribution</h3>
          {scoreDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Shield size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No data yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Reviews</h3>
          <Link to="/reviews" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentReviews.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentReviews.map(review => (
              <Link key={review.id} to={`/review/${review.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                    review.overall_score >= 70 ? 'bg-green-500' : review.overall_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}>{review.overall_score}</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{review.file_name || 'Code Review'}</p>
                    <p className="text-xs text-gray-500">{review.language} · {review.ReviewFindings?.length || 0} issues</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Clock size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="mb-2">No reviews yet</p>
            <Link to="/review/new" className="text-blue-600 font-medium hover:underline">Create your first review</Link>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Quick Start Guide</h3>
            <p className="text-blue-100 text-sm">Paste code, upload files, or write directly in the editor to get instant AI-powered reviews.</p>
          </div>
          <Link to="/review/new" className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition shrink-0">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
