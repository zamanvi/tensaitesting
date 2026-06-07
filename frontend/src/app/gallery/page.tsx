import Link from 'next/link';
import Image from 'next/image';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" />
            <span className="font-bold text-slate-900 text-lg">Tensai</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="text-5xl mb-5">📸</div>
        <h1 className="text-fluid-3xl font-bold text-slate-900 mb-3">Student Gallery</h1>
        <p className="text-slate-500 max-w-md mb-8">
          Success stories, milestones, and journeys of Tensai students around the world. Coming soon.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
