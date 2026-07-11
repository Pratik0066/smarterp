import { Link } from 'react-router-dom';
import { Code2, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Code2 size={18} />
            <span className="text-sm">AI Code Review Assistant</span>
          </div>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Built with <Heart size={14} className="text-red-400" /> by interns
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link to="/dashboard" className="hover:text-gray-600 transition">Dashboard</Link>
            <Link to="/reviews" className="hover:text-gray-600 transition">History</Link>
            <Link to="/review/new" className="hover:text-gray-600 transition">New Review</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
