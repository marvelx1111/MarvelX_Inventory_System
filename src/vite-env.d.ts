/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly NEXT_PUBLIC_SUPABASE_URL?: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly VITE_ALLOW_DEMO_AUTH?: string;
  readonly VITE_DEMO_PASSWORD_ADMIN?: string;
  readonly VITE_DEMO_PASSWORD_SALES?: string;
  readonly VITE_DEMO_PASSWORD_PPF?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
