import React, { useState } from "react";
import { backend } from "@/api/backendClient";
import { useAuth } from "@/lib/AuthContext";
import { useLedProfile } from "@/hooks/useLedProfile";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatRand } from "@/lib/ledUtils";
import { Loader2, Landmark } from "lucide-react";

export default function BusinessFunding() {
  const { user } = useAuth();
  const { business } = useLedProfile();
  const { data, loading, reload } = useLedList(() =>
    Promise.all([
      backend.entities.Program.filter({ status: "open" }).catch(() => []),
      backend.entities.FundingApplication.filter({}).catch(() => []),
    ]),
    [business?.id]
  );

  const [active, setActive] = useState(null);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading || !data) return <SectionLoading />;
  const [programs, apps] = data;

  const isVerified = business?.status === "verified";
  const appMap = Object.fromEntries(apps.map((a) => [a.program, a]));

  const apply = async (e) => {
    e.preventDefault();
    if (!isVerified) return toast({ title: "Not verified", description: "Your business must be verified before applying for funding.", variant: "destructive" });
    if (!amount || isNaN(Number(amount))) return toast({ title: "Enter a valid amount", variant: "destructive" });
    if (active.max_amount && Number(amount) > active.max_amount) return toast({ title: `Maximum for this program is ${formatRand(active.max_amount)}`, variant: "destructive" });
    setBusy(true);
    try {
      await backend.entities.FundingApplication.create({
        program: active.id,
        business: business.id,
        requested_amount: Number(amount),
        purpose: purpose.trim(),
        status: "submitted",
      });
      toast({ title: "Application submitted", description: "You'll be notified when a decision is made." });
      setActive(null);
      setAmount("");
      setPurpose("");
      reload();
    } catch (e) {
      toast({ title: "Application failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Funding" subtitle="Apply for municipal and agency support programs. Track your applications through to decision." />

      {!isVerified && (
        <div className="led-box border-l-4 border-l-tangerine mb-4">
          <b className="text-sm text-ink">Verification required</b>
          <p className="text-mute text-xs mt-0.5">Your business must be verified before you can apply for funding.</p>
        </div>
      )}

      {programs.length === 0 ? (
        <SectionEmpty>No funding programs are open right now.</SectionEmpty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {programs.map((p) => {
            const app = appMap[p.id];
            return (
              <div key={p.id} className="led-box flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <b className="text-sm text-ink">{p.name}</b>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-soft text-mute">{p.funder}</span>
                </div>
                {p.description && <p className="text-xs text-mute mb-2">{p.description}</p>}
                <div className="text-xs text-mute mb-3 space-y-0.5">
                  {p.max_amount && <span className="block">Max: {formatRand(p.max_amount)}</span>}
                  {p.support_type && <span className="block">Support: {p.support_type}</span>}
                  {p.required_documents?.length > 0 && <span className="block">Requires: {p.required_documents.join(", ")}</span>}
                </div>
                <div className="mt-auto">
                  {app ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-mute">Applied: {formatRand(app.requested_amount)}</span>
                      <StatusPill status={app.status} />
                    </div>
                  ) : (
                    <button onClick={() => setActive(p)} disabled={!isVerified} className="led-btn led-btn-s w-full">
                      Apply
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {apps.length > 0 && (
        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">My applications</h2>
          <div className="space-y-2">
            {apps.map((a) => {
              const p = programs.find((x) => x.id === a.program);
              return (
                <div key={a.id} className="led-box py-3">
                  <div className="flex items-center justify-between mb-1">
                    <b className="text-sm text-ink">{p?.name || "Program removed"}</b>
                    <StatusPill status={a.status} />
                  </div>
                  <span className="text-xs text-mute">Requested: {formatRand(a.requested_amount)}</span>
                  {a.purpose && <p className="text-xs text-mute mt-0.5">{a.purpose}</p>}
                  {a.decision_note && (
                    <div className="mt-1.5 rounded-lg bg-soft p-2 text-xs">
                      <b className="text-ink">Decision: </b>
                      <span className="text-mute">{a.decision_note}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.name}</DialogTitle>
                <DialogDescription>{active.funder}{active.max_amount ? ` · Max ${formatRand(active.max_amount)}` : ""}</DialogDescription>
              </DialogHeader>
              <form onSubmit={apply} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Amount requested (R)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 25000" className="led-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Purpose</label>
                  <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} placeholder="How will you use the funding?" className="led-field" />
                </div>
                <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
                  Submit application
                </button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}