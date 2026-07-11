import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { analysisAPI, aiAPI, reviewAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, FileCode, Loader2, Clipboard } from 'lucide-react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
];

export default function NewReview() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('paste');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCode(event.target.result);
      setFilename(file.name);

      const ext = file.name.split('.').pop().toLowerCase();
      const langMap = { js: 'javascript', jsx: 'javascript', py: 'python', ts: 'typescript', tsx: 'typescript', java: 'java', c: 'c', cpp: 'cpp', go: 'go', rb: 'ruby', php: 'php' };
      if (langMap[ext]) setLanguage(langMap[ext]);
    };
    reader.readAsText(file);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text);
      toast.success('Code pasted from clipboard');
    } catch {
      toast.error('Could not read clipboard');
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code');
      return;
    }

    setLoading(true);
    try {
      const detectedFilename = filename || `code.${language === 'python' ? 'py' : language === 'typescript' ? 'ts' : 'js'}`;

      const staticResult = await analysisAPI.analyze({ code, language, filename: detectedFilename });
      const analysis = staticResult.data.analysis;

      let aiReview = null;
      try {
        const aiResult = await aiAPI.review({ code, language, staticAnalysis: analysis });
        aiReview = aiResult.data.review;
      } catch {
        // AI review is optional
      }

      const score = aiReview?.score || analysis.score;

      const result = await reviewAPI.submit({
        code,
        language,
        filename: detectedFilename,
        review_type: 'snippet',
        analysis,
        aiReview,
        complexity: analysis.complexity,
      });

      toast.success('Review completed!');
      navigate(`/review/${result.data.review.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Review failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Code Review</h1>
        <p className="text-gray-500 mt-1">Paste code or upload a file for analysis</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {['paste', 'upload'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'paste' ? <FileCode size={16} /> : <Upload size={16} />}
            {tab === 'paste' ? 'Paste Code' : 'Upload File'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          {filename && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="filename.js"
              />
            </div>
          )}
        </div>

        {activeTab === 'paste' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePaste}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <Clipboard size={14} />
              Paste from Clipboard
            </button>
          </div>
        )}

        {activeTab === 'upload' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
          >
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Click to upload a source code file</p>
            <p className="text-sm text-gray-400 mt-1">Supports .js, .py, .ts, .java, .c, .cpp, .go, .rb, .php</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".js,.jsx,.py,.ts,.tsx,.java,.c,.cpp,.go,.rb,.php,.cs"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '400px' }}>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {code.split('\n').filter(l => l.trim()).length} lines of code
          </p>
          <button
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              'Run Analysis'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
