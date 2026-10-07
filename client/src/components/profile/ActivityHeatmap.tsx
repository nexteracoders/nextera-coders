import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ActivityHeatmapProps {
  submissionDateMap: Record<string, number>;
  totalSubmissionsInYear: number;
  currentStreak: number;
  longestStreak: number;
  year?: number;
  onSelectDate?: (date: string, count: number) => void;
  className?: string;
}

interface DayCell {
  dateKey: string; // 'YYYY-MM-DD'
  dateObj: Date;
  dayOfMonth: number;
  monthIdx: number;
  dayOfWeek: number;
  count: number;
  level: 0 | 1 | 2 | 3;
  isToday: boolean;
  isFuture: boolean;
  formattedDate: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthGroup {
  monthIdx: number;
  monthName: string;
  fullMonthName: string;
  weeks: Array<Array<DayCell | null>>;
  totalMonthSubmissions: number;
  activeMonthDays: number;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  submissionDateMap = {},
  totalSubmissionsInYear = 0,
  currentStreak = 0,
  longestStreak: _longestStreak = 0,
  year = new Date().getFullYear(),
  onSelectDate,
  className,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(year);
  const [viewMode, setViewMode] = useState<'365-Days' | 'Month'>('365-Days');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<DayCell | null>(null);

  // Shared helper to evaluate day activity with streak fallback
  const evaluateDay = useMemo(() => {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return (yearNum: number, monthIdx: number, dayNum: number): DayCell => {
      const cellTime = new Date(yearNum, monthIdx, dayNum).getTime();
      const dateKey = `${yearNum}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const isFuture = cellTime > todayMidnight;
      const isToday = cellTime === todayMidnight;

      let count = submissionDateMap[dateKey] || 0;

      // Active streak fallback for past consecutive days
      if (!isFuture && count === 0 && currentStreak > 0) {
        const diffDays = Math.round((todayMidnight - cellTime) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < currentStreak) {
          count = 1;
        }
      }

      let level: 0 | 1 | 2 | 3 = 0;
      if (count >= 5) level = 3;
      else if (count >= 3) level = 2;
      else if (count >= 1) level = 1;

      const formattedDate = `${FULL_MONTH_NAMES[monthIdx]} ${dayNum}, ${yearNum}`;

      return {
        dateKey,
        dateObj: new Date(yearNum, monthIdx, dayNum),
        dayOfMonth: dayNum,
        monthIdx,
        dayOfWeek: new Date(yearNum, monthIdx, dayNum).getDay(),
        count,
        level,
        isToday,
        isFuture,
        formattedDate,
      };
    };
  }, [submissionDateMap, currentStreak]);

  // Compute 12 distinct months with their respective weeks and stats
  const { monthsData } = useMemo(() => {
    const list: MonthGroup[] = [];

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(selectedYear, m + 1, 0).getDate();
      const firstDayOfWeek = new Date(selectedYear, m, 1).getDay(); // 0 (Sun) to 6 (Sat)
      const weeksList: Array<Array<DayCell | null>> = [];
      let currentWeek: Array<DayCell | null> = [];

      // Pad beginning of first week
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }

      let monthSubmissions = 0;
      let monthActiveDays = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const cell = evaluateDay(selectedYear, m, day);

        if (cell.count > 0 && !cell.isFuture) {
          monthActiveDays++;
          monthSubmissions += cell.count;
        }

        currentWeek.push(cell);

        // If week completed (Saturday)
        if (currentWeek.length === 7) {
          weeksList.push(currentWeek);
          currentWeek = [];
        }
      }

      // Pad end of last week
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeksList.push(currentWeek);
      }

      list.push({
        monthIdx: m,
        monthName: MONTH_NAMES[m],
        fullMonthName: FULL_MONTH_NAMES[m],
        weeks: weeksList,
        totalMonthSubmissions: monthSubmissions,
        activeMonthDays: monthActiveDays,
      });
    }

    return {
      monthsData: list,
    };
  }, [selectedYear, evaluateDay]);

  const handleCellClick = (cell: DayCell | null) => {
    if (!cell || cell.isFuture) return;
    setSelectedCell(cell);
    if (onSelectDate) {
      onSelectDate(cell.dateKey, cell.count);
    }
  };

  return (
    <div
      className={cn(
        'rounded-3xl bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-dark-800 p-6 shadow-xs space-y-5 select-none',
        className
      )}
    >
      {/* 1. TOP HEADER: Submissions in Year [Year ▾] on Left, [Year | Month] Toggle on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-dark-800 pb-4">
        <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
          <span>{totalSubmissionsInYear} Submissions in Year</span>
          <div className="relative inline-flex items-center">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              aria-label="Select Year"
              className="appearance-none font-bold text-brand-600 dark:text-brand-400 bg-transparent pr-4 cursor-pointer focus:outline-none hover:underline font-mono"
            >
              <option value={2026} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-dark-900">2026</option>
              <option value={2025} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-dark-900">2025</option>
              <option value={2024} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-dark-900">2024</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Toggle Year / Month */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-dark-800 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('365-Days')}
            className={cn(
              'px-3.5 py-1 rounded-lg transition-all cursor-pointer',
              viewMode === '365-Days'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            Year
          </button>
          <button
            type="button"
            onClick={() => setViewMode('Month')}
            className={cn(
              'px-3.5 py-1 rounded-lg transition-all cursor-pointer',
              viewMode === 'Month'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* 2. INTERACTIVE SELECTED DAY BANNER */}
      {selectedCell && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-between text-xs sm:text-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                Activity on {selectedCell.formattedDate}:
              </span>
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold font-mono">
                {selectedCell.count > 0
                  ? `${selectedCell.count} ${selectedCell.count === 1 ? 'problem' : 'problems'} solved`
                  : 'No submissions on this day'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCell(null)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. MODE A: 365-DAYS ACTIVITY GRID (Month by Month with Clean Spacing & Labels Underneath) */}
      {viewMode === '365-Days' ? (
        <div className="space-y-4 pt-1">
          {/* Scrollable grid container */}
          <div className="overflow-x-auto pb-4 pt-1 scrollbar-thin">
            <div className="flex items-start gap-6 sm:gap-7.5 min-w-max px-1">
              {monthsData.map((m) => (
                <div key={m.monthName} className="flex flex-col items-center gap-3">
                  
                  {/* Columns of 7 Squares for this Month */}
                  <div className="flex gap-1.5">
                    {m.weeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1.5">
                        {week.map((cell, dIdx) => {
                          if (!cell) {
                            return (
                              <div
                                key={`empty-${m.monthName}-${wIdx}-${dIdx}`}
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] opacity-0 pointer-events-none"
                              />
                            );
                          }

                          const isSelected = selectedCell?.dateKey === cell.dateKey;

                          return (
                            <div
                              key={cell.dateKey}
                              onClick={() => handleCellClick(cell)}
                              onMouseEnter={() => setHoveredCell(cell)}
                              onMouseLeave={() => setHoveredCell(null)}
                              title={
                                cell.isFuture
                                  ? `${cell.formattedDate} (Future)`
                                  : `${cell.count} ${cell.count === 1 ? 'submission' : 'submissions'} on ${cell.formattedDate}`
                              }
                              className={cn(
                                'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] transition-all cursor-pointer border',
                                cell.isFuture
                                  ? 'bg-[#f5f5f5] dark:bg-dark-850/30 border-[#e8e8e8] dark:border-dark-800/30 opacity-40 cursor-not-allowed'
                                  : cell.level === 3
                                  ? 'bg-[#22c55e] dark:bg-[#22c55e] border-[#16a34a] dark:border-[#16a34a] shadow-2xs hover:scale-125'
                                  : cell.level === 2
                                  ? 'bg-[#4ade80] dark:bg-[#4ade80] border-[#22c55e] dark:border-[#22c55e] hover:scale-125'
                                  : cell.level === 1
                                  ? 'bg-[#86efac] dark:bg-[#86efac] border-[#4ade80] dark:border-[#4ade80] hover:scale-125'
                                  : 'bg-[#ededed] dark:bg-[#20222a] border-[#e2e2e2] dark:border-[#2a2c36] hover:bg-slate-300 dark:hover:bg-[#2d303b] hover:scale-115',
                                cell.isToday && 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-dark-900 font-bold',
                                isSelected && 'ring-2 ring-blue-500 scale-125 z-10'
                              )}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Month Label Centered at Bottom */}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
                    {m.fullMonthName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Footbar: Hover Tooltip preview, Streak status & Color Legend */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-dark-800 text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-3">
            <div className="font-mono text-[11px] min-h-[18px]">
              {hoveredCell ? (
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  {hoveredCell.count > 0
                    ? `🔥 ${hoveredCell.count} ${hoveredCell.count === 1 ? 'submission' : 'submissions'} on ${hoveredCell.formattedDate}`
                    : `No submissions on ${hoveredCell.formattedDate}`}
                </span>
              ) : (
                <span className="opacity-75">Click or hover any square to inspect activity.</span>
              )}
            </div>

            {/* Right: Streak & Legend: Less -> More */}
            <div className="flex items-center gap-4 flex-wrap">
              {currentStreak > 0 && (
                <span className="font-mono text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1">
                  🔥 {currentStreak} Day Streak
                </span>
              )}
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span>Less</span>
                <div className="w-3 h-3 rounded-[2px] bg-[#ededed] dark:bg-[#20222a] border border-[#e2e2e2] dark:border-[#2a2c36]" title="0 submissions" />
                <div className="w-3 h-3 rounded-[2px] bg-[#86efac] border border-[#4ade80]" title="1-2 submissions" />
                <div className="w-3 h-3 rounded-[2px] bg-[#4ade80] border border-[#22c55e]" title="3-4 submissions" />
                <div className="w-3 h-3 rounded-[2px] bg-[#22c55e] border border-[#16a34a]" title="5+ submissions" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE B: MONTH VIEW CALENDAR MATRIX */
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-dark-850/70 border border-slate-100 dark:border-dark-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                aria-label="Select Month"
                className="px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {FULL_MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m} {selectedYear}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400">Monthly Submissions Matrix</span>
            </div>

            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {currentStreak} Day Active Streak
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono font-bold text-slate-400 pt-1">
            {DAY_NAMES.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty days offset */}
            {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }).map((_, i) => (
              <div key={`offset-${i}`} className="p-2 text-center text-slate-300 dark:text-dark-700 text-xs font-mono">
                -
              </div>
            ))}

            {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }).map((_, idx) => {
              const day = idx + 1;
              const cell = evaluateDay(selectedYear, selectedMonth, day);
              const isSelected = selectedCell?.dateKey === cell.dateKey;

              return (
                <div
                  key={day}
                  onClick={() => handleCellClick(cell)}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={cn(
                    'p-2 rounded-xl text-center transition-all border font-mono cursor-pointer',
                    cell.isFuture
                      ? 'bg-slate-50/40 dark:bg-dark-900/40 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-dark-800/80 opacity-50 cursor-not-allowed'
                      : cell.level === 3
                      ? 'bg-[#22c55e] text-white font-bold border-[#16a34a] shadow-xs hover:scale-105'
                      : cell.level === 2
                      ? 'bg-[#4ade80] text-white font-bold border-[#22c55e] shadow-xs hover:scale-105'
                      : cell.level === 1
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold hover:scale-105'
                      : 'bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-800 hover:border-slate-300',
                    cell.isToday && 'ring-1 ring-emerald-500 font-bold',
                    isSelected && 'ring-2 ring-blue-500 scale-105'
                  )}
                >
                  <div className="text-xs">{day}</div>
                  <div className="text-[10px] opacity-75 font-mono">
                    {cell.count > 0 ? `${cell.count}` : '0'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;
