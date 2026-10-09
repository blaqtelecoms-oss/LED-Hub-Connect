import { errorMessage, getCaller, handleOptions, jsonResponse } from '../_shared/backend.ts';

type DocumentRule = {
  conditions?: Record<string, string | string[]>;
  requirement_level: string;
  document_type: string;
};

function ruleApplies(rule: DocumentRule, business: Record<string, unknown>) {
  const conditions = rule.conditions ?? {};
  return Object.entries(conditions).every(([key, values]) => {
    const allowed: unknown[] = Array.isArray(values) ? values : [values];
    const value = business[key];
    return Array.isArray(value)
      ? value.some((item) => allowed.includes(item))
      : allowed.includes(value);
  });
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const caller = await getCaller(request);
    if ('error' in caller) return jsonResponse({ error: caller.error }, 401);
    const { admin, user } = caller;
    const body = await request.json();
    const applicationId = body?.applicationId;
    const ownerIdNumber = body?.owner_id_number;
    const signatureName = typeof body?.signature_name === 'string' ? body.signature_name.trim() : '';

    if (!applicationId) return jsonResponse({ error: 'Application id required' }, 400);
    if (!body?.consent || !body?.declaration || !signatureName) {
      return jsonResponse({ error: 'Consent, declaration and signature are required' }, 400);
    }
    if (typeof ownerIdNumber !== 'string' || !ownerIdNumber.trim()) {
      return jsonResponse({ error: 'Owner ID number is required' }, 400);
    }

    const { data: application, error: applicationError } = await admin
      .from('verification_application')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();
    if (applicationError) throw applicationError;
    if (!application) return jsonResponse({ error: 'Application not found' }, 404);
    if (application.created_by_id !== user.id && user.role !== 'admin') {
      return jsonResponse({ error: 'Not your application' }, 403);
    }
    if (application.status && application.status !== 'draft') {
      return jsonResponse({ error: 'Application already submitted' }, 400);
    }

    const { data: business, error: businessError } = await admin
      .from('business')
      .select('*')
      .eq('id', application.business)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business) return jsonResponse({ error: 'Business not found' }, 404);

    const { data: rules, error: rulesError } = await admin
      .from('document_rule')
      .select('*')
      .eq('active', true);
    if (rulesError) throw rulesError;
    const required = ((rules || []) as DocumentRule[]).filter(
      (rule) => rule.requirement_level === 'required' && ruleApplies(rule, business),
    );

    const { data: documents, error: documentsError } = await admin
      .from('business_document')
      .select('*')
      .eq('application', applicationId);
    if (documentsError) throw documentsError;
    const latestByType = new Map<string, Record<string, any>>();
    for (const document of documents || []) {
      const current = latestByType.get(document.document_type);
      if (!current || (document.version || 1) > (current.version || 0)) {
        latestByType.set(document.document_type, document);
      }
    }
    const missing = required.filter((rule) => !latestByType.has(rule.document_type));
    if (missing.length) {
      return jsonResponse({ error: 'Required documents missing', missing: missing.map((rule) => rule.document_type) }, 400);
    }

    const { data: reference, error: referenceError } = await admin.rpc('next_verification_reference');
    if (referenceError) throw referenceError;

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from('verification_application')
      .update({
        status: 'submitted',
        reference,
        submitted_at: now,
        owner_id_number: ownerIdNumber.trim(),
        consent_at: application.consent_at || now,
        declaration_at: application.declaration_at || now,
        signature_name: signatureName,
      })
      .eq('id', applicationId)
      .eq('status', 'draft')
      .select()
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return jsonResponse({ error: 'Application was already submitted' }, 409);

    const { error: businessUpdateError } = await admin
      .from('business')
      .update({ status: 'pending' })
      .eq('id', application.business);
    if (businessUpdateError) throw businessUpdateError;

    const writes = [
      admin.from('verification_log').insert({
        application: applicationId,
        actor: user.id,
        action: 'submitted',
        detail: `Application ${reference} submitted by ${user.full_name || user.email}`,
        created_by_id: user.id,
      }),
      admin.from('inbox_item').insert({
        recipient: user.id,
        kind: 'message',
        title: 'Verification application submitted',
        body: `Your application ${reference} has been submitted. An LED officer will review it. We will notify you when the status changes.`,
        sender: 'Newcastle LED Office',
        created_by_id: user.id,
      }),
      admin.from('notification_log').insert({
        recipient: user.id,
        channel: 'app',
        template: 'application_submitted',
        body: `Verification application ${reference} submitted.`,
        status: 'queued (stub)',
        created_by_id: user.id,
      }),
    ];
    const results = await Promise.all(writes);
    const failedWrite = results.find((result) => result.error);
    if (failedWrite?.error) throw failedWrite.error;

    return jsonResponse({ ok: true, reference, application: updated });
  } catch (error) {
    console.error('submitVerificationApplication failed:', error);
    return jsonResponse({ error: errorMessage(error) }, 500);
  }
});
