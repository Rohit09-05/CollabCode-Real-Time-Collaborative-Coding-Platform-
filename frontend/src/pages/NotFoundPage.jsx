import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
      <Code2 size={48} className="text-blue-500" />
      <h1 className="text-4xl font-bold text-gray-100">404</h1>
      <p className="text-gray-400">Page not found.</p>
      <Link to="/dashboard" className="btn-primary mt-2">Go to Dashboard</Link>
    </div>
  );
}
