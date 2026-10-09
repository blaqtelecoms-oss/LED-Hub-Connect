import React, { useState, useMemo, useEffect } from "react";
import { backend } from "@/api/backendClient";
import { useAuth } from "@/lib/AuthContext";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { formatRand } from "@/lib/ledUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Eye, Check, X, FileText, Loader2 } from "lucide-react";

const TABS = [
  { key: "review", label: "To review", filter: (a) => a.status === "submitted" || a.status === "under_review" },
  { key: "approved", label: "Approved", filter: (a) => a.status === "approved" },
  { key: "declined", label: "Declined", filter: (a) => a.status === "declined" },
  { key: "all", label: "All", filter: () => true },
];

// Program card colours — cycle through the design's g / b / o palette.
const PC = ["bg-brand text-white", "bg-aqua text-ink", "bg-tangerine text-white"];

export default function OfficerFunding() {
  const { user } = useAuth();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      backend.entities.FundingApplication.list().catch(() => []),
      backend.entities.Business.list().catch(() => []),
      backend.entities.Program.list().catch(() => []),
    ])
  );
  const [tab, setTab] = useState("review");
  const [active, setActive] = useState(null);

  const [apps, businesses, programs] = data || [[], [], []];
  const bizMap = useMemo(() => Object.fromEntries(businesses.map((b) => [b.id, b])), [businesses]);
  const progMap = useMemo(() => Object.fromEntries(programs.map((p) => [p.id, p])), [programs]);
  const filtered = apps.filter(TABS.find((t) => t.key === tab).filter);

  // Program progress: decided (approved/declined) vs total applications per program.
  const programProgress = programs.map((p, i) => {
    const pApps = apps.filter((a) => a.program === p.id);
    const decided = pApps.filter((a) => a.status === "approved" || a.status === "declined").length;
    const total = pApps.length || p.slots_total || 0;
    const pct = total ? Math.round((decided / total) * 100) : 0;
    return { p, decided, total, pct, color: PC[i % PC.length] };
  });

  return (
    <div>
      <PageHeader title="Programs" subtitle="Review applications and submitted documents, then approve or decline with a note." />

      {/* Chip tabs */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`led-chip ${tab === t.key ? "on" : ""}`}
          >
            {t.label} ({apps.filter(t.filter).length})
          </button>
        ))}
      </div>

      {/* Program progress cards */}
      {programProgress.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 mb-5">
          {programProgress.map(({ p, decided, total, pct, color }) => (
            <div key={p.id} className={`rounded-[14px] p-4 ${color} min-h-[122px] flex flex-col justify-between`}>
              <b className="text-[17px] leading-tight block">{p.name}</b>
              <span className="opacity-90 text-xs mt-2 block">
                {decided} of {total} applications decided · {pct}%
                <span className="block h-[5px] rounded bg-white/35 mt-1.5 overflow-hidden">
                  <span className="block h-full bg-current" style={{ width: `${pct}%` }} />
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Applications table */}
      {loading ? (
        <SectionLoading />
      ) : filtered.length === 0 ? (
        <SectionEmpty>No applications in this view.</SectionEmpty>
      ) : (
        <div className="led-box overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {["Business", "Program", "Request", "Decision"].map((h) => (
                  <th key={h} className="text-left text-mute font-semibold text-xs py-2 px-2 border-b border-line">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const decided = a.status === "approved" || a.status === "declined";
                return (
                  <tr key={a.id}>
                    <td className="py-2.5 px-2 border-b border-line">
                      <b className="text-sm text-ink">{bizMap[a.business]?.name || "Business removed"}</b>
                    </td>
                    <td className="py-2.5 px-2 border-b border-line text-sm text-ink">
                      {progMap[a.program]?.name || "Program removed"}
                    </td>
                    <td className="py-2.5 px-2 border-b border-line text-sm text-ink">
                      {formatRand(a.requested_amount)}
                    </td>
                    <td className="py-2.5 px-2 border-b border-line">
                      {decided ? (
                        <StatusPill status={a.status} />
                      ) : (
                        <button onClick={() => setActive(a)} className="led-btn led-btn-s">
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <FundingDialog
        app={active}
        onClose={() => setActive(null)}
        bizMap={bizMap}
        progMap={progMap}
        user={user}
        onDecided={reload}
      />
    </div>
  );
}

function FundingDialog({ app, onClose, bizMap, progMap, user, onDecided }) {
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!app) return;
    setNote(app.decision_note || "");
    setLoadingDocs(true);
    backend.entities.BusinessDocument
      .filter({ business: app.business })
      .then((d) => setDocs(d))
      .catch(() => setDocs([]))
      .finally(() => setLoadingDocs(false));
  }, [app]);

  if (!app) return null;
  const decided = app.status === "approved" || app.status === "declined";

  const viewDoc = async (doc) => {
    if (!doc.file) {
      toast({ title: "No file attached", description: "This document checklist item has no uploaded file." });
      return;
    }
    try {
      const { signed_url } = await backend.storage.createSignedUrl({ file_uri: doc.file });
      window.open(signed_url, "_blank");
    } catch (e) {
      toast({ title: "Couldn't open document", description: e.message, variant: "destructive" });
    }
  };

  const decide = async (status) => {
    if (!note.trim()) {
      toast({ title: "Add a decision note", description: "A note is required to approve or decline.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await backend.entities.FundingApplication.update(app.id, {
        status,
        decision_note: note.trim(),
        decided_by: user.id,
        decided_at: new Date().toISOString(),
      });
      toast({ title: status === "approved" ? "Application approved" : "Application declined" });
      onDecided();
      onClose();
    } catch (e) {
      toast({ title: "Decision failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    setBusy(true);
    try {
      await backend.entities.FundingApplication.update(app.id, { status: "under_review" });
      toast({ title: "Application reopened" });
      onDecided();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{bizMap[app.business]?.name || "Business"}</DialogTitle>
          <DialogDescription>
            {progMap[app.program]?.name || "Program"} · {formatRand(app.requested_amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Purpose</p>
            <p className="text-ink">{app.purpose || "—"}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Current status</p>
            <StatusPill status={app.status} />
          </div>

          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Submitted documents</p>
            {loadingDocs ? (
              <div className="py-4 text-center">
                <Loader2 className="w-5 h-5 text-brand animate-spin mx-auto" />
              </div>
            ) : docs.length === 0 ? (
              <p className="text-mute">No documents uploaded for this business.</p>
            ) : (
              <ul className="space-y-1.5">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 p-2 rounded-lg border border-line">
                    <FileText className="w-4 h-4 text-brand shrink-0" />
                    <span className="min-w-0 flex-1 text-xs font-semibold text-ink truncate">{d.type}</span>
                    <StatusPill status={d.status} />
                    <button
                      onClick={() => viewDoc(d)}
                      className="text-brand hover:underline text-xs font-semibold flex items-center gap-1 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-mute uppercase tracking-wide mb-1.5 block">Decision note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Explain the decision (visible to the applicant)."
              className="led-field"
            />
          </div>

          {!decided ? (
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={() => decide("approved")}
                className="led-btn led-btn-s flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                disabled={busy}
                onClick={() => decide("declined")}
                className="led-btn led-btn-r led-btn-s flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Decline
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-soft p-3 text-sm">
              <p className="text-ink font-semibold mb-0.5 capitalize">{app.status}</p>
              <p className="text-mute">{app.decision_note || "No note recorded."}</p>
              <button onClick={reopen} disabled={busy} className="text-xs text-brand font-semibold mt-1 hover:underline">
                Reopen decision
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}