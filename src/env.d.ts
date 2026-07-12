/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_CF_BEACON_TOKEN?: string
  readonly PUBLIC_BUTTONDOWN_USERNAME?: string
  readonly PUBLIC_GA4_ID?: string
  readonly PUBLIC_ADSENSE_CLIENT?: string
  readonly PUBLIC_WEB3FORMS_KEY?: string
  /** Set by GitHub Actions matrix-deploy at build time. ISO-8601 UTC. */
  readonly PUBLIC_DEPLOY_TIME?: string
  /** Set by GitHub Actions matrix-deploy at build time. Short SHA. */
  readonly PUBLIC_GIT_SHA?: string
  /** Per-layer analytics kill-switches per the 5-tier stack. */
  readonly PUBLIC_ENABLE_CF_ANALYTICS?: string
  readonly PUBLIC_ENABLE_GA4?: string
  readonly PUBLIC_ENABLE_POSTHOG?: string
  readonly PUBLIC_ENABLE_CLARITY?: string
  readonly BETTER_STACK_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
