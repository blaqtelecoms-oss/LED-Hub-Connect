import React, { useState, useEffect } from "react";
import { backend } from "@/api/backendClient";
import { useLedProfile } from "@/hooks/useLedProfile";
import PageHeader from "@/components/PageHeader";
import { SectionLoading } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const SECTORS = ["Retail", "Food", "Trades", "Services", "Agriculture", "Manufacturing"];

export default function BusinessProfile() {
  const { business, loading: loadingProfile } = useLedProfile();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (business) setForm({ name: business.name || "", sector: business.sector || "Retail", area: business.area || "", ward: business.ward || "", description: business.description || "", phone: business.phone || "" });
  }, [business]);

  if (loadingProfile || !form) return <SectionLoading />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast({ title: "Business name is required", variant: "destructive" });
    setBusy(true);
    try {
      await backend.entities.Business.update(business.id, {
        name: form.name.trim(),
        sector: form.sector,
        area: form.area.trim(),
        ward: form.ward.trim(),
        description: form.description.trim(),
        phone: form.phone.trim(),
      });
      toast({ title: "Profile saved", description: "Your business details have been updated." });
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="My profile" subtitle="Keep your business details current — they appear in the local directory and on tender responses." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={save} className="led-box lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Business name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="led-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Sector</label>
              <select value={form.sector} onChange={(e) => set("sector", e.target.value)} className="led-field">
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Area</label>
              <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Madadeni" className="led-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Ward</label>
              <input value={form.ward} onChange={(e) => set("ward", e.target.value)} placeholder="e.g. Ward 12" className="led-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="082 123 4567" className="led-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="What does your business do?" className="led-field" />
          </div>
          <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save profile
          </button>
        </form>

        <div className="led-box">
          <h3 className="text-sm font-bold text-ink mb-2">Verification status</h3>
          <p className="text-mute text-xs mb-3">Your business must be verified before you can respond to tenders or apply for funding.</p>
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            business.status === "verified" ? "bg-[#d9efe0] text-[#14532b]" : business.status === "rejected" ? "bg-[#f9dcd2] text-[#8a2c10]" : "bg-[#fbeccb] text-[#6b4d00]"
          }`}>
            {business.status}
          </span>
          {business.status === "verified" && business.verified_at && (
            <p className="text-mute text-xs mt-3">Verified on {new Date(business.verified_at).toLocaleDateString("en-ZA")}</p>
          )}
          {business.status === "pending" && (
            <p className="text-mute text-xs mt-3">An LED officer will review your registration. Upload your compliance documents to speed up verification.</p>
          )}
        </div>
      </div>
    </div>
  );
}