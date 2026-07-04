/*
 * CF Pages Function: POST /api/create-subscription
 *
 * Creates a Razorpay subscription server-side and returns subscription_id
 * for the browser to open the Razorpay Checkout modal.
 *
 * Env (set via `wrangler pages secret put`):
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 *   RAZORPAY_PLAN_PRO_MONTHLY / PRO_YEARLY / MAX_MONTHLY / MAX_YEARLY
 *
 * Body:  { plan_id?: string, plan_tier?: 'pro_monthly'|'pro_yearly'|'max_monthly'|'max_yearly' }
 *
 * CORS: only allow https://oriz.in (the canonical pricing surface).
 *
 * See knowledge/runbooks/razorpay-end-to-end-setup.md
 */

interface Env {
  RAZORPAY_KEY_ID: string
  RAZORPAY_KEY_SECRET: string
  RAZORPAY_PLAN_PRO_MONTHLY: string
  RAZORPAY_PLAN_PRO_YEARLY: string
  RAZORPAY_PLAN_MAX_MONTHLY: string
  RAZORPAY_PLAN_MAX_YEARLY: string
  PUBLIC_RAZORPAY_KEY_ID?: string
}

const ALLOWED_ORIGIN = 'https://oriz.in'

function cors(origin: string | null): Record<string, string> {
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    vary: 'origin',
  }
}

function json(body: unknown, init: ResponseInit = {}, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...cors(origin),
      ...(init.headers ?? {}),
    },
  })
}

export const onRequestOptions: PagesFunction<Env> = ({ request }) => {
  return new Response(null, { status: 204, headers: cors(request.headers.get('origin')) })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin')

  const planMap: Record<string, string | undefined> = {
    pro_monthly: env.RAZORPAY_PLAN_PRO_MONTHLY,
    pro_yearly: env.RAZORPAY_PLAN_PRO_YEARLY,
    max_monthly: env.RAZORPAY_PLAN_MAX_MONTHLY,
    max_yearly: env.RAZORPAY_PLAN_MAX_YEARLY,
  }
  const validPlanIds = new Set(Object.values(planMap).filter(Boolean) as string[])

  let body: { plan_id?: string; plan_tier?: string } = {}
  try {
    body = (await request.json()) as { plan_id?: string; plan_tier?: string }
  } catch {
    return json({ error: 'bad body' }, { status: 400 }, origin)
  }

  const planId = body.plan_id ?? (body.plan_tier ? planMap[body.plan_tier] : undefined)
  if (!planId || !validPlanIds.has(planId)) {
    return json({ error: 'unknown plan' }, { status: 400 }, origin)
  }

  const isYearly =
    planId === env.RAZORPAY_PLAN_PRO_YEARLY || planId === env.RAZORPAY_PLAN_MAX_YEARLY
  const total_count = isYearly ? 10 : 120 // 10 years yearly / 10 years monthly

  const basic = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)
  const rzpRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      authorization: `Basic ${basic}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ plan_id: planId, total_count, customer_notify: 1 }),
  })

  if (!rzpRes.ok) {
    const text = await rzpRes.text()
    console.error('[create-subscription] razorpay error', rzpRes.status, text)
    return json({ error: 'razorpay failed', status: rzpRes.status }, { status: 502 }, origin)
  }

  const sub = (await rzpRes.json()) as { id: string; plan_id: string; status: string }
  return json(
    {
      subscription_id: sub.id,
      plan_id: sub.plan_id,
      status: sub.status,
      key_id: env.PUBLIC_RAZORPAY_KEY_ID ?? env.RAZORPAY_KEY_ID,
    },
    { status: 200 },
    origin,
  )
}
