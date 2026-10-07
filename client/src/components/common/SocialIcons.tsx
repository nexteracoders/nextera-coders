import React from 'react';

interface IconProps {
  className?: string;
}

export const XIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const LinkedInIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.6a1.64 1.64 0 0 0-1.64 1.63 1.64 1.64 0 0 0 1.64 1.64c.9 0 1.63-.74 1.63-1.64A1.64 1.64 0 0 0 7.83 6.6z" />
  </svg>
);

export const InstagramIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const YouTubeIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const GitHubIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const BRAND_CONFIGS: Record<
  string,
  {
    name: string;
    icon: (cls?: string) => React.ReactNode;
    styleClass: string;
    badge: string;
  }
> = {
  github: {
    name: 'GitHub',
    icon: (cls) => <GitHubIcon className={cls || 'w-3.5 h-3.5'} />,
    styleClass:
      'bg-[#24292e] dark:bg-slate-800 text-white border-slate-700 shadow-sm hover:bg-slate-950 dark:hover:bg-slate-700 hover:scale-110 hover:-translate-y-0.5 hover:shadow-md',
    badge: 'GitHub Dark',
  },
  x: {
    name: 'X (Twitter)',
    icon: (cls) => <XIcon className={cls || 'w-3.5 h-3.5'} />,
    styleClass:
      'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-700 dark:border-slate-200 shadow-sm hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/40 dark:hover:shadow-white/25',
    badge: 'Sleek Black',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: (cls) => <XIcon className={cls || 'w-3.5 h-3.5'} />,
    styleClass:
      'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-700 dark:border-slate-200 shadow-sm hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/40 dark:hover:shadow-white/25',
    badge: 'Sleek Black',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: (cls) => <LinkedInIcon className={cls || 'w-3.5 h-3.5'} />,
    styleClass:
      'bg-[#0A66C2] text-white border-[#0A66C2] shadow-sm shadow-[#0A66C2]/20 hover:bg-[#004182] hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#0A66C2]/40',
    badge: 'Royal Blue',
  },
  instagram: {
    name: 'Instagram',
    icon: (cls) => <InstagramIcon className={cls || 'w-3.5 h-3.5'} />,
    styleClass:
      'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white border-transparent shadow-sm shadow-pink-500/20 hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:shadow-pink-500/40',
    badge: 'Sunset Gradient',
  },
  youtube: {
    name: 'YouTube',
    icon: (cls) => <YouTubeIcon className={cls || 'w-3.5 h-3.5'} />,
    styleClass:
      'bg-[#FF0000] text-white border-[#FF0000] shadow-sm shadow-red-500/20 hover:bg-[#cc0000] hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:shadow-red-500/40',
    badge: 'Official Red',
  },
};

interface SocialLinksBarProps {
  socialLinks?: {
    github?: string;
    twitter?: string;
    x?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export const SocialLinksBar: React.FC<SocialLinksBarProps> = ({
  socialLinks = {},
  size = 'md',
  showLabels = false,
  className = '',
}) => {
  const links: Array<{
    key: string;
    url: string;
    name: string;
    icon: React.ReactNode;
    styleClass: string;
  }> = [];

  const addLink = (key: string, url?: string) => {
    if (!url || !url.trim()) return;
    const config = BRAND_CONFIGS[key];
    if (!config) return;

    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
    links.push({
      key,
      url,
      name: config.name,
      icon: config.icon(iconSize),
      styleClass: config.styleClass,
    });
  };

  // Order of rendering: GitHub, X (Twitter), LinkedIn, Instagram, YouTube
  addLink('github', socialLinks.github);
  addLink('x', socialLinks.x || socialLinks.twitter);
  addLink('linkedin', socialLinks.linkedin);
  addLink('instagram', socialLinks.instagram);
  addLink('youtube', socialLinks.youtube);

  if (links.length === 0) return null;

  const btnPadding =
    size === 'sm'
      ? 'p-1.5 rounded-lg text-[10px]'
      : size === 'lg'
      ? 'p-2.5 rounded-xl text-xs'
      : 'p-1.5 rounded-lg text-xs';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {links.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          title={link.name}
          className={`group relative border ${btnPadding} transition-all duration-300 ease-out flex items-center gap-1.5 cursor-pointer ${link.styleClass}`}
        >
          <span className="transition-transform duration-300 group-hover:rotate-6">
            {link.icon}
          </span>
          {showLabels && (
            <span className="font-semibold text-[11px] transition-colors">{link.name}</span>
          )}
        </a>
      ))}
    </div>
  );
};
