import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../vite/config.dev.mjs';

const [ignored] = (config.server as { watch: { ignored: ((p: string) => boolean)[] } }).watch.ignored;
const root = resolve(__dirname, '..');

describe('dev server: o que recarrega a página', () => {
    it('arquivo de outro agente em .claude/worktrees não recarrega', () => {
        expect(ignored(`${root}/.claude/worktrees/outro/src/main.ts`)).toBe(true);
        expect(ignored(`${root}/.claude`)).toBe(true);
    });

    it('src/ recarrega, inclusive rodando o dev num worktree (o caminho passa por .claude/worktrees)', () => {
        expect(ignored(`${root}/src/ui/screens/Home.tsx`)).toBe(false);
        expect(ignored(`${root}/.claude-notas.md`)).toBe(false);
    });
});
