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

const sectionTitleClass =
  "text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200";

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

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
  const [showEditBranding, setShowEditBranding] = useState(false);
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
      setShowEditBranding(false);
      onUpdate();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Manage Business Details</h2>
        <p className="text-slate-600 text-lg mt-1">
          Update your business name, branding, and pay schedule.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-base font-medium">
          {error}
        </div>
      )}

      {/* Business name */}
      <section>
        <h3 className={sectionTitleClass}>Business name</h3>
        {!showEditName ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-slate-900 text-lg">{businessName}</span>
            <button
              type="button"
              onClick={() => {
                setEditName(businessName);
                setShowEditName(true);
              }}
              className="inline-flex items-center gap-2 text-base font-medium text-cyan-600 hover:text-cyan-700 hover:underline"
            >
              <PencilIcon className="w-5 h-5 shrink-0" />
              Edit name
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveName} className="space-y-3 max-w-md">
            <label className="block">
              <span className="sr-only">Business name</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                placeholder="Business name"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEditName(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Branding */}
      <section>
        <h3 className={sectionTitleClass}>Branding</h3>
        {!showEditBranding ? (
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 space-y-1">
              {logoSrc && (
                <div className="flex items-center gap-2">
                  <img
                    src={logoSrc + (businessLogoPath ? "?t=" + Date.now() : "")}
                    alt=""
                    className="h-10 w-auto object-contain rounded border border-slate-200 bg-white p-1"
                  />
                  <span className="text-base text-slate-500">Logo set</span>
                </div>
              )}
              {!logoSrc && (
                <p className="text-slate-500 text-base">No logo</p>
              )}
              <p className="text-slate-700 text-base mt-1">
                {businessAddress?.trim() ? (
                  <span className="line-clamp-2">{businessAddress.trim()}</span>
                ) : (
                  <span className="text-slate-500">No address</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEditBranding(true)}
              className="inline-flex items-center gap-2 text-base font-medium text-cyan-600 hover:text-cyan-700 hover:underline shrink-0"
            >
              <PencilIcon className="w-5 h-5 shrink-0" />
              Edit branding
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveBranding} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                <p className="text-base font-medium text-slate-800 mb-3">Logo</p>
                {logoSrc && (
                  <div className="mb-4 flex items-center gap-3">
                    <img
                      src={logoSrc + (businessLogoPath ? "?t=" + Date.now() : "")}
                      alt=""
                      className="h-14 w-auto max-w-[140px] object-contain rounded-lg border border-slate-200 bg-white p-1"
                    />
                    <span className="text-sm text-slate-500">Current</span>
                  </div>
                )}
                <div className="space-y-3">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    placeholder="Logo URL (https://…)"
                  />
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white file:font-medium file:cursor-pointer hover:file:bg-cyan-600"
                  />
                  {logoFile && (
                    <span className="text-sm text-slate-500 block mt-1">{logoFile.name}</span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                <label className="block text-base font-medium text-slate-800 mb-3">
                  Business address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 text-base placeholder-slate-400 resize-y focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="e.g. 123 High Street, London"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEditBranding(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base disabled:opacity-50"
              >
                {loading ? "Saving…" : "Save branding"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Danger zone */}
      <section className="pt-6 border-t border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Danger zone</h3>
        <p className="text-slate-600 text-sm mb-4">
          Deleting this business will remove all staff links and payslip history. This cannot be
          undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-medium text-base transition-colors"
          >
            Delete this business
          </button>
        ) : (
          <div className="inline-flex flex-wrap items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50/80">
            <span className="text-slate-800 text-base font-medium">
              Are you sure? This action cannot be undone.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
