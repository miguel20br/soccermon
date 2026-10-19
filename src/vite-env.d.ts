/// <reference types="vite/client" />

declare module 'zzfx' {
    export function zzfx(...parameters: number[]): AudioBufferSourceNode;
    export const ZZFX: { volume: number; sampleRate: number; audioContext: AudioContext };
}

declare const __APP_VERSION__: string;
declare const __APP_BUILD__: string;

interface ImportMetaEnv {
    /** Supabase (contas e save na nuvem): opcionais; sem elas o jogo é só local. */
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly NEXT_PUBLIC_SUPABASE_URL?: string;
    readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}
