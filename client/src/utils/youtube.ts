/**
 * Utility functions for parsing, detecting, and formatting Video URLs & Embeds
 * Supports: YouTube, Cloud Direct MP4/WebM, Google Cloud Storage, Cloudinary,
 * AWS S3, Supabase, Firebase, Vimeo, and Google Drive.
 */

export type VideoType = 'youtube' | 'vimeo' | 'google_drive' | 'cloud_direct' | 'none';

export interface VideoProviderInfo {
  type: VideoType;
  label: string;
  badgeClass: string;
  icon: 'youtube' | 'cloud' | 'drive' | 'vimeo' | 'file';
  description: string;
}

export function extractYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const clean = urlOrId.trim();

  // If already an 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  // Regex covering standard watch, youtu.be, embed, and shorts
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = clean.match(regExp);

  return match ? match[1] : null;
}

export function extractGoogleDriveId(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  const match = clean.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function getGoogleDriveEmbedUrl(url?: string): string | null {
  const id = extractGoogleDriveId(url);
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}

export function extractVimeoId(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function getVimeoEmbedUrl(url?: string): string | null {
  const id = extractVimeoId(url);
  return id ? `https://player.vimeo.com/video/${id}` : null;
}

export function detectVideoType(url?: string): VideoType {
  if (!url || typeof url !== 'string' || !url.trim()) return 'none';
  const clean = url.trim().toLowerCase();

  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'youtube';
  if (clean.includes('drive.google.com')) return 'google_drive';
  if (clean.includes('vimeo.com')) return 'vimeo';

  // Direct video links or cloud storage providers
  if (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    clean.includes('.mp4?') ||
    clean.includes('.webm?') ||
    clean.includes('commondatastorage.googleapis.com') ||
    clean.includes('storage.googleapis.com') ||
    clean.includes('res.cloudinary.com') ||
    clean.includes('firebasestorage.googleapis.com') ||
    clean.includes('supabase.co/storage') ||
    clean.includes('s3.amazonaws.com') ||
    clean.includes('b-cdn.net') ||
    clean.includes('mediadelivery.net') ||
    clean.includes('cloudfront.net') ||
    clean.startsWith('http://') ||
    clean.startsWith('https://')
  ) {
    return 'cloud_direct';
  }

  return 'none';
}

export function getVideoProviderInfo(url?: string): VideoProviderInfo {
  const type = detectVideoType(url);
  const clean = (url || '').toLowerCase();

  if (type === 'youtube') {
    return {
      type: 'youtube',
      label: 'YouTube (Unlisted / Public)',
      badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      icon: 'youtube',
      description: 'Free unlimited hosting. Best for public, preview, or unlisted lectures.',
    };
  }

  if (type === 'google_drive') {
    return {
      type: 'google_drive',
      label: 'Google Drive Stream',
      badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      icon: 'drive',
      description: 'Free 15GB storage. Auto-converted to interactive preview embed player.',
    };
  }

  if (type === 'vimeo') {
    return {
      type: 'vimeo',
      label: 'Vimeo Video',
      badgeClass: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
      icon: 'vimeo',
      description: 'Vimeo player embed.',
    };
  }

  if (type === 'cloud_direct') {
    let cloudName = 'Cloud Direct Video';
    if (clean.includes('commondatastorage.googleapis.com') || clean.includes('storage.googleapis.com')) {
      cloudName = 'Google Cloud Storage (GCS)';
    } else if (clean.includes('cloudinary.com')) {
      cloudName = 'Cloudinary CDN';
    } else if (clean.includes('firebasestorage.googleapis.com')) {
      cloudName = 'Firebase Storage';
    } else if (clean.includes('supabase.co')) {
      cloudName = 'Supabase Storage';
    } else if (clean.includes('s3.amazonaws.com')) {
      cloudName = 'Amazon S3 Bucket';
    } else if (clean.includes('b-cdn.net') || clean.includes('mediadelivery.net')) {
      cloudName = 'BunnyCDN Stream';
    } else if (clean.endsWith('.mp4') || clean.includes('.mp4?')) {
      cloudName = 'Direct MP4 Stream';
    }

    return {
      type: 'cloud_direct',
      label: cloudName,
      badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      icon: 'cloud',
      description: 'High-performance HTML5 player with speed control, 10s skip, PiP & download protection.',
    };
  }

  return {
    type: 'none',
    label: 'No Video Attached',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: 'file',
    description: 'Lesson will be rendered as an interactive reading & code architecture lecture.',
  };
}

export function detectVideoSource(url?: string): 'YouTube' | 'Vimeo' | 'MP4' | 'Embed' | 'None' {
  if (!url || typeof url !== 'string') return 'None';
  const clean = url.trim().toLowerCase();
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'YouTube';
  if (clean.includes('vimeo.com')) return 'Vimeo';
  if (clean.includes('drive.google.com')) return 'Embed';
  if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.m3u8')) return 'MP4';
  if (clean.startsWith('http://') || clean.startsWith('https://')) return 'MP4';
  return 'None';
}

export function getYouTubeEmbedUrl(urlOrId?: string, autoplay: boolean = false): string | null {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1&iv_load_policy=3${autoplay ? '&autoplay=1' : ''}`;
}

export function getYouTubeThumbnailUrl(urlOrId?: string): string | null {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeMaxResThumbnailUrl(urlOrId?: string): string | null {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;

  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getYouTubeWatchUrl(urlOrId?: string): string | null {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;

  return `https://www.youtube.com/watch?v=${videoId}`;
}

