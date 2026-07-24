'use client';

import { useMemo, useState } from 'react';
import type { StockItem, StockPurchase } from '@/lib/types';
import { STOCK_CATEGORIES } from '@/lib/job-catalog';

type ItemForm = { name: string; category: string; qty: string; unit: string; lowAt: string };
const EMPTY_ITEM: ItemForm = { name: '', category: STOCK_CATEGORIES[0], qty: '', unit: 'pcs', lowAt: '3' };

type PurchaseForm = { itemName: string; qty: string; unitCost: string };
const EMPTY_PURCHASE: PurchaseForm = { itemName: '', qty: '', unitCost: '' };

export default function StockManager({
  initialItems,
  initialPurchases,
  isOwner,
}: {
  initialItems: StockItem[];
  initialPurchases: StockPurchase[] | null;
  isOwner: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [purchases, setPurchases] = useState(initialPurchases ?? []);
  const [addOpen, setAddOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM);
  const [itemError, setItemError] = useState('');
  const [itemSaving, setItemSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(EMPTY_PURCHASE);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSaving, setPurchaseSaving] = useState(false);

  const lowStockCount = useMemo(() => items.filter((i) => i.qty <= i.lowAt).length, [items]);

  const refreshItems = async () => {
    const res = await fetch('/api/admin/stock');
    const body = await res.json();
    setItems(body.items);
  };

  const refreshPurchases = async () => {
    if (!isOwner) return;
    const res = await fetch('/api/admin/stock-purchases');
    const body = await res.json();
    setPurchases(body.purchases);
  };

  const submitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(itemForm.qty);
    const lowAt = Number(itemForm.lowAt);
    if (!itemForm.name.trim()) {
      setItemError('Item name is required.');
      return;
    }
    if (!Number.isFinite(qty) || qty < 0) {
      setItemError('Enter a valid starting quantity.');
      return;
    }
    setItemError('');
    setItemSaving(true);
    try {
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemForm.name.trim(),
          category: itemForm.category,
          qty,
          unit: itemForm.unit.trim() || 'pcs',
          lowAt: Number.isFinite(lowAt) ? lowAt : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setItemError(body.error || 'Could not add item.');
        return;
      }
      setItemForm(EMPTY_ITEM);
      setAddOpen(false);
      await refreshItems();
    } finally {
      setItemSaving(false);
    }
  };

  const adjust = async (id: string, delta: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/stock/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) await refreshItems();
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (item: StockItem) => {
    if (!confirm(`Remove "${item.name}" from stock? This can't be undone.`)) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/stock/${item.id}`, { method: 'DELETE' });
      if (res.ok) await refreshItems();
    } finally {
      setBusyId(null);
    }
  };

  const submitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(purchaseForm.qty);
    const unitCost = Number(purchaseForm.unitCost);
    if (!purchaseForm.itemName.trim()) {
      setPurchaseError('Item name is required.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setPurchaseError('Enter a valid quantity purchased.');
      return;
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setPurchaseError('Enter a valid unit cost.');
      return;
    }
    setPurchaseError('');
    setPurchaseSaving(true);
    try {
      const res = await fetch('/api/admin/stock-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName: purchaseForm.itemName.trim(), qty, unitCost }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPurchaseError(body.error || 'Could not log purchase.');
        return;
      }
      setPurchaseForm(EMPTY_PURCHASE);
      setPurchaseOpen(false);
      await Promise.all([refreshItems(), refreshPurchases()]);
    } finally {
      setPurchaseSaving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-2xl font-semibold text-slate-800">{items.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Items tracked</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className={`text-2xl font-semibold ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{lowStockCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Low stock</p>
        </div>
        {isOwner && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-2xl font-semibold text-slate-800">{purchases.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Purchases logged</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
        >
          {addOpen ? 'Close' : '+ Add stock item'}
        </button>
        {isOwner && (
          <button
            onClick={() => setPurchaseOpen((v) => !v)}
            className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
          >
            {purchaseOpen ? 'Close' : '+ Log purchase'}
          </button>
        )}
      </div>

      {addOpen && (
        <form onSubmit={submitItem} className="rounded-xl border border-slate-200 bg-white p-4 mb-6 shadow-sm grid sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Item name</label>
            <input
              type="text"
              value={itemForm.name}
              onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <select
              value={itemForm.category}
              onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {STOCK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
            <input
              type="number"
              min={0}
              value={itemForm.qty}
              onChange={(e) => setItemForm((p) => ({ ...p, qty: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
            <input
              type="text"
              placeholder="ltr, pcs…"
              value={itemForm.unit}
              onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Low-stock at</label>
            <input
              type="number"
              min={0}
              value={itemForm.lowAt}
              onChange={(e) => setItemForm((p) => ({ ...p, lowAt: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          {itemError && <p className="text-xs text-red-600 sm:col-span-5">{itemError}</p>}
          <button
            type="submit"
            disabled={itemSaving}
            className="sm:col-span-5 justify-self-start bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-60"
          >
            {itemSaving ? 'Adding…' : 'Add item'}
          </button>
        </form>
      )}

      {isOwner && purchaseOpen && (
        <form onSubmit={submitPurchase} className="rounded-xl border border-slate-200 bg-white p-4 mb-6 shadow-sm grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Item name</label>
            <input
              type="text"
              placeholder="Matches an existing item, or creates one"
              value={purchaseForm.itemName}
              onChange={(e) => setPurchaseForm((p) => ({ ...p, itemName: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Qty purchased</label>
            <input
              type="number"
              min={1}
              value={purchaseForm.qty}
              onChange={(e) => setPurchaseForm((p) => ({ ...p, qty: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Unit cost (₹)</label>
            <input
              type="number"
              min={0}
              value={purchaseForm.unitCost}
              onChange={(e) => setPurchaseForm((p) => ({ ...p, unitCost: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="text-xs text-slate-500">
            Total: <span className="font-medium text-slate-700">₹{((Number(purchaseForm.qty) || 0) * (Number(purchaseForm.unitCost) || 0)).toLocaleString('en-IN')}</span>
          </div>
          {purchaseError && <p className="text-xs text-red-600 sm:col-span-4">{purchaseError}</p>}
          <button
            type="submit"
            disabled={purchaseSaving}
            className="sm:col-span-4 justify-self-start bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-60"
          >
            {purchaseSaving ? 'Logging…' : 'Log purchase'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2.5 font-medium">Item</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">On hand</th>
              <th className="px-4 py-2.5 font-medium">Adjust</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No stock items yet.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const low = item.qty <= item.lowAt;
              return (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.category}</td>
                  <td className="px-4 py-3">
                    <span className={low ? 'text-red-600 font-medium' : 'text-slate-700'}>
                      {item.qty} {item.unit}
                    </span>
                    {low && (
                      <span className="ml-2 inline-block text-[10px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                        LOW
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => adjust(item.id, -1)}
                        disabled={busyId === item.id}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition-colors disabled:opacity-60"
                      >
                        −
                      </button>
                      <button
                        onClick={() => adjust(item.id, 1)}
                        disabled={busyId === item.id}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition-colors disabled:opacity-60"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeItem(item)}
                      disabled={busyId === item.id}
                      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isOwner && (
        <>
          <h2 className="text-lg font-semibold mb-3 text-slate-800">Purchase log</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2.5 font-medium">Item</th>
                  <th className="px-4 py-2.5 font-medium">Qty</th>
                  <th className="px-4 py-2.5 font-medium">Unit cost</th>
                  <th className="px-4 py-2.5 font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                      No purchases logged yet.
                    </td>
                  </tr>
                )}
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.itemName}</td>
                    <td className="px-4 py-3 text-slate-600">{p.qty}</td>
                    <td className="px-4 py-3 text-slate-600">₹{p.unitCost.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">₹{p.totalCost.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(p.purchasedAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
