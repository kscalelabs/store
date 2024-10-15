interface ImportMetaEnv {
  readonly VITE_APP_BACKEND_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
