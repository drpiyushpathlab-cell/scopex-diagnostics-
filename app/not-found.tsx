import Link from 'next/link';
import { Home, Search, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-slate-600 text-sm mb-6">
          The test, package, or clinical page you are looking for may have moved, been renamed, or is currently undergoing clinical update.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
          <Link
            href="/tests"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-100 transition-colors text-sm"
          >
            <Search className="w-4 h-4" />
            Browse Tests
          </Link>
        </div>
      </div>
    </div>
  );
}
