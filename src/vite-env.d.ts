/// <reference types="vite/client" />

declare module 'zzfx' {
    export function zzfx(...parameters: number[]): AudioBufferSourceNode;
    export const ZZFX: { volume: number; sampleRate: number };
}

declare const __APP_VERSION__: string;
