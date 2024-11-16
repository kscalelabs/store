interface ImportMetaEnv {
  readonly VITE_APP_BACKEND_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_ROBOT_REGISTRATION_ENABLED?: string;
  readonly VITE_ROBOT_STREAMING_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
