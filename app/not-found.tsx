import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FBF8F3] text-gray-800">
      <h2 className="text-2xl font-bold mb-2">पेज नहीं मिला (404)</h2>
      <p className="text-gray-600 mb-6">माफ़ कीजिए, यह पेज मौजूद नहीं है।</p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-[#C25E29] text-white rounded-xl font-medium hover:bg-[#A84F22] transition-colors"
      >
        होम पेज पर लौटें
      </Link>
    </div>
  );
}
