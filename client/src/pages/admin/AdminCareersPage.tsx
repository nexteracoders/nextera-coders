import React, { useState, useEffect } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/ui/Toast';
import {
  careersService,
  IJobPosition,
  ICandidateApplication,
} from '../../services/careers.service';
import {
  Briefcase,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  ArrowUp,
  ArrowDown,
  X,
  Phone,
  Mail,
  Linkedin,
  Github,
  Star,
  RotateCcw,
  RefreshCw,
  Calendar,
  Video,
  Link2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';

export const AdminCareersPage: React.FC = () => {
  useDocumentTitle('Careers & Hiring Management — Admin Portal');
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'applications' | 'jobs'>('applications');
  const [jobs, setJobs] = useState<IJobPosition[]>([]);
  const [applications, setApplications] = useState<ICandidateApplication[]>([]);
  const [refreshingApps, setRefreshingApps] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleTypeFilter, setRoleTypeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modals & Selected items
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<IJobPosition | null>(null);
  const [candidateDetailModalOpen, setCandidateDetailModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ICandidateApplication | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'job' | 'app'; id: string; name: string } | null>(null);

  // Schedule Interview Modal State
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [candidateForInterview, setCandidateForInterview] = useState<ICandidateApplication | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('04:00 PM – 05:00 PM IST');
  const [interviewDuration, setInterviewDuration] = useState('45 Minutes');
  const [interviewMode, setInterviewMode] = useState('Google Meet (Online Video Conference)');
  const [interviewMeetingLink, setInterviewMeetingLink] = useState('');
  const [interviewPanelists, setInterviewPanelists] = useState('Sandeep Sir (Engineering Lead) & HR Lead');
  const [interviewRoundType, setInterviewRoundType] = useState('Technical Round 1: Live Coding & Architecture');
  const [interviewAgendaNotes, setInterviewAgendaNotes] = useState('');
  const [interviewSendEmail, setInterviewSendEmail] = useState(true);
  const [schedulingInterviewLoading, setSchedulingInterviewLoading] = useState(false);

  // Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDepartment, setJobDepartment] = useState('Engineering');
  const [jobRoleType, setJobRoleType] = useState<'Job' | 'Internship' | 'Part-time' | 'Contract'>('Job');
  const [jobLocation, setJobLocation] = useState('Remote (India / Global)');
  const [jobExperience, setJobExperience] = useState('2 - 4 Years');
  const [jobSalaryOrStipend, setJobSalaryOrStipend] = useState('₹15 LPA – ₹25 LPA');
  const [jobTags, setJobTags] = useState('React, TypeScript, Node.js');
  const [jobDescription, setJobDescription] = useState('');
  const [jobResponsibilities, setJobResponsibilities] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [jobIsHot, setJobIsHot] = useState(false);
  const [jobIsActive, setJobIsActive] = useState(true);

  // Candidate Note/Rating state inside modal
  const [candidateNotes, setCandidateNotes] = useState('');
  const [candidateRating, setCandidateRating] = useState<number>(5);
  const [emailDispatching, setEmailDispatching] = useState<string | null>(null);

  const refreshApplications = async () => {
    try {
      setRefreshingApps(true);
      const list = await careersService.fetchApplicationsFromServer();
      setApplications(list);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingApps(false);
    }
  };

  useEffect(() => {
    const unsubJobs = careersService.subscribeJobs((list) => {
      setJobs(list);
    });
    const unsubApps = careersService.subscribeApplications((list) => {
      setApplications(list);
    });

    // Auto-fetch fresh applications from server
    refreshApplications();

    return () => {
      unsubJobs();
      unsubApps();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Job Form Handlers
  // ---------------------------------------------------------------------------
  const handleOpenCreateJob = () => {
    setEditingJob(null);
    setJobTitle('');
    setJobDepartment('Engineering');
    setJobRoleType('Job');
    setJobLocation('Remote (India / Global)');
    setJobExperience('2 - 4 Years');
    setJobSalaryOrStipend('₹16 LPA – ₹28 LPA');
    setJobTags('React 19, TypeScript, Node.js, MongoDB');
    setJobDescription('Lead end-to-end full-stack development and architecture.');
    setJobResponsibilities('Architect responsive features\nBuild high-throughput APIs\nCollaborate across product teams');
    setJobRequirements('3+ years of experience\nStrong TypeScript & Node foundations\nTrack record of high agency');
    setJobIsHot(false);
    setJobIsActive(true);
    setJobModalOpen(true);
  };

  const handleOpenEditJob = (job: IJobPosition) => {
    setEditingJob(job);
    setJobTitle(job.title);
    setJobDepartment(job.department);
    setJobRoleType(job.roleType);
    setJobLocation(job.location);
    setJobExperience(job.experience);
    setJobSalaryOrStipend(job.salaryOrStipend);
    setJobTags(job.tags.join(', '));
    setJobDescription(job.description);
    setJobResponsibilities(job.responsibilities.join('\n'));
    setJobRequirements(job.requirements.join('\n'));
    setJobIsHot(!!job.isHot);
    setJobIsActive(job.isActive);
    setJobModalOpen(true);
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      toastError('Please enter a job title');
      return;
    }

    const tagsArray = jobTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const respArray = jobResponsibilities
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const reqArray = jobRequirements
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    careersService.saveJob({
      id: editingJob?.id || undefined,
      title: jobTitle,
      department: jobDepartment as any,
      roleType: jobRoleType,
      location: jobLocation,
      experience: jobExperience,
      salaryOrStipend: jobSalaryOrStipend,
      tags: tagsArray.length > 0 ? tagsArray : ['Engineering'],
      description: jobDescription,
      responsibilities: respArray.length > 0 ? respArray : ['Ship clean code'],
      requirements: reqArray.length > 0 ? reqArray : ['Strong fundamentals'],
      isHot: jobIsHot,
      isActive: jobIsActive,
      order: editingJob?.order,
    });

    success(
      editingJob ? `Updated "${jobTitle}" successfully` : `Posted new role "${jobTitle}"`,
      'Job Saved'
    );
    setJobModalOpen(false);
  };

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Candidate Handlers
  // ---------------------------------------------------------------------------
  const handleOpenCandidateDetails = (candidate: ICandidateApplication) => {
    setSelectedCandidate(candidate);
    setCandidateNotes(candidate.adminNotes || '');
    setCandidateRating(candidate.adminRating || 5);
    setCandidateDetailModalOpen(true);
  };

  const handleOpenScheduleInterview = (candidate: ICandidateApplication) => {
    setCandidateForInterview(candidate);

    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrowStr = d.toISOString().split('T')[0];

    if (candidate.interviewDetails) {
      setInterviewDate(candidate.interviewDetails.interviewDate || tomorrowStr);
      setInterviewTime(candidate.interviewDetails.interviewTime || '04:00 PM – 05:00 PM IST');
      setInterviewDuration(candidate.interviewDetails.duration || '45 Minutes');
      setInterviewMode(candidate.interviewDetails.mode || 'Google Meet (Online Video Conference)');
      setInterviewMeetingLink(candidate.interviewDetails.meetingLink || '');
      setInterviewPanelists(candidate.interviewDetails.panelists || 'Sandeep Sir (Engineering Lead) & HR Head');
      setInterviewRoundType(candidate.interviewDetails.roundType || 'Technical Round 1: Live Coding & Architecture');
      setInterviewAgendaNotes(candidate.interviewDetails.agendaNotes || '');
    } else {
      setInterviewDate(tomorrowStr);
      setInterviewTime('04:00 PM – 05:00 PM IST');
      setInterviewDuration('45 Minutes');
      setInterviewMode('Google Meet (Online Video Conference)');
      const p1 = Math.random().toString(36).substring(2, 5);
      const p2 = Math.random().toString(36).substring(2, 6);
      const p3 = Math.random().toString(36).substring(2, 5);
      setInterviewMeetingLink(`https://meet.google.com/${p1}-${p2}-${p3}`);
      setInterviewPanelists('Sandeep Sir (Engineering Lead) & HR Head');
      setInterviewRoundType('Technical Round 1: Live Coding & Problem Solving');
      setInterviewAgendaNotes('Please be prepared with your local development setup (VS Code / code editor) for a live coding & algorithmic problem solving round followed by a deep-dive on past projects and Next Era Coders curriculum.');
    }
    setInterviewSendEmail(true);
    setInterviewModalOpen(true);
  };

  const handleGenerateMeetLink = () => {
    const p1 = Math.random().toString(36).substring(2, 5);
    const p2 = Math.random().toString(36).substring(2, 6);
    const p3 = Math.random().toString(36).substring(2, 5);
    setInterviewMeetingLink(`https://meet.google.com/${p1}-${p2}-${p3}`);
  };

  const handleSaveAndDispatchInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForInterview) return;

    if (!interviewDate || !interviewTime.trim() || !interviewMeetingLink.trim() || !interviewPanelists.trim()) {
      toastError('Please fill in all compulsory interview details (Date, Time, Link, Panelists)');
      return;
    }

    try {
      setSchedulingInterviewLoading(true);

      const updated = await careersService.scheduleCandidateInterview(
        candidateForInterview.id,
        {
          interviewDate,
          interviewTime,
          duration: interviewDuration,
          mode: interviewMode,
          meetingLink: interviewMeetingLink,
          panelists: interviewPanelists,
          roundType: interviewRoundType,
          agendaNotes: interviewAgendaNotes,
        },
        interviewSendEmail
      );

      if (updated && updated.application) {
        const appObj = updated.application;
        setApplications((prev) =>
          prev.map((a) => (a.id === appObj.id ? appObj : a))
        );
        if (selectedCandidate && selectedCandidate.id === appObj.id) {
          setSelectedCandidate(appObj);
        }
      }

      if (interviewSendEmail) {
        success(
          `🎉 Interview scheduled successfully! Branded invitation email with Google Meet details dispatched to ${candidateForInterview.email}.`,
          'Interview Scheduled & Email Dispatched 🚀'
        );
      } else {
        success(
          `Interview details saved for ${candidateForInterview.fullName}.`,
          'Interview Scheduled'
        );
      }

      setInterviewModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to schedule interview');
    } finally {
      setSchedulingInterviewLoading(false);
    }
  };

  const handleUpdateStatus = (
    id: string,
    status: ICandidateApplication['status'],
    e?: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e?.stopPropagation();

    if (status === 'Interview Scheduled') {
      const targetApp = applications.find((a) => a.id === id) || (selectedCandidate?.id === id ? selectedCandidate : null);
      if (targetApp) {
        handleOpenScheduleInterview(targetApp);
        return;
      }
    }

    careersService.updateApplicationStatus(id, status, candidateNotes, candidateRating);

    if (status === 'Shortlisted') {
      success(
        `Application status changed to "Shortlisted". 🎉 Automated congratulations email dispatched to candidate!`,
        'Shortlisted & Email Dispatched 🚀'
      );
    } else if (status === 'Rejected') {
      success(
        `Application status changed to "Rejected". 📬 Status update & talent network email dispatched to candidate.`,
        'Rejected & Email Dispatched'
      );
    } else {
      success(`Application status updated to "${status}"`, 'Status Updated');
    }

    if (selectedCandidate && selectedCandidate.id === id) {
      setSelectedCandidate({ ...selectedCandidate, status });
    }
  };

  const handleManualEmailDispatch = async (type: 'submitted' | 'shortlisted' | 'rejected') => {
    if (!selectedCandidate) return;
    setEmailDispatching(type);

    try {
      await careersService.dispatchCareerEmail(
        selectedCandidate,
        type,
        candidateNotes || undefined
      );

      if (type === 'shortlisted') {
        success(
          `🎉 Shortlist congratulatory email sent to ${selectedCandidate.email}!`,
          'Email Delivered 🚀'
        );
      } else if (type === 'rejected') {
        success(
          `📬 Status update & talent network email sent to ${selectedCandidate.email}.`,
          'Email Delivered'
        );
      } else {
        success(
          `💼 Application confirmation email resent to ${selectedCandidate.email}.`,
          'Email Delivered'
        );
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to dispatch email');
    } finally {
      setEmailDispatching(null);
    }
  };

  const handleSaveCandidateNotes = () => {
    if (!selectedCandidate) return;
    careersService.updateApplicationStatus(
      selectedCandidate.id,
      selectedCandidate.status,
      candidateNotes,
      candidateRating
    );
    success('Candidate notes and rating saved', 'Notes Updated');
    setCandidateDetailModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'job') {
      careersService.deleteJob(deleteTarget.id);
      success(`Job posting "${deleteTarget.name}" removed`, 'Deleted');
    } else {
      careersService.deleteApplication(deleteTarget.id);
      success(`Candidate application from "${deleteTarget.name}" removed`, 'Deleted');
    }
    setDeleteTarget(null);
  };

  const handleDownloadResume = (app: ICandidateApplication) => {
    if (app.resumeBase64OrUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = app.resumeBase64OrUrl;
      link.download = app.resumeFileName || 'Resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(app.resumeBase64OrUrl, '_blank');
    }
  };

  // Filtered Applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      !search.trim() ||
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase()) ||
      app.phone.toLowerCase().includes(search.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesRoleType = roleTypeFilter === 'all' || app.roleType === roleTypeFilter;
    const matchesDept = deptFilter === 'all' || app.department === deptFilter;

    return matchesSearch && matchesStatus && matchesRoleType && matchesDept;
  });

  // Filtered Jobs
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      !search.trim() ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      j.salaryOrStipend.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === 'all' || j.department === deptFilter;
    const matchesRoleType = roleTypeFilter === 'all' || j.roleType === roleTypeFilter;
    return matchesSearch && matchesDept && matchesRoleType;
  });

  const underReviewCount = applications.filter((a) => a.status === 'Under Review').length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted' || a.status === 'Interview Scheduled').length;
  const activeJobsCount = jobs.filter((j) => j.isActive).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Careers & Hiring Management</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
              💼 Recruiting Hub
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage job postings, student internships, stipends, and review candidate resume uploads in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Button
            type="button"
            onClick={handleOpenCreateJob}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 w-full sm:w-auto shrink-0 cursor-pointer"
          >
            Post New Role / Internship
          </Button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{applications.length}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Total Applications</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-amber-500 font-mono">{underReviewCount}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Under Review</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-emerald-500 font-mono">{shortlistedCount}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Shortlisted / Interview</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-purple-500 font-mono">{activeJobsCount}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Active Job Openings</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-dark-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('applications')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer',
              activeTab === 'applications'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-850'
            )}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Applications ({applications.length})</span>
            {underReviewCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                {underReviewCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer',
              activeTab === 'jobs'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-850'
            )}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job & Internship Postings ({jobs.length})</span>
          </button>
        </div>

        {activeTab === 'applications' && (
          <button
            type="button"
            onClick={async () => {
              await refreshApplications();
              success('Applications synced with MongoDB database', 'Live Sync Complete');
            }}
            disabled={refreshingApps}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-850 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-amber-500', refreshingApps && 'animate-spin')} />
            <span>{refreshingApps ? 'Syncing...' : 'Refresh Live Applications'}</span>
          </button>
        )}

        {activeTab === 'jobs' && (
          <button
            onClick={() => {
              if (window.confirm('Reset all job postings back to default NextEra listings?')) {
                careersService.resetJobsToDefaults();
                success('Reset job postings to standard defaults', 'Reset Done');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-750 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-850 text-xs font-mono transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'applications' ? 'Search candidate name, email, role...' : 'Search jobs, tags, stipend...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Curriculum & Content">Curriculum & Content</option>
            <option value="AI & ML">AI & Machine Learning</option>
            <option value="Product & Design">Product & Design</option>
            <option value="DevRel & Community">DevRel & Community</option>
            <option value="Marketing">Marketing</option>
          </select>

          {/* Role Type Filter */}
          <select
            value={roleTypeFilter}
            onChange={(e) => setRoleTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Role Types</option>
            <option value="Job">💼 Full-Time Jobs</option>
            <option value="Internship">🎓 Internships</option>
          </select>

          {/* Status Filter for Applications */}
          {activeTab === 'applications' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: CANDIDATE APPLICATIONS INBOX */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No applications match your search criteria</h3>
              <p className="text-xs text-slate-500">Applications submitted from the /careers page will appear here instantly.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-850/40 text-slate-400 font-mono">
                      <th className="py-3.5 px-4">Candidate Details</th>
                      <th className="py-3.5 px-4">Role Applied For</th>
                      <th className="py-3.5 px-4">Resume Upload (Compulsory)</th>
                      <th className="py-3.5 px-4">Applied Date</th>
                      <th className="py-3.5 px-4">Hiring Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-800">
                    {filteredApps.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => handleOpenCandidateDetails(app)}
                        className="hover:bg-slate-50/60 dark:hover:bg-dark-850/40 transition-colors cursor-pointer"
                      >
                        {/* Candidate Info */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                              <span>{app.fullName}</span>
                              {app.adminRating && app.adminRating >= 5 && (
                                <span className="text-[10px] text-amber-500">⭐ Top</span>
                              )}
                            </p>
                            <div className="flex flex-col text-[11px] text-slate-400 font-mono mt-0.5">
                              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {app.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {app.phone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Applied */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                              {app.jobTitle}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {app.department}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {app.roleType === 'Internship' ? '🎓 Internship' : '💼 Job'} • {app.experienceYears}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Resume File Pill */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleDownloadResume(app)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-mono text-[11px] font-semibold transition-all cursor-pointer group"
                            title="Click to view/download resume"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span className="max-w-[140px] truncate">{app.resumeFileName}</span>
                            <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          </button>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(app.appliedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Status Dropdown & Schedule Badge */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateStatus(app.id, e.target.value as any, e)}
                              className={cn(
                                'h-8 px-2.5 rounded-lg border text-xs font-mono font-bold focus:outline-none cursor-pointer w-full',
                                app.status === 'Shortlisted'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : app.status === 'Interview Scheduled'
                                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                                  : app.status === 'Hired'
                                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                  : app.status === 'Rejected'
                                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              )}
                            >
                              <option value="Under Review">Under Review</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Interview Scheduled">Interview Scheduled</option>
                              <option value="Hired">Hired</option>
                              <option value="Rejected">Rejected</option>
                            </select>

                            {app.interviewDetails && (
                              <button
                                type="button"
                                onClick={() => handleOpenScheduleInterview(app)}
                                className="w-full flex items-center justify-between gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-mono hover:bg-purple-500/20 transition-colors"
                                title="Click to view or edit interview schedule"
                              >
                                <span className="flex items-center gap-1 truncate">
                                  <Calendar className="w-3 h-3 text-purple-500 shrink-0" />
                                  <span className="truncate">{app.interviewDetails.interviewDate}</span>
                                </span>
                                <span className="font-bold shrink-0">Edit</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenScheduleInterview(app)}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                              title="Schedule / Edit Interview Details & Send Email"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenCandidateDetails(app)}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                              title="View Full Profile & Notes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget({ type: 'app', id: app.id, name: app.fullName })}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Application"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JOB & INTERNSHIP POSTINGS */}
      {activeTab === 'jobs' && (
        <div className="space-y-3">
          {filteredJobs.map((job, idx) => (
            <div
              key={job.id}
              className={cn(
                'p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                job.isActive
                  ? 'bg-white dark:bg-dark-900 border-slate-200/90 dark:border-dark-800 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-dark-900/40 border-slate-200/50 dark:border-dark-800/40 opacity-70'
              )}
            >
              {/* Left: Reorder & Details */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => careersService.reorderJob(job.id, 'up')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === jobs.length - 1}
                    onClick={() => careersService.reorderJob(job.id, 'down')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {job.title}
                    </h4>
                    <span className="px-2 py-0.2 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                      {job.department}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.2 rounded-md text-[10px] font-mono font-bold border shrink-0',
                        job.roleType === 'Internship'
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      )}
                    >
                      {job.roleType === 'Internship' ? '🎓 Internship' : '💼 Job'}
                    </span>
                    {job.isHot && (
                      <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 fill-rose-500" />
                        <span>Hot</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </span>
                    <span>• {job.experience}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      • {job.salaryOrStipend}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                {/* Toggle Active/Draft */}
                <button
                  onClick={() => {
                    careersService.toggleJobActive(job.id);
                    success(`Job status changed to ${!job.isActive ? 'Published' : 'Draft'}`, 'Updated');
                  }}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer',
                    job.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-400 border-slate-200 dark:border-dark-750'
                  )}
                >
                  {job.isActive ? 'Published' : 'Draft'}
                </button>

                <button
                  onClick={() => handleOpenEditJob(job)}
                  className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                  title="Edit Job Posting"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteTarget({ type: 'job', id: job.id, name: job.title })}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Delete Job Posting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JOB CREATION / EDIT MODAL */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-slate-50/50 dark:bg-dark-850/50">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <span>{editingJob ? 'Edit Career Role / Internship' : 'Post New Career Role or Internship'}</span>
              </h3>
              <button
                onClick={() => setJobModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Full-Stack Engineer or React Developer Intern"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Department *
                  </label>
                  <select
                    value={jobDepartment}
                    onChange={(e) => setJobDepartment(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Curriculum & Content">Curriculum & Content</option>
                    <option value="AI & ML">AI & Machine Learning</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="DevRel & Community">DevRel & Community</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                {/* Role Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Role Type *
                  </label>
                  <select
                    value={jobRoleType}
                    onChange={(e) => setJobRoleType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Job">💼 Full-Time Job</option>
                    <option value="Internship">🎓 Internship</option>
                    <option value="Part-time">Part-Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote (India / Global) or Noida Hybrid"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Experience / Criteria
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 - 4 Years or College Student"
                    value={jobExperience}
                    onChange={(e) => setJobExperience(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Salary / Stipend */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Salary Package or Monthly Stipend *</span>
                    <span className="text-[10px] text-amber-500 font-normal">e.g. ₹25k-₹45k/month for internships, ₹18 LPA-₹30 LPA for jobs</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹18 LPA – ₹32 LPA + ESOPs or ₹30,000 – ₹45,000 / month"
                    value={jobSalaryOrStipend}
                    onChange={(e) => setJobSalaryOrStipend(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Tech Tags */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Tech Stack & Keywords (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="React, TypeScript, Node.js, WebAssembly"
                    value={jobTags}
                    onChange={(e) => setJobTags(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Summary of the role impact and mission..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Key Responsibilities */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Key Responsibilities (One per line)
                </label>
                <textarea
                  rows={3}
                  value={jobResponsibilities}
                  onChange={(e) => setJobResponsibilities(e.target.value)}
                  placeholder="Architect scalable microservices&#10;Write comprehensive tests&#10;Optimize latency"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>

              {/* Requirements */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Requirements & Qualifications (One per line)
                </label>
                <textarea
                  rows={3}
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  placeholder="Strong problem-solving foundation&#10;Experience with modern React / Python&#10;High agency and self-starter mindset"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobIsHot}
                    onChange={(e) => setJobIsHot(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Mark as Urgent / Hot Hiring</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobIsActive}
                    onChange={(e) => setJobIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Publish Immediately (Active)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-dark-800">
                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-dark-750 text-xs font-mono text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-md cursor-pointer"
                >
                  Save & Publish Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAIL & RESUME MODAL */}
      {candidateDetailModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-slate-50/50 dark:bg-dark-850/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base font-mono border border-amber-500/20">
                  {selectedCandidate.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedCandidate.fullName}</span>
                    <span className="px-2 py-0.2 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {selectedCandidate.status}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Applied for: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedCandidate.jobTitle}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCandidateDetailModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Contact & Links Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-750">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Email</span>
                  <a href={`mailto:${selectedCandidate.email}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-amber-500 block truncate">
                    {selectedCandidate.email}
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-750">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Phone / WhatsApp</span>
                  <a href={`tel:${selectedCandidate.phone}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-amber-500 block">
                    {selectedCandidate.phone}
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/80 dark:border-dark-750">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Experience Level</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedCandidate.experienceYears}</p>
                </div>
              </div>

              {/* Social / Portfolio Links */}
              <div className="flex flex-wrap items-center gap-3">
                {selectedCandidate.linkedin && (
                  <a
                    href={selectedCandidate.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-mono font-semibold hover:underline"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {selectedCandidate.github && (
                  <a
                    href={selectedCandidate.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-dark-750 text-xs font-mono font-semibold hover:underline"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub / Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* RESUME DOWNLOAD CARD (COMPULSORY RESUME) */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 rounded-xl bg-emerald-500 text-slate-950 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {selectedCandidate.resumeFileName}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                        Uploaded Resume
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      File Size: {selectedCandidate.resumeFileSize || '1.2 MB'} • Verified Document
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadResume(selectedCandidate)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download / View Resume</span>
                </button>
              </div>

              {/* Candidate Cover Note */}
              {selectedCandidate.coverNote && (
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-dark-750">
                  <h5 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Candidate Note & Motivation:
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    "{selectedCandidate.coverNote}"
                  </p>
                </div>
              )}

              {/* SCHEDULED INTERVIEW CARD (IF ALREADY SCHEDULED) */}
              {selectedCandidate.interviewDetails && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-violet-500/10 border border-purple-500/30 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                          <span>📅 Confirmed Interview Schedule</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                            {selectedCandidate.interviewDetails.roundType || 'Live Round'}
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Slot confirmed with panelists & Google Meet room
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenScheduleInterview(selectedCandidate)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Reschedule / Update Form</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-dark-900/80 border border-purple-200/50 dark:border-purple-800/40">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Date & Time Slot</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedCandidate.interviewDetails.interviewDate}
                      </p>
                      <p className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                        {selectedCandidate.interviewDetails.interviewTime} ({selectedCandidate.interviewDetails.duration || '45 Mins'})
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/80 dark:bg-dark-900/80 border border-purple-200/50 dark:border-purple-800/40">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Panelists / Teacher / HR</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                        {selectedCandidate.interviewDetails.panelists}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {selectedCandidate.interviewDetails.mode || 'Google Meet'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/80 dark:bg-dark-900/80 border border-purple-200/50 dark:border-purple-800/40 sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">Google Meet / Video Link</span>
                        <p className="text-xs font-mono text-purple-600 dark:text-purple-400 truncate mt-0.5 font-bold">
                          {selectedCandidate.interviewDetails.meetingLink}
                        </p>
                      </div>
                      <a
                        href={selectedCandidate.interviewDetails.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        <Video className="w-3 h-3" />
                        <span>Join Meeting Room</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {selectedCandidate.interviewDetails.agendaNotes && (
                    <div className="p-3 rounded-xl bg-white/60 dark:bg-dark-900/60 border border-purple-200/40 dark:border-purple-800/30 text-xs text-slate-600 dark:text-slate-300">
                      <strong className="font-mono text-[10px] uppercase text-purple-600 dark:text-purple-400 block mb-0.5">
                        Agenda & Preparation Instructions:
                      </strong>
                      <p className="italic">{selectedCandidate.interviewDetails.agendaNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Internal Admin Review & Rating */}
              <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                <h5 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Internal Hiring Assessment & Notes</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      Hiring Stage:
                    </label>
                    <select
                      value={selectedCandidate.status}
                      onChange={(e) => handleUpdateStatus(selectedCandidate.id, e.target.value as any)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-bold font-mono"
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      Recruiter Rating (1 - 5 Stars):
                    </label>
                    <select
                      value={candidateRating}
                      onChange={(e) => setCandidateRating(Number(e.target.value))}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-bold font-mono"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ 5/5 - Exceptional Candidate</option>
                      <option value={4}>⭐⭐⭐⭐ 4/5 - Strong Fit</option>
                      <option value={3}>⭐⭐⭐ 3/5 - Potential Candidate</option>
                      <option value={2}>⭐⭐ 2/5 - Weak Fit</option>
                      <option value={1}>⭐ 1/5 - Reject</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    Recruiter Internal Notes / Interview Feedback:
                  </label>
                  <textarea
                    rows={2}
                    value={candidateNotes}
                    onChange={(e) => setCandidateNotes(e.target.value)}
                    placeholder="Enter interview notes, tech evaluation scores, or team feedback..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveCandidateNotes}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-sm cursor-pointer"
                  >
                    Save Notes & Assessment
                  </button>
                </div>
              </div>

              {/* CANDIDATE EMAIL NOTIFICATION & DISPATCH HUB */}
              <div className="space-y-3 p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/25">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span>Candidate Email Notification Dispatch Hub</span>
                  </h5>
                  <span className="text-[10px] font-mono text-slate-400">Recipient: {selectedCandidate.email}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Send branded, personalized HTML emails directly to <strong>{selectedCandidate.fullName}</strong>. Selecting "Shortlisted", "Interview Scheduled", or "Rejected" above will also trigger these automatically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  {/* 1. Shortlist Email */}
                  <button
                    type="button"
                    disabled={!!emailDispatching}
                    onClick={() => handleManualEmailDispatch('shortlisted')}
                    className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-left transition-all cursor-pointer disabled:opacity-50 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold font-mono">🎉 Shortlist Email</span>
                        <span className="text-emerald-500">🚀</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Congratulate candidate & outline rounds.
                      </p>
                    </div>
                    <span className="mt-2 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                      {emailDispatching === 'shortlisted' ? 'Sending...' : 'Dispatch Email ➔'}
                    </span>
                  </button>

                  {/* 2. Schedule & Invite Interview Email */}
                  <button
                    type="button"
                    onClick={() => handleOpenScheduleInterview(selectedCandidate)}
                    className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-left transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold font-mono">🗓️ Interview Invite</span>
                        <span className="text-purple-500">📹</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Fill interview form with Meet link & panelists.
                      </p>
                    </div>
                    <span className="mt-2 text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
                      Schedule & Mail ➔
                    </span>
                  </button>

                  {/* 3. Rejection & Talent Network Email */}
                  <button
                    type="button"
                    disabled={!!emailDispatching}
                    onClick={() => handleManualEmailDispatch('rejected')}
                    className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-left transition-all cursor-pointer disabled:opacity-50 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold font-mono">📬 Rejection & Pool</span>
                        <span className="text-rose-500">🤝</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Empathetic update & keep in talent pool.
                      </p>
                    </div>
                    <span className="mt-2 text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 group-hover:underline">
                      {emailDispatching === 'rejected' ? 'Sending...' : 'Dispatch Email ➔'}
                    </span>
                  </button>

                  {/* 4. Resend Application Confirmation Email */}
                  <button
                    type="button"
                    disabled={!!emailDispatching}
                    onClick={() => handleManualEmailDispatch('submitted')}
                    className="p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-left transition-all cursor-pointer disabled:opacity-50 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold font-mono">💼 Thanks for Applying</span>
                        <span className="text-blue-500">📄</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        Resend confirmation email with app ID.
                      </p>
                    </div>
                    <span className="mt-2 text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                      {emailDispatching === 'submitted' ? 'Sending...' : 'Resend Email ➔'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL DIALOG */}
      {interviewModalOpen && candidateForInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-dark-900 border border-purple-500/30 dark:border-purple-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-purple-100 dark:border-dark-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Schedule Candidate Interview</span>
                    <span className="px-2 py-0.2 rounded-md text-[10px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      Auto-Mail Invite
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fill the form below with time, link, and teacher/HR panelists to notify <strong className="text-purple-600 dark:text-purple-400">{candidateForInterview.fullName}</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInterviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Quick Banner */}
            <div className="px-6 py-3 bg-purple-50/50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-dark-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">{candidateForInterview.fullName}</span>
                <span>•</span>
                <span className="text-slate-500">{candidateForInterview.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.2 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20 text-[10px]">
                  {candidateForInterview.jobTitle}
                </span>
                <span className="text-slate-400 text-[10px]">
                  ({candidateForInterview.roleType})
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAndDispatchInterview} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Interview Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" />
                    <span>Interview Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 2. Interview Time Slot */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span>Time Slot (with Timezone) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 04:00 PM – 05:00 PM IST"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 3. Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Duration
                  </label>
                  <select
                    value={interviewDuration}
                    onChange={(e) => setInterviewDuration(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="30 Minutes">30 Minutes (Quick Screen / HR)</option>
                    <option value="45 Minutes">45 Minutes (Standard Technical)</option>
                    <option value="60 Minutes">60 Minutes (Deep Coding & Architecture)</option>
                    <option value="90 Minutes">90 Minutes (Comprehensive Evaluation)</option>
                  </select>
                </div>

                {/* 4. Round Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Interview Round Type *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Technical Round 1: Live Coding & Architecture"
                    value={interviewRoundType}
                    onChange={(e) => setInterviewRoundType(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 5. Panelists / Teacher / HR */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span>Interview Panelists (Teacher / HR / Team Lead) *</span>
                    </span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">Included in candidate invite email</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sandeep Sir (Engineering Lead) & HR Head"
                    value={interviewPanelists}
                    onChange={(e) => setInterviewPanelists(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 6. Meeting Link & Generator */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-purple-500" />
                      <span>Google Meet / Video Conference Link *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateMeetLink}
                      className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Generate Meet Link</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      value={interviewMeetingLink}
                      onChange={(e) => setInterviewMeetingLink(e.target.value)}
                      className="w-full h-10 pl-3.5 pr-28 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 focus:outline-none focus:border-purple-500"
                    />
                    <a
                      href={interviewMeetingLink || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 text-[10px] font-mono font-bold hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors flex items-center gap-1"
                    >
                      <span>Test Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                {/* 7. Mode */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Platform / Location
                  </label>
                  <select
                    value={interviewMode}
                    onChange={(e) => setInterviewMode(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Google Meet (Online Video Conference)">Google Meet (Online Video Conference)</option>
                    <option value="Zoom Meeting">Zoom Meeting</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Next Era Coders Tech Hub (In-Person)">Next Era Coders Tech Hub (In-Person)</option>
                  </select>
                </div>
              </div>

              {/* 8. Agenda & Preparation Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Candidate Preparation Guidelines & Agenda</span>
                  <span className="text-[10px] text-slate-400">Included as bullet points in email</span>
                </label>
                <textarea
                  rows={3}
                  value={interviewAgendaNotes}
                  onChange={(e) => setInterviewAgendaNotes(e.target.value)}
                  placeholder="e.g. Please join 5 minutes early with your IDE ready for live coding. Be prepared to explain your GitHub projects and problem-solving thought process."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-750 bg-white dark:bg-dark-850 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* 9. Send Email Checkbox Banner */}
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
                <input
                  id="send_email_checkbox"
                  type="checkbox"
                  checked={interviewSendEmail}
                  onChange={(e) => setInterviewSendEmail(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="send_email_checkbox" className="text-xs text-slate-800 dark:text-slate-200 cursor-pointer space-y-0.5">
                  <span className="font-bold block text-purple-900 dark:text-purple-300">
                    ✉️ Dispatch branded Interview Schedule email to candidate immediately
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Sends full schedule, teacher/HR panelist names, preparation guidelines, and the <strong>Join Google Meet</strong> button to <strong>{candidateForInterview.email}</strong>.
                  </p>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-dark-800">
                <button
                  type="button"
                  onClick={() => setInterviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-dark-750 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingInterviewLoading}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {schedulingInterviewLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scheduling & Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Schedule & Dispatch Email ➔</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === 'job' ? 'Delete Job Posting' : 'Delete Candidate Application'}
        itemName={deleteTarget?.name}
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};
