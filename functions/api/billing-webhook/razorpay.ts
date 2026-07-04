/*
 * CF Pages Function: POST /api/billing-webhook/razorpay
 *
 * Receives Razorpay webhook POSTs, verifies HMAC-SHA256 signature, and
 * writes subscription state to Firestore via REST API (Workers-friendly,
 * no firebase-admin needed).
 *
 * Env:
 *   RAZORPAY_WEBHOOK_SECRET
 *   FIREBASE_SERVICE_ACCOUNT_JSON  (full JSON string)
 *   RAZORPAY_PLAN_PRO_MONTHLY / PRO_YEARLY / MAX_MONTHLY / MAX_YEARLY
 *
 * Idempotency: writes processed_events/{eventId} doc before updating users/.
 *
 * Events handled per runbook section 6.
 */

interface Env {
  RAZORPAY_WEBHOOK_SECRET: string
  FIREBASE_SERVICE_ACCOUNT_JSON: string
  RAZORPAY_PLAN_PRO_MONTHLY: string
  RAZORPAY_PLAN_PRO_YEARLY: string
  RAZORPAY_PLAN_MAX_MONTHLY: string
  RAZORPAY_PLAN_MAX_YEARLY: string
}

/* ─── HMAC verify (WebCrypto, edge-friendly) ────────────────────────── */

function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmacHex(key: string, body: string): Promise<string> {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(body))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

/* ─── Google OAuth2 JWT for Firestore REST ──────────────────────────── */

interface SA {
  client_email: string
  private_key: string
  project_id: string
}

let _tokenCache: { token: string; expiresAt: number } | null = null

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const stripped = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(stripped)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

async function getAccessToken(sa: SA): Promise<string> {
  if (_tokenCache && _tokenCache.expiresAt > Date.now() + 30_000) return _tokenCache.token

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const enc = new TextEncoder()
  const headerB64 = b64urlEncode(enc.encode(JSON.stringify(header)))
  const claimB64 = b64urlEncode(enc.encode(JSON.stringify(claim)))
  const signingInput = `${headerB64}.${claimB64}`

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput))
  const jwt = `${signingInput}.${b64urlEncode(new Uint8Array(sig))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`token exchange failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  _tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

/* ─── Firestore REST helpers ────────────────────────────────────────── */

// Firestore REST type-tagged values.
type FsValue = {
  stringValue?: string
  integerValue?: string
  booleanValue?: boolean
  nullValue?: null
  timestampValue?: string
}

function toFsValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'string') return { stringValue: v }
  if (typeof v === 'number') return { integerValue: String(Math.trunc(v)) }
  if (typeof v === 'boolean') return { booleanValue: v }
  return { stringValue: String(v) }
}

function toFsFields(obj: Record<string, unknown>): Record<string, FsValue> {
  const out: Record<string, FsValue> = {}
  for (const [k, v] of Object.entries(obj)) out[k] = toFsValue(v)
  return out
}

async function fsPatch(
  projectId: string,
  token: string,
  path: string,
  fields: Record<string, unknown>,
): Promise<Response> {
  const updateMask = Object.keys(fields)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&')
  const _url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?${updateMask}&currentDocument.exists=false`
  // First try create-only; if doc exists, fall through to merge update.
  // To keep this simple, just do a PATCH without currentDocument constraint (upsert merge).
  const url2 = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?${updateMask}`
  const res = await fetch(url2, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ fields: toFsFields(fields) }),
  })
  return res
}

async function fsGet(projectId: string, token: string, path: string): Promise<Response> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`
  return fetch(url, { headers: { authorization: `Bearer ${token}` } })
}

/* ─── Plan id → tier mapping ────────────────────────────────────────── */

function planIdToTier(
  env: Env,
  planId?: string,
): { tier: 'pro' | 'max'; interval: 'monthly' | 'yearly' } | null {
  if (!planId) return null
  if (planId === env.RAZORPAY_PLAN_PRO_MONTHLY) return { tier: 'pro', interval: 'monthly' }
  if (planId === env.RAZORPAY_PLAN_PRO_YEARLY) return { tier: 'pro', interval: 'yearly' }
  if (planId === env.RAZORPAY_PLAN_MAX_MONTHLY) return { tier: 'max', interval: 'monthly' }
  if (planId === env.RAZORPAY_PLAN_MAX_YEARLY) return { tier: 'max', interval: 'yearly' }
  return null
}

interface RzpEvent {
  event: string
  id?: string
  created_at?: number
  payload: {
    subscription?: {
      entity: {
        id?: string
        plan_id?: string
        current_end?: number
        notes?: Record<string, string>
      }
    }
    payment?: { entity: { notes?: Record<string, string> } }
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rawBody = await request.text()
  const sig = request.headers.get('x-razorpay-signature') ?? ''
  const secret = env.RAZORPAY_WEBHOOK_SECRET ?? ''

  if (!secret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not configured')
    return new Response('server misconfigured', { status: 500 })
  }

  const expected = await hmacHex(secret, rawBody)
  if (!sig || !timingSafeEq(sig, expected)) {
    console.warn('[webhook] invalid signature')
    return new Response('invalid signature', { status: 401 })
  }

  let event: RzpEvent
  try {
    event = JSON.parse(rawBody) as RzpEvent
  } catch {
    return new Response('bad json', { status: 400 })
  }

  let sa: SA
  try {
    sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as SA
  } catch (e) {
    console.error('[webhook] FIREBASE_SERVICE_ACCOUNT_JSON parse error', e)
    return new Response('server misconfigured', { status: 500 })
  }

  let token: string
  try {
    token = await getAccessToken(sa)
  } catch (e) {
    console.error('[webhook] token error', e)
    return new Response('server error', { status: 500 })
  }

  const eventId =
    event.id ??
    [event.event, event.payload?.subscription?.entity?.id, event.created_at]
      .filter(Boolean)
      .join(':')

  // Idempotency check
  const evPath = `processed_events/${encodeURIComponent(eventId)}`
  const evRes = await fsGet(sa.project_id, token, evPath)
  if (evRes.ok) {
    return new Response('OK (duplicate)', { status: 200 })
  }

  const sub = event.payload?.subscription?.entity
  const payment = event.payload?.payment?.entity
  const uid: string | undefined = sub?.notes?.uid ?? payment?.notes?.uid

  if (!uid) {
    await fsPatch(sa.project_id, token, evPath, {
      event: event.event,
      at: Date.now(),
      note: 'no-uid',
    })
    return new Response('OK (no uid)', { status: 200 })
  }

  const tierInfo = planIdToTier(env, sub?.plan_id)

  let status: string | null = null
  switch (event.event) {
    case 'subscription.activated':
    case 'subscription.charged':
    case 'subscription.updated':
      status = 'active'
      break
    case 'subscription.cancelled':
      status = 'cancelled'
      break
    case 'subscription.halted':
    case 'payment.failed':
      status = 'grace_period'
      break
    case 'subscription.expired':
    case 'subscription.completed':
      status = 'expired'
      break
    case 'subscription.pending':
      status = 'pending'
      break
    default:
      status = null
  }

  if (status) {
    const subPath = `users/${encodeURIComponent(uid)}/subscriptions/razorpay`
    await fsPatch(sa.project_id, token, subPath, {
      subscription_id: sub?.id ?? null,
      plan_id: sub?.plan_id ?? null,
      tier: tierInfo?.tier ?? null,
      interval: tierInfo?.interval ?? null,
      current_period_end: sub?.current_end ?? null,
      status,
      updated_at: Date.now(),
    })

    // Also write the convenience users/{uid}.tier (for read-side rules).
    if (tierInfo?.tier && status === 'active') {
      await fsPatch(sa.project_id, token, `users/${encodeURIComponent(uid)}`, {
        tier: tierInfo.tier,
        updated_at: Date.now(),
      })
    }
  }

  await fsPatch(sa.project_id, token, evPath, { event: event.event, uid, at: Date.now() })

  return new Response('OK', { status: 200 })
}
