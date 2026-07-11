import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Search, Filter, Trash2, ChevronDown } from 'lucide-react';

export default function ReviewHistory() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchReviews = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (language) params.language = language;
    if (sortBy) params.sort = sortBy;

    reviewAPI.getAll(params)
      .then(res => setReviews(res.data.reviews))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchReviews, 300);
    return () => clearTimeout(timeout);
  }, [search, language, sortBy]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await reviewAPI.delete(id);
      setReviews(reviews.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review History</h1>
        <p className="text-gray-500 mt-1">{reviews.length} reviews total</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Languages</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">Newest First</option>
            <option value="score_desc">Highest Score</option>
            <option value="score_asc">Lowest Score</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-4">No reviews found</p>
          <Link to="/review/new" className="text-blue-600 font-medium hover:underline">Create your first review</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <Link
              key={review.id}
              to={`/review/${review.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                    review.overall_score >= 70 ? 'bg-green-500' : review.overall_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {review.overall_score}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.file_name || 'Code Review'}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{review.language}</span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{review.review_type}</span>
                      {review.ReviewFindings && (
                        <span className="text-xs text-gray-400">{review.ReviewFindings.length} issues</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(review.id); }}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
