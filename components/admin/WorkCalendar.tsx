'use client';

import { useMemo, useState } from 'react';
import type { Job } from '@/lib/types';

const STATUS_STYLES: Record<Job['status'], string> = {
  draft: 'bg-amber-100 text-amber-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
};
const STATUS_LABELS: Record<Job['status'], string> = {
  draft: 'New',
  active: 'Working',
  completed: 'Ready',
  delivered: 'Delivered',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayKey(y: number, m: number, d: number) {
  return `${y}-${m}-${d}`;
}

export default function WorkCalendar({ initialJobs }: { initialJobs: Job[] }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(dayKey(now.getFullYear(), now.getMonth(), now.getDate()));

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const j of initialJobs) {
      const d = new Date(j.createdAt);
      const key = dayKey(d.getFullYear(), d.getMonth(), d.getDate());
      const list = map.get(key) || [];
      list.push(j);
      map.set(key, list);
    }
    return map;
  }, [initialJobs]);

  const firstWeekday = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthTotal = useMemo(() => {
    let n = 0;
    for (let d = 1; d <= daysInMonth; d++) n += jobsByDay.get(dayKey(cursor.y, cursor.m, d))?.length || 0;
    return n;
  }, [jobsByDay, cursor, daysInMonth]);

  const monthDays = useMemo(() => {
    const arr: { day: number; jobs: Job[] }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const list = jobsByDay.get(dayKey(cursor.y, cursor.m, d));
      if (list && list.length) arr.push({ day: d, jobs: list });
    }
    return arr;
  }, [jobsByDay, cursor, daysInMonth]);

  const vehicleNumber = (j: Job) => j.confirmedPlate || j.customerPlate || j.suggestedPlate || 'No number';

  const prevMonth = () => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const nextMonth = () => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));

  const todayKey = dayKey(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedJobs = selected ? jobsByDay.get(selected) || [] : [];
  const selectedLabel = selected
    ? (() => {
        const [y, m, d] = selected.split('-').map(Number);
        return `${d} ${MONTHS[m]} ${y}`;
      })()
    : '';

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
      {/* Compact calendar (left) */}
      <div className="w-full max-w-[300px]">
        <div className="flex items-center justify-between mb-2">
          <button onClick={prevMonth} className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm">‹</button>
          <div className="text-center">
            <div className="text-sm font-semibold text-paper">{MONTHS[cursor.m]} {cursor.y}</div>
            <div className="text-[11px] text-paperdim">{monthTotal} car{monthTotal === 1 ? '' : 's'}</div>
          </div>
          <button onClick={nextMonth} className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm">›</button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-slate-400 py-0.5">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} className="aspect-square" />;
              const key = dayKey(cursor.y, cursor.m, d);
              const count = jobsByDay.get(key)?.length || 0;
              const isToday = key === todayKey;
              const isSelected = key === selected;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(key)}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center leading-none transition-colors border ${
                    isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-xs ${isToday ? 'font-bold text-indigo-600' : 'text-slate-700'}`}>{d}</span>
                  {count > 0 && (
                    <span className="mt-0.5 text-[9px] font-medium text-white bg-indigo-600 rounded-full px-1 leading-3 min-w-[14px]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details (right — fills the rest of the screen) */}
      <div className="min-w-0">
        {/* Selected day */}
        <h3 className="text-base font-semibold text-paper mb-3">
          {selectedLabel} <span className="text-paperdim font-normal">· {selectedJobs.length} car{selectedJobs.length === 1 ? '' : 's'}</span>
        </h3>
        {selectedJobs.length === 0 ? (
          <p className="text-sm text-paperdim">No work on this day.</p>
        ) : (
          <div className="rounded-xl bg-white divide-y divide-slate-100 overflow-hidden">
            {selectedJobs.map((j) => (
              <div key={j.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {j.customerName}
                    <span className="ml-2 font-mono text-[11px] text-slate-500">{j.jobNumber}</span>
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    <span style={{ fontFamily: 'Arial, Helvetica, sans-serif' }} className="text-black font-bold">{vehicleNumber(j)}</span>
                    {j.services.length > 0 && <span> · {j.services.join(', ')}</span>}
                  </p>
                </div>
                <span className={`shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[j.status]}`}>
                  {STATUS_LABELS[j.status]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Whole-month breakdown with vehicle numbers */}
        <h3 className="text-base font-semibold text-paper mt-8 mb-3">
          {MONTHS[cursor.m]} {cursor.y} <span className="text-paperdim font-normal">· {monthTotal} car{monthTotal === 1 ? '' : 's'} this month</span>
        </h3>
        {monthDays.length === 0 ? (
          <p className="text-sm text-paperdim">No work this month.</p>
        ) : (
          <div className="rounded-xl bg-white divide-y divide-slate-100 overflow-hidden">
            {monthDays.map(({ day, jobs }) => (
              <div key={day} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                <div className="text-sm font-semibold text-slate-800 sm:w-28 shrink-0">
                  {day} {MONTHS[cursor.m]}
                  <span className="text-slate-400 font-normal"> · {jobs.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobs.map((j) => (
                    <span key={j.id} style={{ fontFamily: 'Arial, Helvetica, sans-serif' }} className="text-[11px] bg-slate-100 text-black font-bold rounded px-2 py-0.5 border border-slate-200">
                      {vehicleNumber(j)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
