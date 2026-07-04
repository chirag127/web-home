/*
 * CF Pages Function: POST /api/billing-create-subscription
 *
 * Contract expected by @chirag127/astro-billing <CheckoutButton />:
 *   body:    { planTier: 'pro_monthly'|'pro_yearly'|'max_monthly'|'max_yearly' }
 *   auth:    Bearer <firebase-id-token>
 *   returns: { subscription_id, key_id }
 *
 * Verifies the Firebase ID token via the public identity-toolkit REST
 * endpoint (no admin SDK needed). Then calls Razorpay Subscriptions API
 * server-side using RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET.
 *
 * Env (set via `wrangler pages secret put`):
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   RAZORPAY_PLAN_PRO_MONTHLY / PRO_YEARLY / MAX_MONTHLY / MAX_YEARLY
 *   PUBLIC_FIREBASE_API_KEY  (used to verify Firebase ID tokens)
 */

interface Env {
  RAZORPAY_KEY_ID: string
  RAZORPAY_KEY_SECRET: string
  RAZORPAY_PLAN_PRO_MONTHLY: string
  RAZORPAY_PLAN_PRO_YEARLY: string
  RAZORPAY_PLAN_MAX_MONTHLY: string
  RAZORPAY_PLAN_MAX_YEARLY: string
  PUBLIC_FIREBASE_API_KEY?: string
  FIREBASE_API_KEY?: string
}

async function verifyFirebaseToken(
  idToken: string,
  apiKey: string,
): Promise<{ uid: string; email?: string } | null> {
  if (!idToken || !apiKey) return null
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { users?: Array<{ localId: string; email?: string }> }
    const u = data.users?.[0]
    if (!u) return null
    return { uid: u.localId, email: u.email }
  } catch {
    return null
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const planMap: Record<string, string | undefined> = {
    pro_monthly: env.RAZORPAY_PLAN_PRO_MONTHLY,
    pro_yearly: env.RAZORPAY_PLAN_PRO_YEARLY,
    max_monthly: env.RAZORPAY_PLAN_MAX_MONTHLY,
    max_yearly: env.RAZORPAY_PLAN_MAX_YEARLY,
  }

  const apiKey = env.PUBLIC_FIREBASE_API_KEY ?? env.FIREBASE_API_KEY ?? ''
  const auth = request.headers.get('authorization') ?? ''
  const idToken = auth.replace(/^Bearer\s+/i, '')
  const user = await verifyFirebaseToken(idToken, apiKey)
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  let body: { planTier?: string }
  try {
    body = (await request.json()) as { planTier?: string }
  } catch {
    return new Response(JSON.stringify({ error: 'bad body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const planId = body.planTier ? planMap[body.planTier] : undefined
  if (!planId) {
    return new Response(JSON.stringify({ error: 'unknown plan' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const isYearly = body.planTier?.endsWith('_yearly')
  const total_count = isYearly ? 10 : 120

  const basic = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)
  const rzpRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: { authorization: `Basic ${basic}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      plan_id: planId,
      total_count,
      customer_notify: 1,
      notes: { uid: user.uid, email: user.email ?? '' },
    }),
  })

  if (!rzpRes.ok) {
    const text = await rzpRes.text()
    console.error('[billing-create-subscription] razorpay error', rzpRes.status, text)
    return new Response(JSON.stringify({ error: 'razorpay failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }

  const sub = (await rzpRes.json()) as { id: string }
  return new Response(JSON.stringify({ subscription_id: sub.id, key_id: env.RAZORPAY_KEY_ID }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
