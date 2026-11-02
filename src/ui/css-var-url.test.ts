import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// url() relativa dentro de variável CSS resolve a partir do .css que usa o var() (/bundle/), não da página: 404 no ar
const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
    );

describe('url() em variável CSS', () => {
    it('começa com / (absoluta)', () => {
        const bad = files('src').flatMap((f) =>
            [...readFileSync(f, 'utf8').matchAll(/'--[\w-]+':\s*`url\((?!\/|data:|\$)[^`]*/g)].map(
                (m) => `${f}: ${m[0]}`,
            ),
        );
        expect(bad).toEqual([]);
    });
});
