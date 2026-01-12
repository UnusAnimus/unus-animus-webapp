/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_AI_PROXY_URL?: string;
  readonly VITE_WP_SSO_URL?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
