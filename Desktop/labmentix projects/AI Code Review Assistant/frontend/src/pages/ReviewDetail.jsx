import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { reviewAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, AlertCircle, AlertTriangle, Info, Lightbulb, Shield, Zap, RefreshCw } from 'lucide-react';

const SEVERITY_CONFIG = {
  error: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle, badge: 'bg-red-500' },
  warning: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, badge: 'bg-amber-500' },
  info: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Info, badge: 'bg-blue-500' },
  suggestion: { color: 'bg-green-50 text-green-700 border-green-200', icon: Lightbulb, badge: 'bg-green-500' },
};

const CATEGORY_ICONS = {
  bugs: AlertCircle,
  code_smells: AlertTriangle,
  improvements: Lightbulb,
  performance: Zap,
  security: Shield,
  naming: RefreshCw,
  refactoring: RefreshCw,
};

const CATEGORY_LABELS = {
  bugs: 'Bugs',
  code_smells: 'Code Smells',
  improvements: 'Improvements',
  performance: 'Performance',
  security: 'Security',
  naming: 'Naming',
  refactoring: 'Refactoring',
};

export default function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFindingTab, setActiveFindingTab] = useState('all');

  useEffect(() => {
    reviewAPI.getOne(id)
      .then(res => setReview(res.data.review))
      .catch(() => toast.error('Review not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this review?')) return;
    try {
      await reviewAPI.delete(id);
      toast.success('Review deleted');
      navigate('/reviews');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  if (!review) {
    return <div className="text-center py-20 text-gray-500">Review not found</div>;
  }

  const findings = review.ReviewFindings || [];
  const staticFindings = findings.filter(f => f.source === 'static_analysis');
  const aiFindings = findings.filter(f => f.source === 'ai_review');

  const allCategories = [...new Set(findings.map(f => f.category))];
  const filteredFindings = activeFindingTab === 'all'
    ? findings
    : findings.filter(f => f.category === activeFindingTab);

  const scoreColor = review.overall_score >= 70 ? 'text-green-600' : review.overall_score >= 40 ? 'text-amber-600' : 'text-red-600';
  const scoreRing = review.overall_score >= 70 ? 'stroke-green-500' : review.overall_score >= 40 ? 'stroke-amber-500' : 'stroke-red-500';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{review.file_name || 'Code Review'}</h1>
            <p className="text-gray-500">{review.language} · {new Date(review.created_at).toLocaleString()}</p>
          </div>
        </div>
        <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Source Code</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <Editor
                height="100%"
                language={review.language}
                value={review.code_snippet || ''}
                theme="vs-dark"
                options={{ readOnly: true, fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Findings</h3>
              <span className="text-sm text-gray-400">({findings.length} total)</span>
            </div>

            <div className="flex gap-1 flex-wrap mb-4 border-b border-gray-100 pb-2">
              <button
                onClick={() => setActiveFindingTab('all')}
                className={`px-3 py-1 text-xs rounded-full font-medium transition ${activeFindingTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All ({findings.length})
              </button>
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFindingTab(cat)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${activeFindingTab === cat ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {CATEGORY_LABELS[cat] || cat} ({findings.filter(f => f.category === cat).length})
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredFindings.map(finding => {
                const config = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
                const Icon = config.icon;
                return (
                  <div key={finding.id} className={`p-4 rounded-lg border ${config.color}`}>
                    <div className="flex items-start gap-3">
                      <Icon size={18} className="mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${config.badge}`}>
                            {finding.severity}
                          </span>
                          {finding.line_number && (
                            <span className="text-xs opacity-70">Line {finding.line_number}</span>
                          )}
                          <span className="text-xs opacity-50">{finding.source}</span>
                        </div>
                        <p className="font-medium">{finding.issue}</p>
                        {finding.explanation && <p className="text-sm mt-1 opacity-80">{finding.explanation}</p>}
                        {finding.suggested_fix && (
                          <p className="text-sm mt-2 opacity-70 italic">Fix: {finding.suggested_fix}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredFindings.length === 0 && (
                <p className="text-center py-8 text-gray-400">No findings in this category</p>
              )}
            </div>
          </div>

          {review.ai_review?.explanation && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">AI Explanation</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{review.ai_review.explanation}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Score</h3>
            <div className="flex items-center justify-center">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  className={scoreRing}
                  strokeWidth="10"
                  strokeDasharray={`${(review.overall_score / 100) * 314} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className={`text-2xl font-bold ${scoreColor}`}>
                  {review.overall_score}
                </text>
              </svg>
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {review.overall_score >= 70 ? 'Good quality' : review.overall_score >= 40 ? 'Needs improvement' : 'Poor quality'}
            </p>
          </div>

          {review.complexity && Object.keys(review.complexity).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Complexity</h3>
              <div className="space-y-3">
                {Object.entries(review.complexity).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Source</span>
                <span className="text-sm font-medium">{review.review_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Language</span>
                <span className="text-sm font-medium">{review.language}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Issues</span>
                <span className="text-sm font-medium">{findings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Static Issues</span>
                <span className="text-sm font-medium">{staticFindings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">AI Issues</span>
                <span className="text-sm font-medium">{aiFindings.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
