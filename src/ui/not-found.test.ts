import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Página 404 (public/404.html): a Vercel serve ela, com status 404, pra todo caminho que não existe. Um rewrite
 * "tudo pro index.html" no vercel.json esconderia a 404 (e trocaria o 404 por 200 pros buscadores).
 */
const page = readFileSync('public/404.html', 'utf8');
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));

describe('página 404', () => {
    it('vercel.json não manda caminho desconhecido pro jogo e mantém os atalhos', () => {
        expect(vercel.rewrites ?? []).toEqual([]);
        const sources = vercel.redirects.map((r: { source: string }) => r.source);
        expect(sources).toEqual(expect.arrayContaining(['/tt', '/yt', '/ig', '/privacidade', '/privacy']));
    });

    it('é leve e funciona em qualquer profundidade: só caminhos absolutos que existem em public/', () => {
        expect(page).not.toMatch(/<script[^>]+src=/);
        expect(page).not.toMatch(/<link[^>]+stylesheet/);
        const urls = [...page.matchAll(/(?:src|href)="([^"]+)"|url\("([^"]+)"\)/g)].map((m) => m[1] ?? m[2]);
        expect(urls.length).toBeGreaterThan(4);
        for (const u of urls) {
            expect(u.startsWith('/'), u).toBe(true);
            if (u !== '/') expect(existsSync(`public${u}`), u).toBe(true);
        }
    });

    it('tem o texto em PT e EN, o botão de volta pro jogo e não tem emoji', () => {
        expect(page).toContain('Fora de jogo!');
        expect(page).toContain('data-en="Offside!"');
        expect(page).toMatch(/<a class="btn" href="\/"/);
        expect(page).toContain('prefers-reduced-motion');
        expect(page).not.toMatch(/\p{Extended_Pictographic}/u);
    });
});
