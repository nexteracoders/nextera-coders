import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { BrandLogo } from './BrandLogo';
import {
  MapPin,
  Flame,
  Navigation,
  Smartphone,
  Laptop,
  Download,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { settingsService, PublicSettings, DEFAULT_PUBLIC_SETTINGS } from '../../services/settings.service';
import { SocialLinksBar } from './SocialIcons';
import { pwaService } from '../../services/pwa.service';
import { footerService, FooterLinkItem } from '../../services/footer.service';

// Default static fallback links to avoid any flicker before API responds
const DEFAULT_COMPANY_LINKS: FooterLinkItem[] = [
  { _id: 'c1', column: 'company', columnTitle: 'Company', title: 'About NextEra', url: ROUTES.ABOUT, order: 1, isActive: true, isExternal: false },
  { _id: 'c2', column: 'company', columnTitle: 'Company', title: 'Careers', url: ROUTES.CAREERS, badge: 'Hiring', badgeType: 'amber', order: 2, isActive: true, isExternal: false },
  { _id: 'c3', column: 'company', columnTitle: 'Company', title: 'Pro One VIP', url: ROUTES.PRO_ONE, badge: 'VIP', badgeType: 'vip', order: 3, isActive: true, isExternal: false },
  { _id: 'c4', column: 'company', columnTitle: 'Company', title: 'Contact & Support', url: 'mailto:support@nexteracoders.com', order: 4, isActive: true, isExternal: true },
  { _id: 'c5', column: 'company', columnTitle: 'Company', title: 'Member Sign In', url: ROUTES.LOGIN, order: 5, isActive: true, isExternal: false },
  { _id: 'c6', column: 'company', columnTitle: 'Company', title: 'Join as Student', url: ROUTES.REGISTER, order: 6, isActive: true, isExternal: false },
];

const DEFAULT_EXPLORE_LINKS: FooterLinkItem[] = [
  { _id: 'e1', column: 'explore', columnTitle: 'Explore', title: 'Top Interview 150', url: ROUTES.TOP_INTERVIEW_150, badge: 'Hot', badgeType: 'hot', order: 1, isActive: true, isExternal: false },
  { _id: 'e2', column: 'explore', columnTitle: 'Explore', title: 'POTD & Problem Arena', url: ROUTES.PRACTICE, order: 2, isActive: true, isExternal: false },
  { _id: 'e3', column: 'explore', columnTitle: 'Explore', title: 'Weekly Contests', url: ROUTES.CONTEST, badge: 'Live', badgeType: 'live', order: 3, isActive: true, isExternal: false },
  { _id: 'e4', column: 'explore', columnTitle: 'Explore', title: 'NEC Code Battle', url: ROUTES.DUELS, badge: 'Free', badgeType: 'free', order: 4, isActive: true, isExternal: false },
  { _id: 'e5', column: 'explore', columnTitle: 'Explore', title: 'NEC Prime Battle', url: ROUTES.PRIME_DUELS, badge: '🪙 Staked', badgeType: 'amber', order: 5, isActive: true, isExternal: false },
  { _id: 'e6', column: 'explore', columnTitle: 'Explore', title: 'In-Browser IDE', url: ROUTES.COMPILER, badge: 'Pro', badgeType: 'default', order: 6, isActive: true, isExternal: false },
  { _id: 'e7', column: 'explore', columnTitle: 'Explore', title: 'Technical Quizzes', url: ROUTES.QUIZZES, order: 7, isActive: true, isExternal: false },
  { _id: 'e8', column: 'explore', columnTitle: 'Explore', title: 'Production Projects', url: ROUTES.PROJECTS, order: 8, isActive: true, isExternal: false },
  { _id: 'e9', column: 'explore', columnTitle: 'Explore', title: 'Rewards & Coins Store', url: ROUTES.REWARDS, order: 9, isActive: true, isExternal: false },
  { _id: 'e10', column: 'explore', columnTitle: 'Explore', title: 'Explore All Tracks', url: ROUTES.EXPLORE, order: 10, isActive: true, isExternal: false },
];

const DEFAULT_TUTORIAL_LINKS: FooterLinkItem[] = [
  { _id: 't1', column: 'tutorials', columnTitle: 'Tutorials', title: 'Python 3.12 Guide', url: `${ROUTES.TUTORIALS}?track=python`, order: 1, isActive: true, isExternal: false },
  { _id: 't2', column: 'tutorials', columnTitle: 'Tutorials', title: 'DSA & Algorithms', url: `${ROUTES.TUTORIALS}?track=dsa`, order: 2, isActive: true, isExternal: false },
  { _id: 't3', column: 'tutorials', columnTitle: 'Tutorials', title: 'React & Next.js 15', url: `${ROUTES.TUTORIALS}?track=react`, order: 3, isActive: true, isExternal: false },
  { _id: 't4', column: 'tutorials', columnTitle: 'Tutorials', title: 'Java 21 Enterprise', url: `${ROUTES.TUTORIALS}?track=java`, order: 4, isActive: true, isExternal: false },
  { _id: 't5', column: 'tutorials', columnTitle: 'Tutorials', title: 'C++20 & STL Systems', url: `${ROUTES.TUTORIALS}?track=cpp`, order: 5, isActive: true, isExternal: false },
  { _id: 't6', column: 'tutorials', columnTitle: 'Tutorials', title: 'System Design (HLD/LLD)', url: `${ROUTES.TUTORIALS}?track=systemdesign`, order: 6, isActive: true, isExternal: false },
  { _id: 't7', column: 'tutorials', columnTitle: 'Tutorials', title: 'DevOps, Docker & K8s', url: `${ROUTES.TUTORIALS}?track=devops`, order: 7, isActive: true, isExternal: false },
  { _id: 't8', column: 'tutorials', columnTitle: 'Tutorials', title: 'AI, ML & Generative AI', url: `${ROUTES.TUTORIALS}?track=ml`, order: 8, isActive: true, isExternal: false },
];

const DEFAULT_COURSE_LINKS: FooterLinkItem[] = [
  { _id: 'co1', column: 'courses', columnTitle: 'Courses', title: 'Full-Stack Web Dev', url: '/courses/full-stack-web-development', order: 1, isActive: true, isExternal: false },
  { _id: 'co2', column: 'courses', columnTitle: 'Courses', title: 'Python & Data Science', url: '/courses/python-for-data-science', order: 2, isActive: true, isExternal: false },
  { _id: 'co3', column: 'courses', columnTitle: 'Courses', title: 'DSA & Placement Mastery', url: '/courses/dsa-mastery-course', order: 3, isActive: true, isExternal: false },
  { _id: 'co4', column: 'courses', columnTitle: 'Courses', title: 'Java Backend & Spring', url: '/courses/java-fullstack-mastery', order: 4, isActive: true, isExternal: false },
  { _id: 'co5', column: 'courses', columnTitle: 'Courses', title: 'All Pro Video Tracks', url: ROUTES.COURSES, order: 5, isActive: true, isExternal: false },
  { _id: 'co6', column: 'courses', columnTitle: 'Courses', title: 'Verify Certificates', url: ROUTES.VERIFY_CERTIFICATE.replace(':certificateId', 'DEMO-VERIFY'), badge: 'Verify', badgeType: 'emerald', order: 6, isActive: true, isExternal: false },
];

export const Footer: React.FC = () => {
  const [platformSettings, setPlatformSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Dynamic footer links state
  const [footerGroups, setFooterGroups] = useState<Record<string, { columnKey: string; columnTitle: string; links: FooterLinkItem[] }>>({
    company: { columnKey: 'company', columnTitle: 'Company', links: DEFAULT_COMPANY_LINKS },
    explore: { columnKey: 'explore', columnTitle: 'Explore', links: DEFAULT_EXPLORE_LINKS },
    tutorials: { columnKey: 'tutorials', columnTitle: 'Tutorials', links: DEFAULT_TUTORIAL_LINKS },
    courses: { columnKey: 'courses', columnTitle: 'Courses', links: DEFAULT_COURSE_LINKS },
  });

  useEffect(() => {
    setIsPwaInstalled(pwaService.isInstalled());
    setIsMobileDevice(pwaService.isMobile());

    const handleInstalled = () => setIsPwaInstalled(true);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pwa-installed-success', handleInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pwa-installed-success', handleInstalled);
    };
  }, []);

  const handleInstallApp = (e: React.MouseEvent) => {
    e.preventDefault();
    pwaService.openInstallModal();
  };

  useEffect(() => {
    let isMounted = true;
    settingsService.getPublicSettings().then((data) => {
      if (isMounted && data) {
        setPlatformSettings(data);
      }
    });

    // Fetch dynamic footer links from backend API
    footerService.getPublicLinks()
      .then((res) => {
        if (isMounted && res?.grouped && Object.keys(res.grouped).length > 0) {
          setFooterGroups((prev) => ({
            ...prev,
            ...res.grouped,
          }));
        }
      })
      .catch((err) => {
        console.warn('Using default footer links due to API issue:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeLocations =
    platformSettings.locations && platformSettings.locations.length > 0
      ? platformSettings.locations.filter((l) => l.isActive !== false)
      : DEFAULT_PUBLIC_SETTINGS.locations;

  // Helper for badge color styling
  const getBadgeStyle = (badgeType?: string) => {
    switch (badgeType) {
      case 'hot':
      case 'rose':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'live':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'free':
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'vip':
      case 'purple':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20';
    }
  };

  // Helper to render individual footer link item with animated arrow on the right side (no text shaking)
  const renderFooterLink = (link: FooterLinkItem) => {
    const isExternal = Boolean(link.isExternal) || link.url.startsWith('http') || link.url.startsWith('mailto:');
    const badgeStyle = getBadgeStyle(link.badgeType);

    const innerContent = (
      <span className="group inline-flex items-center gap-1.5 py-0.5 text-xs text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors cursor-pointer">
        {/* Link Text - Completely stable position, zero shaking */}
        <span>{link.title}</span>

        {/* Optional Badge */}
        {link.badge && (
          <span
            className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded-md border flex items-center gap-0.5 ${badgeStyle}`}
          >
            {link.badge.toLowerCase().includes('hiring') && (
              <Flame className="w-2.5 h-2.5 fill-amber-500 shrink-0" />
            )}
            <span>{link.badge}</span>
          </span>
        )}

        {/* Animated Arrow Icon on Right Side - slides in from left on hover */}
        <span className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out text-amber-500 shrink-0 flex items-center">
          <ArrowRight className="w-3 h-3" />
        </span>
      </span>
    );

    return (
      <li key={link._id || link.title}>
        {isExternal ? (
          <a
            href={link.url}
            target={link.url.startsWith('mailto:') ? '_self' : '_blank'}
            rel="noreferrer"
            className="block"
          >
            {innerContent}
          </a>
        ) : (
          <Link to={link.url} className="block">
            {innerContent}
          </Link>
        )}
      </li>
    );
  };

  // Extract columns
  const companyLinks = footerGroups['company']?.links || DEFAULT_COMPANY_LINKS;
  const exploreLinks = footerGroups['explore']?.links || DEFAULT_EXPLORE_LINKS;
  const tutorialLinks = footerGroups['tutorials']?.links || DEFAULT_TUTORIAL_LINKS;
  const courseLinks = footerGroups['courses']?.links || DEFAULT_COURSE_LINKS;

  // Custom columns (any column other than standard 4)
  const customColumnKeys = Object.keys(footerGroups).filter(
    (k) => !['company', 'explore', 'tutorials', 'courses'].includes(k.toLowerCase())
  );

  return (
    <footer className="border-t border-slate-200/90 dark:border-dark-800 bg-white dark:bg-dark-950 transition-colors mt-auto font-sans">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand & Corporate Addresses Column */}
          <div className="lg:col-span-2 space-y-5">
            <BrandLogo size="lg" />
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              {platformSettings.tagline ? (
                <span>
                  The premier interactive developer learning platform designed to help engineers master algorithms, build real-world software, and scale their careers.
                </span>
              ) : (
                'The premier interactive developer learning platform.'
              )}
            </p>

            {/* Corporate Office & Campus Locations */}
            <div className="space-y-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
              {activeLocations.map((loc, idx) => (
                <div key={loc.id || idx} className="flex items-start gap-2.5 group">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        {loc.title}:
                      </span>
                      {loc.badge && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-dark-700">
                          {loc.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {loc.address}, {loc.city}, {loc.state} ({loc.pincode})
                    </p>
                    {loc.mapUrl && (
                      <a
                        href={loc.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-mono"
                      >
                        <Navigation className="w-2.5 h-2.5" />
                        <span>Get Directions</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Social Media Links */}
            <div className="pt-2">
              <SocialLinksBar
                socialLinks={platformSettings.socialLinks}
                size="md"
              />
            </div>

            {/* Interactive Install NEC App Card */}
            <div className="pt-1">
              <div className="rounded-2xl bg-slate-50/90 dark:bg-dark-900/90 border border-slate-200/90 dark:border-dark-800/80 p-3 sm:p-3.5 shadow-xs hover:border-brand-500/30 transition-all max-w-sm">
                <div className="flex items-center gap-3">
                  {/* App Icon Tile */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black p-0.5 shrink-0 shadow-xs border border-slate-200/60 dark:border-dark-700/80 flex items-center justify-center overflow-hidden">
                    <img
                      src="/icon-192.png"
                      alt="NextEra Coders App"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>

                  {/* App Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight truncate">
                        NextEra Coders
                      </h5>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/80 dark:text-brand-400 border border-brand-500/20">
                        PWA App
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                      {isMobileDevice
                        ? 'Fast IDE & instant offline access'
                        : 'Lightweight desktop app & fast IDE'}
                    </p>
                  </div>
                </div>

                {/* Install Button Container */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-dark-800/80 flex items-center justify-end">
                  {isPwaInstalled ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-full sm:w-auto justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>NEC App Installed</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInstallApp}
                      className="w-full sm:w-auto px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-sm shadow-brand-500/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Install NextEra Coders App"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {isMobileDevice ? 'Install App' : 'Install Desktop App'}
                      </span>
                      <span className="sm:hidden">
                        Install App
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Links Section: 2 Columns on Mobile, 4 Columns on Tablet/Desktop (+ any custom columns) */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8">
            {/* Column 1: Company */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono flex items-center gap-1.5">
                <span>{footerGroups['company']?.columnTitle || 'Company'}</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {companyLinks.map(renderFooterLink)}
                {/* Embedded App quick link */}
                <li>
                  <button
                    type="button"
                    onClick={handleInstallApp}
                    className="group w-full text-left text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors flex items-center justify-between cursor-pointer py-0.5"
                    title="Install NextEra Coders Progressive Web App"
                  >
                    <span className="flex items-center gap-1.5">
                      {isMobileDevice ? (
                        <Smartphone className="w-3.5 h-3.5 text-brand-500 group-hover:scale-110 transition-transform" />
                      ) : (
                        <Laptop className="w-3.5 h-3.5 text-brand-500 group-hover:scale-110 transition-transform" />
                      )}
                      <span>Install NEC App</span>
                      <span className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out text-amber-500 flex items-center">
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                      {isPwaInstalled ? 'Installed' : 'PWA'}
                    </span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Explore */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono flex items-center gap-1.5">
                <span>{footerGroups['explore']?.columnTitle || 'Explore'}</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {exploreLinks.map(renderFooterLink)}
              </ul>
            </div>

            {/* Column 3: Tutorials */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono flex items-center gap-1.5">
                <span>{footerGroups['tutorials']?.columnTitle || 'Tutorials'}</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {tutorialLinks.map(renderFooterLink)}
              </ul>
            </div>

            {/* Column 4: Courses */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono flex items-center gap-1.5">
                <span>{footerGroups['courses']?.columnTitle || 'Courses'}</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {courseLinks.map(renderFooterLink)}
              </ul>
            </div>

            {/* Optional Custom Columns dynamically created by admin (e.g. GATE CS) */}
            {customColumnKeys.map((colKey) => {
              const col = footerGroups[colKey];
              if (!col || !col.links || col.links.length === 0) return null;
              return (
                <div key={colKey} className="space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1.5">
                    <span>{col.columnTitle || colKey.toUpperCase()}</span>
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {col.links.map(renderFooterLink)}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar: Video Favicon, Copyright & Trust Badges */}
        <div className="border-t border-slate-200/90 dark:border-dark-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          {/* Left: NEC Looping Video Favicon + Copyright info */}
          <div className="flex items-center gap-3.5">
            {/* NEC Video Favicon Pill with wide ratio as used across the platform */}
            <div className="relative group shrink-0">
              <div className="w-[58px] sm:w-[68px] h-8 sm:h-9 rounded-xl bg-slate-950 border border-amber-500/40 p-0.5 overflow-hidden shadow-lg shadow-amber-500/10 flex items-center justify-center group-hover:scale-105 group-hover:border-amber-400 group-hover:shadow-amber-500/25 transition-all duration-300">
                <video
                  src="/favicon-video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              {/* Online Pulse Indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-950 flex items-center justify-center shadow-xs">
                <span className="w-1 h-1 rounded-full bg-white animate-ping" />
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
                <span>Copyright © {new Date().getFullYear()} NextEra Coders Education & Tech Pvt Ltd</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                <span>All rights reserved</span>
                <span className="text-slate-300 dark:text-dark-700">•</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">Empowering Next-Gen Software Engineers</span>
              </p>
            </div>
          </div>

          {/* Right: Security & Reliability Badges */}
          <div className="flex items-center gap-3.5 sm:gap-4 flex-wrap text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Sandbox Uptime</span>
            </span>
            <span className="text-slate-300 dark:text-dark-700 hidden sm:inline">•</span>
            <span className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-dark-900 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-dark-800">
              🔒 256-Bit SSL Encrypted
            </span>
            <span className="text-slate-300 dark:text-dark-700 hidden sm:inline">•</span>
            <span className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-dark-900 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-dark-800">
              ⚡ Industry Standards
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
