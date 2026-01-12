/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_AI_PROXY_URL?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
