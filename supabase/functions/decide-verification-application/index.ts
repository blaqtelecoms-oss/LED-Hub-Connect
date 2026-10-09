import { errorMessage, getCaller, handleOptions, jsonResponse } from '../_shared/backend.ts';

const validActions = ['in_review', 'incomplete', 'verified', 'declined'] as const;
const actionLabels: Record<string, string> = {
  in_review: 'review started',
  incomplete: 'marked incomplete',
  verified: 'verified',
  declined: 'declined',
};

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const caller = await getCaller(request);
    if ('error' in caller) return jsonResponse({ error: caller.error }, 401);
    const { admin, user } = caller;
    if (user.role !== 'admin') {
      return jsonResponse({ error: 'Only LED officers can decide applications' }, 403);
    }

    const body = await request.json();
    const applicationId = body?.applicationId;
    const action = body?.action;
    const note = typeof body?.note === 'string' ? body.note.trim() : '';
    if (!applicationId) return jsonResponse({ error: 'Application id required' }, 400);
    if (!validActions.includes(action)) return jsonResponse({ error: 'Invalid action' }, 400);
    if ((action === 'incomplete' || action === 'declined') && !note) {
      return jsonResponse({ error: 'A note is required for this decision' }, 400);
    }

    const { data: application, error: applicationError } = await admin
      .from('verification_application')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();
    if (applicationError) throw applicationError;
    if (!application) return jsonResponse({ error: 'Application not found' }, 404);
    if (application.status === 'verified' || application.status === 'declined') {
      return jsonResponse({ error: 'Application already decided' }, 400);
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { status: action };
    if (action === 'in_review') update.assigned_to = user.id;
    if (action === 'incomplete') {
      update.decision_reason = 'incomplete';
      update.decision_note = note;
    }
    if (action === 'verified' || action === 'declined') {
      update.decided_by = user.id;
      update.decided_at = now;
      update.decision_note = note;
      if (action === 'declined') update.decision_reason = 'declined';
    }

    const { data: updated, error: updateError } = await admin
      .from('verification_application')
      .update(update)
      .eq('id', applicationId)
      .select()
      .single();
    if (updateError) throw updateError;

    if (action === 'verified') {
      const { error: businessUpdateError } = await admin
        .from('business')
        .update({ status: 'verified', verified_by: user.id, verified_at: now })
        .eq('id', application.business);
      if (businessUpdateError) throw businessUpdateError;

      const { data: documents, error: documentsError } = await admin
        .from('business_document')
        .select('id,status')
        .eq('application', applicationId);
      if (documentsError) throw documentsError;
      for (const document of documents || []) {
        if (document.status !== 'approved') {
          const { error } = await admin.from('business_document').update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: now,
            reviewer_note: note || 'Approved on verification',
          }).eq('id', document.id);
          if (error) throw error;
        }
      }
    } else if (action === 'declined') {
      const { error: businessUpdateError } = await admin
        .from('business')
        .update({ status: 'declined', verified_by: null, verified_at: null })
        .eq('id', application.business);
      if (businessUpdateError) throw businessUpdateError;
    }

    const { data: business, error: businessError } = await admin
      .from('business')
      .select('owner')
      .eq('id', application.business)
      .maybeSingle();
    if (businessError) throw businessError;

    const { error: logError } = await admin.from('verification_log').insert({
      application: applicationId,
      actor: user.id,
      action,
      detail: `${actionLabels[action]} by ${user.full_name || user.email}${note ? ` — ${note}` : ''}`,
      created_by_id: user.id,
    });
    if (logError) throw logError;

    const recipient = business?.owner || application.created_by_id;
    if (recipient) {
      const messages: Record<string, { title: string; body: string }> = {
        in_review: {
          title: 'Application under review',
          body: 'Your verification application is now under review by an LED officer.',
        },
        incomplete: {
          title: 'More information needed',
          body: `Your application needs more detail: ${note}`,
        },
        verified: {
          title: 'Your business is verified',
          body: 'Congratulations! Your business is now verified and visible in the local directory.',
        },
        declined: {
          title: 'Application declined',
          body: `Your verification application was declined: ${note}`,
        },
      };
      const message = messages[action];
      const results = await Promise.all([
        admin.from('inbox_item').insert({
          recipient,
          kind: 'message',
          title: message.title,
          body: message.body,
          sender: 'Newcastle LED Office',
          created_by_id: user.id,
        }),
        admin.from('notification_log').insert({
          recipient,
          channel: 'app',
          template: `application_${action}`,
          body: message.title,
          status: 'queued (stub)',
          created_by_id: user.id,
        }),
      ]);
      const failedWrite = results.find((result) => result.error);
      if (failedWrite?.error) throw failedWrite.error;
    }

    return jsonResponse({ ok: true, application: updated });
  } catch (error) {
    console.error('decideVerificationApplication failed:', error);
    return jsonResponse({ error: errorMessage(error) }, 500);
  }
});
