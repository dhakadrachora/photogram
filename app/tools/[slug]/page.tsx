import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { VIRAL_20_TOOLS, ToolItem } from '@/lib/data/tools-data';
import ToolRenderer from '@/components/tools/ToolRenderer';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return VIRAL_20_TOOLS.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = VIRAL_20_TOOLS.find((t) => t.slug === slug);

  if (!tool) {
    return { title: 'Tool Not Found | Dhotiaale' };
  }

  return {
    title: `${tool.title} | Free Online Tool | Dhotiaale`,
    description: tool.shortDesc,
    keywords: tool.keywords,
    openGraph: {
      title: `${tool.title} | Dhotiaale`,
      description: tool.shortDesc,
      url: `https://www.dhotiaale.online/tools/${tool.slug}`,
      siteName: 'Dhotiaale',
      type: 'website',
    },
    alternates: {
      canonical: `https://www.dhotiaale.online/tools/${tool.slug}`,
    }
  };
}

export default async function ToolDetailPage({ params }: Props) {
  const { slug } = await params;
  const tool = VIRAL_20_TOOLS.find((t) => t.slug === slug);

  if (!tool) {
    notFound();
  }

  // Schema.org Structured Data for Google Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    description: tool.shortDesc,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR'
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
          <span>/</span>
          <span className="text-indigo-400 truncate">{tool.title}</span>
        </nav>

        {/* Interactive Tool Widget */}
        <ToolRenderer tool={tool} />

        {/* How to Use & Features (SEO Content Block) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* How to use */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span>📌</span> How to Use {tool.categoryLabel}
            </h3>
            <ol className="space-y-3">
              {tool.howToSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Key Features */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span>✨</span> Key Features & Highlights
            </h3>
            <ul className="space-y-3">
              {tool.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQs Section (High SEO Ranking Snippet) */}
        {tool.faqList && tool.faqList.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <span>❓</span> Frequently Asked Questions (FAQs)
            </h3>
            <div className="space-y-4">
              {tool.faqList.map((faq, idx) => (
                <div key={idx} className="p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl">
                  <h4 className="font-semibold text-slate-200 text-sm">{faq.q}</h4>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explore Other Tools */}
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Explore More Free Online Tools</h3>
            <Link href="/tools" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View All 20 Tools →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VIRAL_20_TOOLS.filter((t) => t.slug !== tool.slug).slice(0, 4).map((other) => (
              <Link
                key={other.id}
                href={`/tools/${other.slug}`}
                className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-center transition-all"
              >
                <div className="text-2xl mb-1">{other.icon}</div>
                <div className="text-xs font-bold text-slate-200 truncate">{other.categoryLabel}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
