import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { backend } from "@/api/backendClient";
import { useAuth } from "@/lib/AuthContext";
import { useLedProfile } from "@/hooks/useLedProfile";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import StepBusiness from "@/components/onboarding/StepBusiness";
import StepOwner from "@/components/onboarding/StepOwner";
import StepPremises from "@/components/onboarding/StepPremises";
import StepSize from "@/components/onboarding/StepSize";
import StepDocuments from "@/components/onboarding/StepDocuments";
import { STEPS, primarySector } from "@/lib/onboardingUtils";
import { SectionLoading } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, ArrowRight, Save, Loader2, Send } from "lucide-react";

const STEP_COMPONENTS = [StepBusiness, StepOwner, StepPremises, StepSize, StepDocuments];

export default function OnboardingWizard() {
  const { user } = useAuth();
  const { business, loading: loadingBiz } = useLedProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [application, setApplication] = useState(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const accountType = user?.account_type || (user?.role === "admin" ? "officer" : null);

  useEffect(() => {
    if (loadingBiz || !business) return;
    let cancelled = false;
    (async () => {
      const apps = await backend.entities.VerificationApplication.filter({ business: business.id }).catch(() => []);
      if (cancelled) return;
      let app = apps[0];
      if (!app) {
        app = await backend.entities.VerificationApplication.create({ business: business.id, status: "draft", draft_step: 1 });
      }
      if (cancelled) return;
      setApplication(app);
      setForm({
        name: business.name || "",
        trading_name: business.trading_name || "",
        registration_type: business.registration_type || "",
        cipc_number: business.cipc_number || "",
        year_started: business.year_started || null,
        sectors: business.sectors || [],
        description: business.description || "",
        area: business.area || "",
        ward: business.ward || "",
        owner_name: business.owner_name || "",
        owner_phone: business.owner_phone || "",
        owner_email: business.owner_email || "",
        number_of_owners: business.number_of_owners ?? 1,
        ownership_profile: business.ownership_profile || [],
        premises_type: business.premises_type || "",
        address: business.address || "",
        latitude: business.latitude ?? null,
        longitude: business.longitude ?? null,
        trading_days: business.trading_days || [],
        staff_band: business.staff_band || "",
        turnover_band: business.turnover_band || "",
        has_bank_account: business.has_bank_account ?? null,
        vat_status: business.vat_status || "",
        csd_status: business.csd_status || "",
        support_needed: business.support_needed || [],
        phone: business.phone || "",
        owner_id_number: app.owner_id_number || "",
        consent: !!app.consent_at,
        declaration: !!app.declaration_at,
        signature_name: app.signature_name || "",
      });
      setStep(app.draft_step || 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadingBiz, business]);

  if (accountType && accountType !== "business") return <Navigate to={`/${accountType}`} replace />;
  if (loadingBiz || !form) {
    return (
      <div className="min-h-screen grid place-items-center bg-page">
        <SectionLoading />
      </div>
    );
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = (s) => {
    if (s === 1) {
      if (!(form.name || "").trim()) return "Business name is required.";
      if (!(form.area || "").trim()) return "Area is required.";
      if (!form.sectors || form.sectors.length === 0) return "Select at least one sector.";
    }
    if (s === 2) {
      if (!(form.owner_name || "").trim()) return "Owner full name is required.";
      if (!(form.owner_id_number || "").trim()) return "Owner ID number is required.";
    }
    if (s === 3) {
      if (!form.premises_type) return "Premises type is required.";
    }
    if (s === 4) {
      if (!form.staff_band) return "Staff count is required.";
      if (!form.turnover_band) return "Yearly turnover is required.";
      if (form.has_bank_account == null) return "Bank account answer is required.";
    }
    return null;
  };

  const persist = async (nextStep) => {
    const bizUpdate = {
      name: form.name,
      trading_name: form.trading_name,
      registration_type: form.registration_type,
      cipc_number: form.cipc_number,
      year_started: form.year_started,
      sectors: form.sectors,
      description: form.description,
      area: form.area,
      ward: form.ward,
      owner_name: form.owner_name,
      owner_phone: form.owner_phone,
      owner_email: form.owner_email,
      number_of_owners: form.number_of_owners,
      ownership_profile: form.ownership_profile,
      premises_type: form.premises_type,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      trading_days: form.trading_days,
      staff_band: form.staff_band,
      turnover_band: form.turnover_band,
      has_bank_account: form.has_bank_account,
      vat_status: form.vat_status,
      csd_status: form.csd_status,
      support_needed: form.support_needed,
      sector: primarySector(form.sectors),
    };
    await backend.entities.Business.update(business.id, bizUpdate);
    const appUpdate = {
      draft_step: nextStep,
      owner_id_number: form.owner_id_number,
      consent_at: form.consent ? application.consent_at || new Date().toISOString() : null,
      declaration_at: form.declaration ? application.declaration_at || new Date().toISOString() : null,
      signature_name: form.signature_name,
    };
    const updated = await backend.entities.VerificationApplication.update(application.id, appUpdate);
    setApplication(updated);
  };

  const saveAndContinue = async () => {
    setError("");
    const v = validateStep(step);
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    try {
      await persist(step + 1);
      setStep((s) => Math.min(s + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAndExit = async () => {
    setSaving(true);
    try {
      await persist(step);
      toast({ title: "Progress saved" });
      navigate("/business");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await backend.functions.invoke("submitVerificationApplication", {
        applicationId: application.id,
        owner_id_number: form.owner_id_number,
        consent: form.consent,
        declaration: form.declaration,
        signature_name: form.signature_name,
      });
      if (res.data?.error) {
        setError(res.data.error);
        return;
      }
      toast({ title: "Application submitted", description: `Reference ${res.data?.reference || ""}` });
      window.location.href = "/business";
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const StepComp = STEP_COMPONENTS[step - 1];
  const stepLabel = STEPS[step - 1].label;

  return (
    <OnboardingShell
      steps={STEPS}
      current={step}
      title={stepLabel}
      subtitle="Complete your profile so LED officers can verify your business. Your progress is saved automatically."
      onExit={() => navigate("/business")}
      nav={
        <>
          <button onClick={goBack} disabled={step === 1} className="obtn obtn-o disabled:opacity-50">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={saveAndExit} disabled={saving} className="obtn-sv">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save and continue later
            </button>
            {step < STEPS.length ? (
              <button onClick={saveAndContinue} disabled={saving} className="obtn">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Continue
              </button>
            ) : (
              <button onClick={submit} disabled={submitting} className="obtn">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit for verification
              </button>
            )}
          </div>
        </>
      }
    >
      {error ? <div className="onb-err">{error}</div> : null}
      <StepComp
        form={form}
        setField={setField}
        businessId={business.id}
        applicationId={application.id}
        onSubmit={submit}
        submitting={submitting}
      />
    </OnboardingShell>
  );
}