'use client';

import { Fragment, useMemo, useState } from 'react';
import type { Job } from '@/lib/types';
import { JOB_CATEGORIES, JOB_SERVICES } from '@/lib/job-catalog';
import JobIcon from './JobIcon';
import JobProcessPanel from './JobProcessPanel';

type CarEntry = { carModel: string; customerPlate: string };

type IntakeForm = {
  customerName: string;
  phone: string;
  price: string;
  services: Set<string>;
  cars: CarEntry[];
};

const EMPTY_INTAKE: IntakeForm = {
  customerName: '',
  phone: '',
  price: '',
  services: new Set(),
  cars: [{ carModel: '', customerPlate: '' }],
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

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

export default function JobsManager({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState('');
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intake, setIntake] = useState<IntakeForm>(EMPTY_INTAKE);
  const [intakeError, setIntakeError] = useState('');
  const [intakeSaving, setIntakeSaving] = useState(false);
  const [customService, setCustomService] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ customerName: '', phone: '', carModel: '', carNumber: '', price: '' });

  const refresh = async () => {
    const res = await fetch('/api/admin/jobs');
    const body = await res.json();
    setJobs(body.jobs);
  };

  const stats = useMemo(() => {
    const today = jobs.filter((j) => isToday(j.createdAt)).length;
    const working = jobs.filter((j) => j.status === 'active').length;
    const ready = jobs.filter((j) => j.status === 'completed').length;
    const deliveredToday = jobs.filter((j) => j.status === 'delivered' && isToday(j.updatedAt)).length;
    return { today, working, ready, deliveredToday };
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.jobNumber, j.customerName, j.phone, j.carModel, j.customerPlate, j.confirmedPlate, j.suggestedPlate]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    );
  }, [jobs, search]);

  const toggleIntakeService = (s: string) => {
    setIntake((prev) => {
      const next = new Set(prev.services);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return { ...prev, services: next };
    });
  };

  // "Add more": lets staff type any work item / detail not in the fixed
  // list (e.g. a specific PPF option, a note). It just gets added to the
  // selected work items.
  const addCustomService = () => {
    const v = customService.trim();
    if (!v) return;
    setIntake((prev) => ({ ...prev, services: new Set(prev.services).add(v) }));
    setCustomService('');
  };
  const customIntakeServices = Array.from(intake.services).filter((s) => !JOB_SERVICES.includes(s));

  // Car list handlers (a customer can bring several cars at once).
  const addCar = () =>
    setIntake((p) => ({ ...p, cars: [...p.cars, { carModel: '', customerPlate: '' }] }));
  const removeCar = (idx: number) =>
    setIntake((p) => ({ ...p, cars: p.cars.filter((_, i) => i !== idx) }));
  const updateCar = (idx: number, field: 'carModel' | 'customerPlate', value: string) =>
    setIntake((p) => ({ ...p, cars: p.cars.map((car, i) => (i === idx ? { ...car, [field]: value } : car)) }));

  const submitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intake.customerName.trim()) {
      setIntakeError('Customer name is needed.');
      return;
    }
    if (intake.services.size === 0) {
      setIntakeError('Pick at least one work item (you can change it later).');
      return;
    }
    setIntakeError('');
    setIntakeSaving(true);
    try {
      const base = {
        customerName: intake.customerName.trim(),
        phone: intake.phone.trim() || undefined,
        services: Array.from(intake.services),
        price: intake.price ? Number(intake.price) : undefined,
      };
      // One job per car, all under the same customer.
      for (const car of intake.cars) {
        const res = await fetch('/api/admin/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...base,
            carModel: car.carModel.trim() || undefined,
            customerPlate: car.customerPlate.trim() || undefined,
          }),
        });
        const body = await res.json();
        if (!res.ok) {
          setIntakeError(body.error || 'Could not add the car.');
          return;
        }
      }
      setIntake({ ...EMPTY_INTAKE, services: new Set(), cars: [{ carModel: '', customerPlate: '' }] });
      setIntakeOpen(false);
      await refresh();
    } finally {
      setIntakeSaving(false);
    }
  };

  const patchJob = async (id: string, patch: Record<string, unknown>, failMsg: string) => {
    const res = await fetch(`/api/admin/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.status === 401) {
      window.location.href = '/admin/login?next=/admin/jobs';
      return 'Your session expired — please log in again.';
    }
    const body = await res.json();
    if (!res.ok) return body.error || failMsg;
    await refresh();
  };

  // New -> Working (done from the Start Work panel with number/work/price)
  const startWork = async (
    id: string,
    patch: { confirmedPlate: string; services: string[]; price: number; status: 'active' }
  ) => {
    const err = await patchJob(id, patch, 'Could not start the work.');
    if (err) return err;
    setExpandedId(null);
  };

  // Working -> Ready
  const completeWork = (id: string) => patchJob(id, { status: 'completed' }, 'Could not mark work complete.');
  // Ready -> Delivered
  const deliverJob = (id: string) => patchJob(id, { status: 'delivered' }, 'Could not deliver.');
  const openEdit = (job: Job) => {
    setEditingId(job.id);
    setEditForm({
      customerName: job.customerName || '',
      phone: job.phone || '',
      carModel: job.carModel || '',
      carNumber: job.confirmedPlate || job.customerPlate || job.suggestedPlate || '',
      price: job.price != null ? String(job.price) : '',
    });
  };
  const cancelEdit = () => setEditingId(null);
  const submitEdit = async (job: Job) => {
    if (!editForm.customerName.trim()) {
      alert('Customer name cannot be empty.');
      return;
    }
    const patch = {
      customerName: editForm.customerName.trim(),
      phone: editForm.phone.trim(),
      carModel: editForm.carModel.trim() || null,
      confirmedPlate: editForm.carNumber.trim() || null,
      price: editForm.price.trim() === '' ? null : Number(editForm.price),
    };
    const err = await patchJob(job.id, patch, 'Could not save.');
    if (err) {
      alert(err);
      return;
    }
    setEditingId(null);
  };

  const deleteJobEntry = async (job: Job) => {
    if (!confirm(`Delete ${job.jobNumber} (${job.customerName})? This permanently removes this car.`)) return;
    const res = await fetch(`/api/admin/jobs/${job.id}`, { method: 'DELETE' });
    if (res.ok) {
      await refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error || 'Could not delete.');
    }
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Cars today', value: stats.today },
          { label: 'Working', value: stats.working },
          { label: 'Ready to deliver', value: stats.ready },
          { label: 'Delivered today', value: stats.deliveredToday },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-2xl font-semibold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add car */}
      <div className="mb-4">
        <button
          onClick={() => setIntakeOpen((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
        >
          {intakeOpen ? 'Close' : '+ Add Car'}
        </button>
      </div>

      {intakeOpen && (
        <form onSubmit={submitIntake} className="rounded-xl border border-slate-200 bg-white p-4 mb-6 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Customer name</label>
              <input
                type="text"
                value={intake.customerName}
                onChange={(e) => setIntake((p) => ({ ...p, customerName: e.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone number (optional)</label>
              <input
                type="tel"
                value={intake.phone}
                onChange={(e) => setIntake((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Price, ₹ (optional)</label>
              <input
                type="number"
                min={0}
                step={50}
                value={intake.price}
                onChange={(e) => setIntake((p) => ({ ...p, price: e.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* Cars for this customer — add more than one at once */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Cars for this customer <span className="text-slate-400 font-normal">— add more if the same customer brought several</span>
            </label>
            <div className="space-y-2">
              {intake.cars.map((car, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <input
                    type="text"
                    value={car.customerPlate}
                    onChange={(e) => updateCar(idx, 'customerPlate', e.target.value.toUpperCase())}
                    placeholder={`Car ${idx + 1} number (if known)`}
                    className="flex-1 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-2 py-1.5 text-sm uppercase"
                  />
                  <input
                    type="text"
                    value={car.carModel}
                    onChange={(e) => updateCar(idx, 'carModel', e.target.value)}
                    placeholder="Car model (optional)"
                    className="flex-1 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-2 py-1.5 text-sm"
                  />
                  {intake.cars.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCar(idx)}
                      className="text-xs text-red-600 hover:text-red-700 px-2 py-1.5 shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCar}
              className="mt-2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
            >
              + Add another car
            </button>
          </div>

          <label className="block text-xs font-medium text-slate-500 mb-2">Work needed (you can change it when you start)</label>
          <div className="space-y-3 mb-4">
            {JOB_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  <JobIcon name={cat.icon} className="w-3.5 h-3.5" />
                  {cat.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.services.map((s) => {
                    const checked = intake.services.has(s);
                    return (
                      <label
                        key={s}
                        className={`text-xs border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${
                          checked
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleIntakeService(s)} />
                        {s}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Add more (custom work / details) */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Add more (anything not in the list)</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomService();
                  }
                }}
                placeholder="e.g. PPF full body, or any note"
                className="flex-1 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={addCustomService}
                className="text-sm bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-md transition-colors"
              >
                Add
              </button>
            </div>
            {customIntakeServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {customIntakeServices.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 text-xs bg-indigo-600 text-white rounded-lg px-2.5 py-1">
                    {s}
                    <button type="button" onClick={() => toggleIntakeService(s)} className="hover:text-indigo-200 font-bold">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {intakeError && <p className="text-xs text-red-600 mb-3">{intakeError}</p>}
          <button
            type="submit"
            disabled={intakeSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-60"
          >
            {intakeSaving ? 'Adding…' : intake.cars.length > 1 ? `Add ${intake.cars.length} Cars` : 'Add Car'}
          </button>
        </form>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, phone, or car number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-80 rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-3 py-2 text-sm mb-4"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-600 border-b border-slate-200">
              <th className="px-4 py-2.5 font-medium">No.</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Car</th>
              <th className="px-4 py-2.5 font-medium">Car number</th>
              <th className="px-4 py-2.5 font-medium">Work</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Do next</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No cars yet.
                </td>
              </tr>
            )}
            {filtered.map((job) => (
              <Fragment key={job.id}>
                <tr className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">{job.jobNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{job.customerName}</p>
                    <p className="text-xs text-slate-600">{job.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{job.carModel || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-800 font-medium">
                    {job.confirmedPlate || job.customerPlate || job.suggestedPlate || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-800 max-w-[220px]">
                    {job.services.join(', ') || '—'}
                    {job.price != null && <span className="block text-slate-700 font-semibold mt-0.5">₹{job.price.toLocaleString('en-IN')}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[job.status]}`}>
                      {STATUS_LABELS[job.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-3">
                      {job.status === 'draft' && (
                        <button
                          onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                          className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                        >
                          {expandedId === job.id ? 'Close' : 'Start Work'}
                        </button>
                      )}
                      {job.status === 'active' && (
                        <button
                          onClick={() => completeWork(job.id)}
                          className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                        >
                          Work Complete
                        </button>
                      )}
                      {job.status === 'completed' && (
                        <button
                          onClick={() => { if (confirm(`Deliver ${job.jobNumber} to the customer? This closes it.`)) deliverJob(job.id); }}
                          className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                        >
                          Deliver
                        </button>
                      )}
                      {job.status === 'delivered' && (
                        <span className="inline-flex items-center text-sm text-emerald-600 font-semibold px-1 py-1">Done ✓</span>
                      )}

                      {/* Edit & Delete: hidden once the car is delivered */}
                      {job.status !== 'delivered' && (
                        <>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => (editingId === job.id ? cancelEdit() : openEdit(job))}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                          Edit
                        </button>
                        <button
                          onClick={() => deleteJobEntry(job)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 border border-red-300 hover:border-red-400 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                          Delete
                        </button>
                      </div>

                      {/* On-demand edit panel (customer + car + phone + price) */}
                      {editingId === job.id && (
                        <div className="mt-1 w-[240px] max-w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 flex flex-col gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Customer name</label>
                            <input
                              value={editForm.customerName}
                              onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))}
                              placeholder="Customer name"
                              className="w-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Phone</label>
                            <input
                              value={editForm.phone}
                              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                              placeholder="Phone number"
                              className="w-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Car model</label>
                            <input
                              value={editForm.carModel}
                              onChange={(e) => setEditForm((f) => ({ ...f, carModel: e.target.value }))}
                              placeholder="e.g. BMW X7"
                              className="w-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Car number</label>
                            <input
                              value={editForm.carNumber}
                              onChange={(e) => setEditForm((f) => ({ ...f, carNumber: e.target.value }))}
                              placeholder="e.g. UP14 AB1234"
                              className="w-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Price (₹)</label>
                            <input
                              value={editForm.price}
                              onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                              inputMode="numeric"
                              placeholder="0"
                              className="w-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              onClick={() => submitEdit(job)}
                              className="text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 rounded-md transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {job.status === 'draft' && expandedId === job.id && (
                  <JobProcessPanel job={job} onStartWork={(patch) => startWork(job.id, patch)} />
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
