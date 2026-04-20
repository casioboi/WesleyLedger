/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_HASH_ROUTING?: string
  readonly VITE_DISABLE_SW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
