import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, Users, FileText, Code2, HelpCircle } from 'lucide-react';
import { api } from '../../services/api';

interface AdminGlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminGlobalSearchModal: React.FC<AdminGlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    courses: any[];
    students: any[];
    problems: any[];
    quizzes: any[];
    tutorials: any[];
  }>({
    courses: [],
    students: [],
    problems: [],
    quizzes: [],
    tutorials: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ courses: [], students: [], problems: [], quizzes: [], tutorials: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ courses: [], students: [], problems: [], quizzes: [], tutorials: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const [cRes, sRes, pRes, qRes, tRes] = await Promise.all([
          api.get(`/admin/courses?search=${encodeURIComponent(query)}`).catch(() => ({ data: { data: { courses: [] } } })),
          api.get(`/admin/students?search=${encodeURIComponent(query)}`).catch(() => ({ data: { data: { students: [] } } })),
          api.get(`/admin/problems?search=${encodeURIComponent(query)}`).catch(() => ({ data: { data: { problems: [] } } })),
          api.get(`/admin/quizzes?search=${encodeURIComponent(query)}`).catch(() => ({ data: { data: { quizzes: [] } } })),
          api.get(`/admin/tutorials?search=${encodeURIComponent(query)}`).catch(() => ({ data: { data: { tutorials: [] } } })),
        ]);

        setResults({
          courses: (cRes.data.data.courses || []).slice(0, 3),
          students: (sRes.data.data.students || []).slice(0, 3),
          problems: (pRes.data.data.problems || []).slice(0, 3),
          quizzes: (qRes.data.data.quizzes || []).slice(0, 3),
          tutorials: (tRes.data.data.tutorials || []).slice(0, 3),
        });
      } catch (err) {
        console.error('Admin search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResultsCount =
    results.courses.length +
    results.students.length +
    results.problems.length +
    results.quizzes.length +
    results.tutorials.length;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 relative">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick search courses, students, problems, quizzes..."
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Searching platform records...
            </div>
          ) : query.trim() && totalResultsCount === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No results found for "{query}"
            </div>
          ) : !query.trim() ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Type keywords to search courses, student records, DSA challenges, quizzes, and tutorials.
            </div>
          ) : (
            <>
              {/* Courses */}
              {results.courses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    Courses
                  </div>
                  <div className="space-y-1">
                    {results.courses.map((c) => (
                      <button
                        key={c.id || c._id}
                        onClick={() => handleNavigate(`/admin/courses/${c.id || c._id}/edit`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          {c.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{c.level}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Students */}
              {results.students.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    Students
                  </div>
                  <div className="space-y-1">
                    {results.students.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleNavigate(`/admin/students/${s.id}`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{s.email}</p>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{s.points} XP</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Problems */}
              {results.problems.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                    DSA Problems
                  </div>
                  <div className="space-y-1">
                    {results.problems.map((p) => (
                      <button
                        key={p.id || p._id}
                        onClick={() => handleNavigate(`/admin/problems/${p.id || p._id}/edit`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {p.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{p.difficulty}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes */}
              {results.quizzes.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    Quizzes
                  </div>
                  <div className="space-y-1">
                    {results.quizzes.map((q) => (
                      <button
                        key={q.id || q._id}
                        onClick={() => handleNavigate(`/admin/quizzes/${q.id || q._id}/edit`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          {q.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Pass: {q.passingScore}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tutorials */}
              {results.tutorials.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                    Tutorials
                  </div>
                  <div className="space-y-1">
                    {results.tutorials.map((t) => (
                      <button
                        key={t.id || t._id}
                        onClick={() => handleNavigate(`/admin/tutorials/${t.id || t._id}/edit`)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                          {t.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{t.category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
