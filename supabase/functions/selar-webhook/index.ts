import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const WEBHOOK_SECRET = Deno.env.get('SELAR_WEBHOOK_SECRET');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in the environment.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) {
    return false;
  }
  return signature === WEBHOOK_SECRET;
}

function getDurationDays(productId: string | null): number {
  if (!productId) {
    return 30;
  }

  const normalized = productId.toLowerCase();
  if (normalized.includes('annual') || normalized.includes('yearly')) {
    return 365;
  }

  return 30;
}

function getEmail(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const maybeEmail = record.customer_email ?? record.email ?? record.customerEmail;
  return typeof maybeEmail === 'string' ? maybeEmail.trim().toLowerCase() : null;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('x-selar-signature');
  const bodyText = await req.text();

  if (!verifySignature(bodyText, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  const email = getEmail(payload);
  if (!email) {
    return new Response('Missing customer email', { status: 400 });
  }

  const record = payload as Record<string, unknown>;
  const productId = String(record.product_id ?? record.plan ?? record.product ?? 'monthly');
  const paymentStatus = String(record.payment_status ?? record.status ?? '').toLowerCase();

  if (paymentStatus && paymentStatus !== 'paid' && paymentStatus !== 'successful' && paymentStatus !== 'completed') {
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);
  if (userError || !user) {
    return new Response('User not found', { status: 404 });
  }

  const durationDays = getDurationDays(productId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ subscription_expires_at: expiresAt.toISOString() })
    .eq('user_id', user.id);

  if (updateError) {
    return new Response(`Failed to update subscription: ${updateError.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, expires_at: expiresAt.toISOString() }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
