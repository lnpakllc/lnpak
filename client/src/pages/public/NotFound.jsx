import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Seo } from '../../components/ui';

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <Seo title="Page not found" noindex />
      <Compass className="mb-4 h-14 w-14 text-navy-700" />
      <h1 className="text-3xl">This page took a different route</h1>
      <p className="mt-2 max-w-md text-slate-500">The page you are looking for does not exist or has been moved.</p>
      <div className="mt-6 flex gap-3"><Link to="/" className="btn-primary">Go home</Link><Link to="/contact" className="btn-outline">Contact us</Link></div>
    </section>
  );
}
