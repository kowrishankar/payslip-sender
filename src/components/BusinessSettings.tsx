"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BusinessSettingsProps {
  businessId: string;
  businessName: string;
  businessAddress?: string;
  businessLogoUrl?: string;
  businessLogoPath?: string;
  onUpdate: () => void;
}

export default function BusinessSettings({
  businessId,
  businessName,
  businessAddress = "",
  businessLogoUrl = "",
  businessLogoPath,
  onUpdate,
}: BusinessSettingsProps) {
  const router = useRouter();
  const [showEditName, setShowEditName] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState(businessName);
  const [address, setAddress] = useState(businessAddress);
  const [logoUrl, setLogoUrl] = useState(businessLogoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const logoSrc = businessLogoPath
    ? `/api/businesses/${businessId}/logo`
    : businessLogoUrl || null;

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const name = editName.trim();
    if (!name) return;
    if (!confirm(`Update business name to "${name}"?`)) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update");
      }
      setShowEditName(false);
      onUpdate();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Delete this business? All staff links and payslip history for this business will be removed. This cannot be undone."
      )
    )
      return;
    setShowDeleteConfirm(false);
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update");
      }
      if (logoFile) {
        const formData = new FormData();
        formData.set("logo", logoFile);
        const uploadRes = await fetch(`/api/businesses/${businessId}/logo`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error ?? "Failed to upload logo");
        }
        setLogoFile(null);
      }
      onUpdate();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-cyan-200/80 bg-white p-6 space-y-6 shadow-card">
      <h3 className="text-xl font-semibold text-slate-900">Business settings</h3>

      {error && (
        <p className="text-base text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-medium">
          {error}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-base font-medium text-slate-800">Business name</span>
          <button
            type="button"
            onClick={() => {
              setEditName(businessName);
              setShowEditName(true);
            }}
            className="text-base font-medium text-cyan-600 hover:text-cyan-700"
          >
            Edit name
          </button>
        </div>
        {showEditName && (
          <form onSubmit={handleSaveName} className="mt-3 flex gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder="Business name"
            />
            <button
              type="button"
              onClick={() => setShowEditName(false)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base disabled:opacity-50 shadow-md shadow-cyan-500/25"
            >
              Save
            </button>
          </form>
        )}
      </div>

      <form onSubmit={handleSaveBranding} className="space-y-4">
        <h4 className="text-base font-medium text-slate-800">Branding</h4>
        <div>
          <label className="block text-base font-medium text-slate-800 mb-1">Business address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base placeholder-slate-500 resize-y focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            placeholder="e.g. 123 High Street, London"
          />
        </div>
        <div>
          <label className="block text-base font-medium text-slate-800 mb-1">Logo (URL)</label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            placeholder="https://example.com/logo.png"
          />
        </div>
        <div>
          <label className="block text-base font-medium text-slate-800 mb-1">Or upload logo (PNG, JPG, WebP)</label>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            className="w-full text-base text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-500 file:text-white file:font-medium file:cursor-pointer hover:file:bg-cyan-600"
          />
          {logoSrc && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={logoSrc + (businessLogoPath ? "?t=" + Date.now() : "")}
                alt="Business logo"
                className="h-12 w-auto object-contain rounded-lg border border-slate-200"
              />
              <span className="text-base text-slate-600">Current logo</span>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base disabled:opacity-50 shadow-md shadow-cyan-500/25"
        >
          {loading ? "Saving…" : "Save branding"}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-base font-medium text-red-600 hover:text-red-700"
        >
          Delete this business
        </button>
        {showDeleteConfirm && (
          <div className="mt-3 p-4 rounded-xl border border-red-200 bg-red-50">
            <p className="text-base text-slate-800 mb-3">
              Are you sure? This will remove the business and all its staff links and payslip
              history. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-base"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-base disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Yes, delete business"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
