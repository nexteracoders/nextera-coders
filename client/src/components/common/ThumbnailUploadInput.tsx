import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link2,
  Trash2,
  Sparkles,
  Youtube,
  AlertCircle,
} from 'lucide-react';
import { extractYouTubeId, getYouTubeMaxResThumbnailUrl } from '../../utils/youtube';

interface ThumbnailUploadInputProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  videoUrlForYouTubeThumbnail?: string;
  category?: string;
  className?: string;
}

// Curated high-res 16:9 tech presets for quick 1-click selection
const PRESET_THUMBNAILS = [
  {
    label: 'React & Next.js',
    url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1280&auto=format&fit=crop&q=80',
  },
  {
    label: 'Python & AI',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1280&auto=format&fit=crop&q=80',
  },
  {
    label: 'Full-Stack Web',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1280&auto=format&fit=crop&q=80',
  },
  {
    label: 'DSA & Algorithms',
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1280&auto=format&fit=crop&q=80',
  },
  {
    label: 'Cyber Security',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1280&auto=format&fit=crop&q=80',
  },
  {
    label: 'Cloud & DevOps',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&auto=format&fit=crop&q=80',
  },
];

export const ThumbnailUploadInput: React.FC<ThumbnailUploadInputProps> = ({
  value = '',
  onChange,
  label = 'Course / Lesson Thumbnail (16:9)',
  placeholder = 'Paste Image URL (Unsplash, Cloudinary, S3) or upload file...',
  helperText = 'Auto-adjusts to standard 16:9 YouTube format (1280x720 recommended).',
  videoUrlForYouTubeThumbnail,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if a YouTube thumbnail is available from the video URL
  const youtubeVideoId = videoUrlForYouTubeThumbnail
    ? extractYouTubeId(videoUrlForYouTubeThumbnail)
    : null;
  const youtubeThumbnailUrl = youtubeVideoId
    ? getYouTubeMaxResThumbnailUrl(youtubeVideoId)
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB for client base64 storage)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller image or use an image URL.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        onChange(base64Url);
        setImgError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseYouTubeThumbnail = () => {
    if (youtubeThumbnailUrl) {
      onChange(youtubeThumbnailUrl);
      setImgError(false);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-brand-500" /> {label}
        </label>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
              activeTab === 'url'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3 h-3 inline mr-1" /> URL
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              fileInputRef.current?.click();
            }}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3 h-3 inline mr-1" /> Upload
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* URL Input Box */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setImgError(false);
            }}
            placeholder={placeholder}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Upload Trigger Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shrink-0"
          title="Choose image file from computer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Browse</span>
        </button>
      </div>

      {/* Quick Action Presets & YouTube Auto-fetch */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {youtubeThumbnailUrl && (
          <button
            type="button"
            onClick={handleUseYouTubeThumbnail}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30 transition-colors shadow-2xs"
          >
            <Youtube className="w-3 h-3 text-rose-500" />
            Auto-Use YouTube Thumbnail
          </button>
        )}

        <span className="text-[10px] font-mono text-slate-400">Presets:</span>
        {PRESET_THUMBNAILS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              onChange(preset.url);
              setImgError(false);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
              value === preset.url
                ? 'bg-brand-500/10 text-brand-500 border-brand-500/30 font-bold'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {preset.label}
          </button>
        ))}

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setImgError(false);
            }}
            className="text-[10px] text-rose-500 hover:underline font-mono ml-auto flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Live 16:9 Thumbnail Preview Box */}
      {value ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-md group">
          {!imgError ? (
            <img
              src={value}
              alt="Thumbnail Preview"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center space-y-1">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <p className="text-xs font-mono text-amber-400">Image failed to load</p>
              <p className="text-[10px] text-slate-500">Please check the image URL or upload a local file.</p>
            </div>
          )}

          {/* Top 16:9 HD Badge */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-mono border border-white/10 flex items-center gap-1 pointer-events-none">
            <Sparkles className="w-3 h-3 text-brand-400" /> 16:9 YouTube Ratio
          </div>

          {/* Clear Button Hover Overlay */}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white text-xs opacity-0 group-hover:opacity-100 transition-all shadow-lg"
            title="Remove thumbnail"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-brand-500/5 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 group-hover:bg-brand-500/20 text-slate-400 group-hover:text-brand-500 flex items-center justify-center transition-colors mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Click to upload thumbnail or paste URL above
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            {helperText}
          </p>
        </div>
      )}
    </div>
  );
};
