export interface ToolItem {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  category: 'video-downloader' | 'media-editor' | 'calculators' | 'ai-utilities' | 'developer-tools';
  categoryLabel: string;
  icon: string;
  keywords: string[];
  placeholderText: string;
  badge?: string;
  howToSteps: string[];
  faqList: { q: string; a: string }[];
  features: string[];
}

export const VIRAL_20_TOOLS: ToolItem[] = [
  // 1. Video & Social Downloaders
  {
    id: 'tool_1',
    slug: 'instagram-reels-downloader',
    title: 'Instagram Reels & Video Downloader (HD/1080p, No Watermark)',
    shortDesc: 'Download Instagram Reels, Videos, Stories and Audio in ultra-HD MP4 format for free in 1 click.',
    category: 'video-downloader',
    categoryLabel: 'Video Downloader',
    icon: '📸',
    keywords: ['instagram reels download', 'insta video saver', 'download ig stories', 'instagram reel to mp4'],
    placeholderText: 'Paste Instagram Reel or Post link here (e.g. https://www.instagram.com/reel/...)',
    badge: 'Trending 🔥',
    howToSteps: [
      'Copy the link of the Instagram Reel or Video you want to save.',
      'Paste the URL into the input box above.',
      'Click the "Download Reel" button and choose your preferred video quality.'
    ],
    faqList: [
      { q: 'Is this Instagram Reels downloader free to use?', a: 'Yes, our Instagram video downloader is 100% free with unlimited downloads and no login required.' },
      { q: 'Can I download Reels on Android and iPhone?', a: 'Yes! It works seamlessly on all web browsers across Android, iPhone, Windows, and Mac.' }
    ],
    features: ['High-Definition 1080p MP4 output', '100% Ad-Safe & Fast Cloud Processing', 'No login or Instagram credentials required', 'Works on private & public links']
  },
  {
    id: 'tool_2',
    slug: 'youtube-shorts-downloader',
    title: 'YouTube Shorts Downloader (Fast HD MP4 & Audio)',
    shortDesc: 'Save high-retention YouTube Shorts directly to your phone or PC in crisp 1080p resolution.',
    category: 'video-downloader',
    categoryLabel: 'Video Downloader',
    icon: '⚡',
    keywords: ['youtube shorts download', 'yt shorts to mp4', 'download youtube shorts 1080p', 'yt shorts saver'],
    placeholderText: 'Paste YouTube Shorts link (e.g. https://youtube.com/shorts/...)',
    badge: 'Popular ⭐',
    howToSteps: [
      'Open YouTube and copy the Shorts share link.',
      'Paste the URL into the search field.',
      'Click "Get Shorts" and download the MP4 file instantly.'
    ],
    faqList: [
      { q: 'Does this save Shorts in full quality?', a: 'Yes, it fetches the highest available resolution up to Full HD 1080p.' },
      { q: 'Is there any download limit?', a: 'No limits! You can download as many Shorts as you need.' }
    ],
    features: ['Direct high-speed MP4 extraction', 'No watermarks added', 'Mobile-friendly 1-click download', 'Instant video preview before saving']
  },
  {
    id: 'tool_3',
    slug: 'youtube-thumbnail-downloader',
    title: 'YouTube HD Thumbnail Downloader (4K / 1080p / MaxRes)',
    shortDesc: 'Extract and download highest quality YouTube video thumbnails in Ultra-HD 4K, 1080p, and Standard formats.',
    category: 'video-downloader',
    categoryLabel: 'Video Downloader',
    icon: '🖼️',
    keywords: ['youtube thumbnail downloader', 'download yt thumbnail 4k', 'get youtube banner image', 'maxresdefault download'],
    placeholderText: 'Paste any YouTube Video URL or Video ID...',
    badge: 'Creator Tool 🎨',
    howToSteps: [
      'Copy the YouTube video link from your browser or app.',
      'Paste the link into the box above.',
      'Instantly view and download MaxRes (1080p/4K), High, Medium, or Small thumbnails.'
    ],
    faqList: [
      { q: 'Why is MaxRes thumbnail sometimes not available?', a: 'If the video creator did not upload a 1080p thumbnail, the system automatically provides the next best HQ resolution.' },
      { q: 'Can I use this for inspiration & design analysis?', a: 'Yes, perfect for thumbnail designers and creators studying high-CTR concepts.' }
    ],
    features: ['Instant 4K & 1080p MaxRes extraction', 'Zero waiting time — client-side rendering', 'Download in JPG / WebP formats', 'Works for both long videos & Shorts']
  },
  {
    id: 'tool_4',
    slug: 'facebook-video-downloader',
    title: 'Facebook Video & Reels Downloader (HD / SD MP4)',
    shortDesc: 'Download Facebook watch videos, public reels, and viral clips in HD quality without third-party software.',
    category: 'video-downloader',
    categoryLabel: 'Video Downloader',
    icon: '📘',
    keywords: ['facebook video download', 'fb reels downloader', 'download fb watch video', 'fb video to mp4'],
    placeholderText: 'Paste Facebook video or reel link here...',
    howToSteps: [
      'Copy the Facebook video link from the share menu.',
      'Paste the link into the box above.',
      'Click "Download Video" and save to your device.'
    ],
    faqList: [
      { q: 'Can I download FB Reels?', a: 'Yes, all public Facebook Reels and Watch videos are supported.' }
    ],
    features: ['High-speed Facebook video fetching', 'Supports 1080p HD & 720p SD', 'Secure & Private']
  },
  {
    id: 'tool_5',
    slug: 'tiktok-video-downloader',
    title: 'TikTok Video Downloader Without Watermark',
    shortDesc: 'Save TikTok videos without the watermark in clean MP4 format with original sound.',
    category: 'video-downloader',
    categoryLabel: 'Video Downloader',
    icon: '🎵',
    keywords: ['tiktok downloader no watermark', 'download tiktok video', 'tiktok to mp4', 'snaptik online'],
    placeholderText: 'Paste TikTok video link here...',
    badge: 'Viral 🚀',
    howToSteps: ['Copy TikTok video link', 'Paste here', 'Click Download No-Watermark'],
    faqList: [{ q: 'Is it completely watermark-free?', a: 'Yes, it strips the overlay for clean personal offline viewing.' }],
    features: ['No watermark MP4', 'Original high-bitrate audio', 'Unlimited free downloads']
  },
  {
    id: 'tool_6',
    slug: 'twitter-x-video-downloader',
    title: 'Twitter / X Video & GIF Downloader',
    shortDesc: 'Download videos, GIFs, and media clips from Twitter (X) in MP4 format with multiple resolutions.',
    category: 'video-downloader',
    categoryLabel: 'Video Downloader',
    icon: '🐦',
    keywords: ['twitter video downloader', 'x video download', 'download twitter gif', 'twdown mp4'],
    placeholderText: 'Paste Twitter / X post link (e.g. https://x.com/user/status/...)',
    howToSteps: ['Copy the tweet/post link', 'Paste above', 'Select quality and download'],
    faqList: [{ q: 'Does it support GIF download?', a: 'Yes, Twitter GIFs are saved as smooth MP4 files.' }],
    features: ['Supports 720p and 1080p', 'Fast tweet parsing', 'Zero ads during download']
  },
  {
    id: 'tool_7',
    slug: 'youtube-to-mp3-audio-extractor',
    title: 'YouTube & Media to MP3 Audio Extractor',
    shortDesc: 'Extract clean 320kbps MP3 audio from online videos, podcasts, and speeches.',
    category: 'video-downloader',
    categoryLabel: 'Audio Converter',
    icon: '🎧',
    keywords: ['youtube to mp3', 'yt audio download', 'extract mp3 from video', 'online audio converter'],
    placeholderText: 'Paste media URL to extract MP3 audio...',
    howToSteps: ['Paste video URL', 'Click Extract Audio', 'Save high-bitrate MP3'],
    faqList: [{ q: 'What is the audio bitrate?', a: 'We output crystal clear 320kbps audio.' }],
    features: ['High quality 320kbps MP3', 'Fast conversion', 'Works on mobile & PC']
  },

  // 2. Media & Image Utilities
  {
    id: 'tool_8',
    slug: 'image-background-remover',
    title: 'AI Image Background Remover (1-Click Transparent PNG)',
    shortDesc: 'Remove backgrounds from photos, product images, and portraits in seconds with smart AI edge detection.',
    category: 'media-editor',
    categoryLabel: 'Media Editor',
    icon: '✂️',
    keywords: ['remove bg free', 'transparent background maker', 'ai background remover', 'cutout photo png'],
    placeholderText: 'Upload or drag and drop your photo...',
    badge: 'AI Powered 🤖',
    howToSteps: ['Upload any JPG/PNG image', 'AI automatically detects subject and removes background', 'Download transparent PNG'],
    faqList: [{ q: 'Is my uploaded photo kept private?', a: 'Yes, images are processed securely and never stored.' }],
    features: ['Precise hair & edge detection', 'High-res transparent PNG output', '100% Free with no watermarks']
  },
  {
    id: 'tool_9',
    slug: 'image-compressor-webp-converter',
    title: 'Smart Image Compressor & WebP Converter (TinyPNG Alternative)',
    shortDesc: 'Compress PNG, JPEG, and WebP images by up to 85% without noticeable loss in visual quality.',
    category: 'media-editor',
    categoryLabel: 'Media Editor',
    icon: '🗜️',
    keywords: ['image compressor online', 'compress png size', 'convert jpg to webp', 'tinypng free clone'],
    placeholderText: 'Drop images here to compress (Up to 10MB each)...',
    howToSteps: ['Select one or more images', 'Choose target quality or size', 'Download compressed files'],
    faqList: [{ q: 'How much file size is saved?', a: 'Typically 60% to 85% size reduction.' }],
    features: ['Client-side browser compression', 'Instant WebP / JPG / PNG export', 'Batch image processing']
  },
  {
    id: 'tool_10',
    slug: 'pdf-tools-merger-converter',
    title: 'All-in-One PDF Converter, Merger & Image to PDF',
    shortDesc: 'Convert Images (JPG/PNG) to PDF, merge multiple PDF documents, and organize files for government job forms.',
    category: 'media-editor',
    categoryLabel: 'PDF Tools',
    icon: '📄',
    keywords: ['jpg to pdf converter', 'merge pdf online', 'pdf compressor for govt form', 'ilovepdf free alternative'],
    placeholderText: 'Upload files to convert or merge into PDF...',
    howToSteps: ['Upload images or PDF pages', 'Arrange page order', 'Click Generate & Download PDF'],
    faqList: [{ q: 'Can I use this for online exam & job forms?', a: 'Yes, perfect for UPSC, SSC, state exam document uploads.' }],
    features: ['Multi-page image to PDF conversion', 'Instant client-side PDF creation', 'Zero data leaves your browser']
  },
  {
    id: 'tool_11',
    slug: 'qr-code-and-barcode-generator',
    title: 'Custom QR Code & UPI Payment Generator',
    shortDesc: 'Generate custom QR codes for Website Links, UPI Payments, Wi-Fi passwords, and WhatsApp with instant download.',
    category: 'media-editor',
    categoryLabel: 'Utility Tool',
    icon: '📱',
    keywords: ['qr code generator', 'upi payment qr maker', 'wifi qr code generator', 'custom qr with logo'],
    placeholderText: 'Enter text, URL, or UPI ID (e.g. yourname@upi)...',
    howToSteps: ['Enter your URL, UPI ID, or text', 'Select QR design or color', 'Download high-res PNG / SVG'],
    faqList: [{ q: 'Do these QR codes expire?', a: 'No, static QR codes are permanent and never expire.' }],
    features: ['UPI BharatQR compatibility', 'High-resolution PNG / SVG download', 'Instant live preview']
  },

  // 3. AI & Content Utilities
  {
    id: 'tool_12',
    slug: 'ai-text-humanizer-bypass',
    title: 'AI Text Humanizer & Paraphraser (Bypass AI Detection)',
    shortDesc: 'Convert robotic ChatGPT and AI content into natural, human-like readable text with high flow and zero AI footprint.',
    category: 'ai-utilities',
    categoryLabel: 'AI Utility',
    icon: '✍️',
    keywords: ['ai text humanizer', 'humanize chatgpt text', 'ai detector bypass', 'quillbot free alternative'],
    placeholderText: 'Paste AI-generated text here to humanize...',
    badge: 'Popular 🚀',
    howToSteps: ['Paste your AI text', 'Click "Humanize Text"', 'Copy 100% natural human-style output'],
    faqList: [{ q: 'Does it change the core meaning?', a: 'No, it preserves the exact facts while improving vocabulary and flow.' }],
    features: ['Natural sentence restructuring', 'Bypasses standard AI detection tools', 'Grammar and readability enhancement']
  },
  {
    id: 'tool_13',
    slug: 'viral-captions-hashtags-generator',
    title: 'AI Viral Captions & Hashtag Generator (Instagram / YouTube)',
    shortDesc: 'Generate high-engagement viral captions, hooks, and trending hashtags for Instagram Reels, Shorts, and TikTok.',
    category: 'ai-utilities',
    categoryLabel: 'AI Utility',
    icon: '🔥',
    keywords: ['viral instagram caption generator', 'trending hashtags for reels', 'youtube shorts hook generator'],
    placeholderText: 'Enter your video topic or niche (e.g. Travel, Tech, Fitness, Motivation)...',
    howToSteps: ['Enter your video niche', 'Select tone (Viral, Professional, Funny)', 'Copy high-retention hooks and tags'],
    faqList: [{ q: 'How do hashtags help?', a: 'Targeted hashtags boost discovery on the Explore page and Reels feed.' }],
    features: ['High-retention 3-second hook ideas', 'Researched low-competition hashtags', '1-Click copy to clipboard']
  },
  {
    id: 'tool_14',
    slug: 'meta-tag-and-seo-previewer',
    title: 'Social Share & Meta Tag SEO Previewer',
    shortDesc: 'Inspect and preview how your website link looks when shared on Google, WhatsApp, Facebook, and Twitter.',
    category: 'developer-tools',
    categoryLabel: 'Developer Tool',
    icon: '🔍',
    keywords: ['meta tag preview', 'og image checker', 'google serp simulator', 'social share preview'],
    placeholderText: 'Enter your website URL (e.g. https://yoursite.com)...',
    howToSteps: ['Enter URL', 'Inspect OpenGraph & Twitter Card tags', 'Generate optimal SEO meta code'],
    faqList: [{ q: 'Why do social previews fail?', a: 'Missing og:image or title tags prevent rich previews on WhatsApp/Twitter.' }],
    features: ['Google Search Snippet Preview', 'WhatsApp & Telegram card simulation', 'Instant meta tag generator']
  },
  {
    id: 'tool_15',
    slug: 'json-to-csv-excel-converter',
    title: 'JSON to CSV & Excel Table Converter',
    shortDesc: 'Convert complex JSON data and API payloads into clean, downloadable CSV and Excel spreadsheets instantly.',
    category: 'developer-tools',
    categoryLabel: 'Developer Tool',
    icon: '📊',
    keywords: ['json to csv converter', 'json to excel online', 'parse json data', 'jsonformatter table'],
    placeholderText: 'Paste JSON array or object here...',
    howToSteps: ['Paste JSON code', 'Auto-parse and preview table', 'Download CSV or Excel file'],
    faqList: [{ q: 'Is large JSON supported?', a: 'Yes, client-side streaming handles thousands of rows smoothly.' }],
    features: ['Flatten nested JSON objects', 'Download as clean CSV', 'Syntax error highlighting']
  },

  // 4. High-Traffic Calculators
  {
    id: 'tool_16',
    slug: 'pm-surya-ghar-solar-calculator',
    title: 'PM Surya Ghar Solar Subsidy & Rooftop Calculator (2026)',
    shortDesc: 'Calculate exact government subsidy (Up to ₹78,000), system cost, and monthly electricity bill savings for rooftop solar.',
    category: 'calculators',
    categoryLabel: 'Calculator',
    icon: '☀️',
    keywords: ['pm surya ghar subsidy calculator', 'solar rooftop calculator india', 'muft bijli yojana subsidy chart'],
    placeholderText: 'Enter your average monthly electricity bill (in ₹)...',
    badge: 'Govt Scheme ⚡',
    howToSteps: ['Enter monthly electricity bill', 'Select roof space available', 'Get instant subsidy & ROI breakdown'],
    faqList: [{ q: 'What is the maximum subsidy?', a: 'Up to ₹78,000 for 3kW or higher residential systems.' }],
    features: ['Official 2026 Subsidy Slab calculation', '25-Year savings projection', 'Direct link to national solar portal']
  },
  {
    id: 'tool_17',
    slug: 'sip-mutual-fund-and-emi-calculator',
    title: 'SIP Mutual Fund Wealth & Home Loan EMI Calculator',
    shortDesc: 'Calculate mutual fund returns, compound interest growth, and bank loan EMIs with amortization schedules.',
    category: 'calculators',
    categoryLabel: 'Finance Tool',
    icon: '📈',
    keywords: ['sip calculator', 'mutual fund return calculator', 'home loan emi calculator', 'compound interest calculator'],
    placeholderText: 'Enter monthly SIP amount (e.g. 5000)...',
    howToSteps: ['Set monthly investment', 'Choose expected return rate and duration', 'View visual growth chart and maturity value'],
    faqList: [{ q: 'How is SIP return calculated?', a: 'Uses standard compound annualized growth rate (CAGR) formula.' }],
    features: ['Interactive sliders & charts', 'Inflation-adjusted wealth estimate', 'Loan prepayment savings comparison']
  },
  {
    id: 'tool_18',
    slug: 'age-calculator-govt-jobs',
    title: 'Exact Age Calculator for Govt Job Forms & Eligibility',
    shortDesc: 'Calculate your exact age in Years, Months, Days, and Hours as on any cutoff date for SSC, UPSC, and state exam forms.',
    category: 'calculators',
    categoryLabel: 'Calculator',
    icon: '🎂',
    keywords: ['age calculator online', 'govt job age eligibility calculator', 'ssc age cutoff calculator'],
    placeholderText: 'Select your Date of Birth...',
    howToSteps: ['Select Date of Birth', 'Select Exam Cutoff Date', 'Get exact age breakdown down to seconds'],
    faqList: [{ q: 'Can I check age as on a future date?', a: 'Yes, enter any future notification cutoff date.' }],
    features: ['Exact years, months, and days breakdown', 'Upcoming birthday countdown', 'One-click copy for job forms']
  },
  {
    id: 'tool_19',
    slug: 'typing-speed-test-hindi-english',
    title: 'Online Typing Speed Test (Hindi & English Exam Practice)',
    shortDesc: 'Test and boost your Words Per Minute (WPM) and accuracy with real-time feedback for competitive typing exams.',
    category: 'developer-tools',
    categoryLabel: 'Productivity',
    icon: '⌨️',
    keywords: ['typing speed test online', 'wpm test hindi english', 'ssc typing test practice', '10fastfingers test'],
    placeholderText: 'Start typing the words above to begin timer...',
    howToSteps: ['Choose 1-minute or 3-minute test', 'Type words as they appear', 'Get detailed WPM & accuracy scorecard'],
    faqList: [{ q: 'What is a good typing speed?', a: '40+ WPM is considered good; 60+ WPM is professional speed.' }],
    features: ['Real-time WPM & error calculation', 'Hindi & English passage modes', 'Instant practice certificate']
  },
  {
    id: 'tool_20',
    slug: 'secure-password-and-token-generator',
    title: 'Strong Password & API Secret Token Generator',
    shortDesc: 'Generate unhackable, cryptographically secure passwords, UUIDs, and API secret keys in 1 click.',
    category: 'developer-tools',
    categoryLabel: 'Security Tool',
    icon: '🔐',
    keywords: ['password generator online', 'strong password maker', 'generate uuid api token', 'random string generator'],
    placeholderText: 'Click generate to create secure keys...',
    howToSteps: ['Select length and character rules', 'Click Generate', 'Copy secure password with 1 click'],
    faqList: [{ q: 'Are passwords generated securely?', a: 'Yes, uses browser crypto.getRandomValues API client-side.' }],
    features: ['Cryptographically secure generation', 'Customizable symbols & uppercase rules', 'Password strength score meter']
  }
];
