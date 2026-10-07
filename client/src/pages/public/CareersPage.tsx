import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Section } from '../../components/ui/Section';
import { SectionHeading } from '../../components/ui/SectionHeading';
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  DollarSign,
  Search,
  Send,
  X,
  Flame,
  Upload,
  FileText,
  Eye,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useToast } from '../../components/ui/Toast';
import {
  careersService,
  IJobPosition,
} from '../../services/careers.service';

const VALUES = [
  {
    number: '01',
    title: 'Obsession with Developer Delight',
    desc: 'Every millisecond of latency in our compiler, every line of documentation, and every micro-animation is crafted with care.',
  },
  {
    number: '02',
    title: 'High Agency & First-Principles Thinking',
    desc: 'We look for people who take complete ownership of complex problems, think from fundamentals, and find creative solutions without waiting for permission.',
  },
  {
    number: '03',
    title: 'Continuous Mastery & Open Sharing',
    desc: 'We are lifelong learners who love sharing knowledge openly with our developer community and elevating teammates.',
  },
];

export const CareersPage: React.FC = () => {
  useDocumentTitle('Careers — Join the NextEra Coders Team');
  const { success, error: toastError } = useToast();

  const [jobs, setJobs] = useState<IJobPosition[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedRoleType, setSelectedRoleType] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedJob, setSelectedJob] = useState<IJobPosition | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<IJobPosition | null>(null);

  // Application Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [coverNote, setCoverNote] = useState('');
  
  // Mandatory Resume Upload State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeBase64, setResumeBase64] = useState<string>('');
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [resumeFileSize, setResumeFileSize] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Subscribe to real-time Admin Job Postings
  useEffect(() => {
    const unsub = careersService.subscribeJobs((list) => {
      setJobs(list.filter((j) => j.isActive).sort((a, b) => a.order - b.order));
    });
    return () => unsub();
  }, []);

  const departments = ['All', 'Engineering', 'Curriculum & Content', 'AI & ML', 'Product & Design', 'DevRel & Community', 'Marketing'];

  // Extract all unique skills dynamically from current active jobs
  const availableSkills = useMemo(() => {
    const skillSet = new Set<string>();
    jobs.forEach((j) => {
      j.tags?.forEach((t) => {
        if (t && t.trim()) skillSet.add(t.trim());
      });
    });
    return Array.from(skillSet).sort();
  }, [jobs]);

  const filteredPositions = jobs.filter((pos) => {
    const matchesDept = selectedDept === 'All' || pos.department === selectedDept;
    const matchesType = selectedRoleType === 'All' || pos.roleType === selectedRoleType;
    const matchesSkill =
      selectedSkill === 'All' ||
      (pos.tags && pos.tags.some((t) => t.toLowerCase() === selectedSkill.toLowerCase()));
    const matchesSearch =
      !searchQuery.trim() ||
      pos.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      pos.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.salaryOrStipend.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesType && matchesSkill && matchesSearch;
  });

  const handleOpenApply = (job: IJobPosition) => {
    setSelectedJob(job);
    setSubmitted(false);
    resetForm();
    setApplyModalOpen(true);
  };

  const handleOpenDetails = (job: IJobPosition) => {
    setSelectedJobForDetails(job);
    setDetailsModalOpen(true);
  };

  const handleOpenGeneralApply = () => {
    setSelectedJob({
      id: 'general-app',
      title: 'General Open Application (All Roles)',
      department: 'Engineering',
      roleType: 'Job',
      location: 'Remote',
      experience: 'Any Experience',
      salaryOrStipend: 'Competitive Package / Stipend',
      tags: ['Engineering', 'Design', 'Content', 'AI'],
      description: 'Tell us about your superpower and how you can accelerate the future of developer education.',
      responsibilities: [
        'Collaborate across engineering, content, and design teams.',
        'Contribute to building next-generation developer learning tools.',
        'Drive high-impact technical and educational breakthroughs.',
      ],
      requirements: [
        'Passion for software craft, developer education, and problem solving.',
        'Ability to work independently with high agency in a remote setting.',
      ],
      isActive: true,
      order: 99,
      createdAt: new Date().toISOString(),
    });
    setSubmitted(false);
    resetForm();
    setApplyModalOpen(true);
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setLinkedin('');
    setGithub('');
    setExperienceYears('');
    setCoverNote('');
    setResumeFile(null);
    setResumeBase64('');
    setResumeFileName('');
    setResumeFileSize('');
  };

  const resetFilters = () => {
    setSelectedDept('All');
    setSelectedRoleType('All');
    setSelectedSkill('All');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedDept !== 'All' ||
    selectedRoleType !== 'All' ||
    selectedSkill !== 'All' ||
    searchQuery.trim() !== '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toastError('Resume file size must be less than 10MB.');
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setResumeFile(file);
    setResumeFileName(file.name);
    setResumeFileSize(sizeFormatted);

    const reader = new FileReader();
    reader.onload = () => {
      setResumeBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toastError('Please enter your full name, email address, and phone number.');
      return;
    }

    if (!resumeFileName || (!resumeFile && !resumeBase64)) {
      toastError('Resume upload is compulsory. Please attach your PDF/DOC resume file.');
      return;
    }

    if (!selectedJob) return;

    setSubmitting(true);
    try {
      await careersService.submitApplication({
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        department: selectedJob.department,
        roleType: selectedJob.roleType,
        fullName,
        email,
        phone,
        linkedin,
        github,
        experienceYears,
        coverNote,
        resumeFileName: resumeFileName || 'candidate_resume.pdf',
        resumeFileSize: resumeFileSize || '1.0 MB',
        resumeBase64OrUrl: resumeBase64 || 'https://example.com/resume.pdf',
      });

      setSubmitting(false);
      setSubmitted(true);
      success(
        'Application submitted successfully! Our recruiting team has received your resume and details.',
        'Application Received 🚀'
      );
    } catch (err: any) {
      setSubmitting(false);
      toastError(err.message || 'Failed to submit application');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 transition-colors font-sans pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-6 pb-6 sm:pt-8 sm:pb-8">
        {/* Ambient Mixed RGB Lighting Aura in Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[360px] pointer-events-none -z-10 flex items-center justify-between opacity-50 dark:opacity-40 blur-3xl">
          <div className="w-72 h-72 rounded-full bg-rose-500/25" />
          <div className="w-72 h-72 rounded-full bg-emerald-500/25" />
          <div className="w-72 h-72 rounded-full bg-cyan-500/25" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Hero Container with Mix RGB Gradient Border & Glow (Matches width of content below) */}
          <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-r from-rose-500/50 via-emerald-500/50 to-cyan-500/50 shadow-xl shadow-brand-500/5 dark:shadow-black/40">
            {/* Inner Content Card */}
            <div className="relative rounded-[22px] bg-white/95 dark:bg-dark-900/95 backdrop-blur-2xl p-6 sm:p-8 lg:p-9 text-center space-y-5 overflow-hidden">
              {/* Top Accent Strip in Mix RGB */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-emerald-400 to-cyan-500" />

              {/* Ambient internal soft RGB spots */}
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-1/2 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 left-1/3 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Hiring Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-rose-500/10 via-emerald-500/10 to-cyan-500/10 border border-slate-200/80 dark:border-dark-700 text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs font-mono font-bold tracking-wide shadow-2xs">
                <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                <span>WE ARE HIRING JOBS & INTERNSHIPS — JOIN OUR MISSION</span>
              </div>

              {/* Main Headline with Mixed RGB Gradient Accent */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-3xl mx-auto">
                Build the Future of{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-indigo-500 to-cyan-500 dark:from-rose-400 dark:via-indigo-400 dark:to-cyan-400">
                  Developer Education & Tools
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                We’re creating high-performance in-browser IDEs, structured computer science curricula, and real-world project sandboxes. Join our fast-moving, remote-first team of passionate builders.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-0.5">
                <a
                  href="#open-roles"
                  className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/25 hover:shadow-brand-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <Briefcase className="w-4 h-4 group-hover:rotate-6 transition-transform" />
                  <span>Explore Open Roles ({jobs.length})</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <button
                  type="button"
                  onClick={handleOpenGeneralApply}
                  className="inline-flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-slate-50 dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-dark-700 shadow-2xs hover:border-brand-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <Send className="w-3.5 h-3.5 text-brand-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  <span>Submit General Application</span>
                </button>
              </div>

              {/* 4 Metrics Boxes (Restored with clean Mix RGB accents) */}
              <div className="pt-4 border-t border-slate-100 dark:border-dark-800/80">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 dark:bg-dark-850/60 hover:bg-white dark:hover:bg-dark-800 border border-slate-200/70 dark:border-dark-800 hover:border-rose-500/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
                    <span className="text-xl sm:text-2xl font-black text-rose-500 font-mono">100%</span>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Remote-First Culture</p>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 dark:bg-dark-850/60 hover:bg-white dark:hover:bg-dark-800 border border-slate-200/70 dark:border-dark-800 hover:border-blue-500/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
                    <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">50K+</span>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Active Developers</p>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 dark:bg-dark-850/60 hover:bg-white dark:hover:bg-dark-800 border border-slate-200/70 dark:border-dark-800 hover:border-emerald-500/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
                    <span className="text-xl sm:text-2xl font-black text-emerald-500 font-mono">4.9/5</span>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Team Satisfaction</p>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 dark:bg-dark-850/60 hover:bg-white dark:hover:bg-dark-800 border border-slate-200/70 dark:border-dark-800 hover:border-cyan-500/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
                    <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">Day 1</span>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">High Agency & Impact</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OPEN POSITIONS & SLEEK FILTERING */}
      <section id="open-roles" className="py-16 sm:py-20 bg-slate-100/60 dark:bg-dark-900/40 border-y border-slate-200/80 dark:border-dark-800 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold mb-2">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Currently Open Roles ({filteredPositions.length})</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Find Your Next Career Chapter at NextEra Coders
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Explore full-time jobs and student internships across our engineering, curriculum, AI, and design teams.
              </p>
            </div>
          </div>

          {/* Clean Unified Search & Filter Bar (Job Type & Skill Dropdowns) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Input */}
              <div className="relative lg:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search role, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              {/* Job Type Dropdown Filter */}
              <div>
                <select
                  value={selectedRoleType}
                  onChange={(e) => setSelectedRoleType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-850 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 cursor-pointer"
                >
                  <option value="All">All Job Types</option>
                  <option value="Job">💼 Full-Time Job</option>
                  <option value="Internship">🎓 Internship</option>
                  <option value="Part-time">⏱️ Part-Time</option>
                  <option value="Contract">📄 Contract</option>
                </select>
              </div>

              {/* Skill / Technology Dropdown Filter */}
              <div>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-850 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 cursor-pointer"
                >
                  <option value="All">All Skills & Technologies</option>
                  {availableSkills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Dropdown Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-850 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40 cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === 'All' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="p-2.5 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-750 text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                    title="Reset Filters"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job Listings Cards */}
          <div className="space-y-4">
            {filteredPositions.length === 0 ? (
              <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 space-y-3">
                <Briefcase className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No active roles match your filters</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try adjusting your role type, skill filter, or search query. You can also submit a general application.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-dark-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={handleOpenGeneralApply}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs font-mono shadow-md shadow-brand-500/20 cursor-pointer"
                  >
                    Submit Open Application
                  </button>
                </div>
              </div>
            ) : (
              filteredPositions.map((job) => (
                <div
                  key={job.id}
                  className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 shadow-xs hover:shadow-xl hover:border-brand-500/40 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
                >
                  <div className="space-y-3 max-w-3xl flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                        {job.department}
                      </span>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border',
                          job.roleType === 'Internship'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        )}
                      >
                        {job.roleType === 'Internship' ? '🎓 Internship' : '💼 Full-Time Job'}
                      </span>
                      {job.isHot && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-rose-500" />
                          <span>Urgent Hiring</span>
                        </span>
                      )}
                    </div>

                    <div>
                      {/* Clickable Job Title - Logo Brand Blue on Hover */}
                      <h3
                        onClick={() => handleOpenDetails(job)}
                        className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors cursor-pointer hover:underline inline-block"
                        title="Click to view full job details"
                      >
                        {job.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                        {job.description}
                      </p>
                    </div>

                    {/* Metadata & Tags */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {job.experience}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.salaryOrStipend}
                      </span>
                    </div>

                    {/* Tech Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-dark-750"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Small Details button + Logo Blue Apply button */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                    <button
                      onClick={() => handleOpenDetails(job)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:border-brand-500/40 shadow-2xs group/btn"
                      title="View full job requirements and details"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 group-hover/btn:scale-110 transition-transform" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenApply(job)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs font-mono shadow-md hover:shadow-lg shadow-brand-500/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 3. CULTURE & VALUES */}
      <Section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto space-y-12">
          <SectionHeading
            badge="Our Culture Code"
            title="How We Work & What We Value"
            subtitle="We hire exceptional talent and empower them with extreme autonomy to innovate."
            highlightText="How We Work"
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((val, idx) => (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs relative overflow-hidden space-y-3"
              >
                <span className="text-4xl font-black font-mono text-slate-100 dark:text-dark-800 absolute right-4 top-4 select-none">
                  {val.number}
                </span>
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-mono font-bold text-xs">
                  {val.number}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {val.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. COMPREHENSIVE JOB DETAILS MODAL */}
      {detailsModalOpen && selectedJobForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-dark-800/80 flex items-start justify-between bg-slate-50/50 dark:bg-dark-900/50 gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    {selectedJobForDetails.department}
                  </span>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border',
                      selectedJobForDetails.roleType === 'Internship'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    )}
                  >
                    {selectedJobForDetails.roleType === 'Internship' ? '🎓 Internship' : '💼 Full-Time Job'}
                  </span>
                  {selectedJobForDetails.isHot && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-rose-500" />
                      <span>Urgent Hiring</span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {selectedJobForDetails.title}
                </h3>
              </div>

              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Highlight Metadata Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-750 flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Location</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedJobForDetails.location}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-750 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Experience</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedJobForDetails.experience}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-750 flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Compensation</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selectedJobForDetails.salaryOrStipend}</span>
                  </div>
                </div>
              </div>

              {/* Role Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  About The Role
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedJobForDetails.description}
                </p>
              </div>

              {/* Key Responsibilities */}
              {selectedJobForDetails.responsibilities && selectedJobForDetails.responsibilities.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Key Responsibilities
                  </h4>
                  <ul className="space-y-2">
                    {selectedJobForDetails.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements & Qualifications */}
              {selectedJobForDetails.requirements && selectedJobForDetails.requirements.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Requirements & Qualifications
                  </h4>
                  <ul className="space-y-2">
                    {selectedJobForDetails.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills & Tech Stack */}
              {selectedJobForDetails.tags && selectedJobForDetails.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Skills & Tech Stack
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJobForDetails.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-dark-800/80 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-dark-900/50">
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const jobToApply = selectedJobForDetails;
                  setDetailsModalOpen(false);
                  handleOpenApply(jobToApply);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs font-mono shadow-md hover:shadow-brand-500/20 transition-all cursor-pointer"
              >
                <span>Apply</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE APPLICATION MODAL WITH MANDATORY RESUME UPLOAD */}
      {applyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-dark-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-dark-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Apply: {selectedJob.title}
                    </h3>
                    <span className="px-2 py-0.2 rounded-md text-[10px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                      {selectedJob.roleType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedJob.location} • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{selectedJob.salaryOrStipend}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setApplyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {submitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl animate-bounce">
                    🎉
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">
                    Application Successfully Submitted!
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Thank you for applying to <span className="font-bold text-brand-600 dark:text-brand-400">{selectedJob.title}</span>. Your resume has been uploaded and logged in our candidate pipeline.
                  </p>
                  
                  <div className="p-3.5 max-w-md mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2.5 text-left">
                    <span className="text-base shrink-0">📬</span>
                    <span>
                      A confirmation email has been dispatched to <strong>{email}</strong> with your application details and hiring timeline.
                    </span>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={() => setApplyModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs font-mono cursor-pointer shadow-md hover:scale-105 transition-all"
                    >
                      Done & Return to Open Roles
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>Full Name</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aman Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>Email Address</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. aman@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>Phone / WhatsApp Number</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>

                    {/* Experience */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        Years of Experience / College Year
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 3.5 Years or 4th Year B.Tech"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>
                  </div>

                  {/* Links Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* LinkedIn */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>

                    {/* GitHub / Portfolio */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        GitHub / Portfolio URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>
                  </div>

                  {/* COMPULSORY RESUME UPLOAD SECTION */}
                  <div className="space-y-2 p-4 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/30">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-brand-500" />
                        <span>Upload Resume (Compulsory)</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">PDF, DOC, DOCX (Max 10MB)</span>
                    </div>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />

                    {resumeFileName ? (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-dark-900 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {resumeFileName}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400">
                              {resumeFileSize} • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready to submit</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResumeFile(null);
                              setResumeFileName('');
                              setResumeFileSize('');
                              setResumeBase64('');
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-6 rounded-xl border-2 border-dashed border-brand-500/40 hover:border-brand-500 bg-white/70 dark:bg-dark-900/70 hover:bg-brand-500/5 transition-all text-center cursor-pointer space-y-1.5 group"
                      >
                        <Upload className="w-6 h-6 text-brand-500 mx-auto group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Click to select or drag & drop your Resume
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          PDF format recommended for automated ATS parsing
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Short Note */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      Why are you excited to join NextEra Coders? (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Tell us about your superpower, past projects, or why this role resonates with you..."
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-dark-800">
                    <button
                      type="button"
                      onClick={() => setApplyModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-700 text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs font-mono shadow-md hover:shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Uploading Resume & Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
