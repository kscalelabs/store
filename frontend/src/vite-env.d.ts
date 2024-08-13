interface ImportMetaEnv {
  readonly VITE_APP_BACKEND_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
