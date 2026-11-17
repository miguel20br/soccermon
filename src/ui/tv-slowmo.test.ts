import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../game/EventBus';

// a saída no tema (o `neonOn` dos testes é sempre false) e um DOM de mentira: o bastante pro slowmoExit começar
vi.mock('./tema', () => ({ neonOn: true }));
const calm = vi.hoisted(() => ({ on: false }));
vi.mock('./reduce-motion', () => ({ reduceMotionOn: () => calm.on }));

const anim = () => ({ cancel() {}, onfinish: null, oncancel: null });
const el = () => ({ style: {}, setAttribute() {}, animate: anim, remove() {} });
vi.stubGlobal('document', {
    visibilityState: 'visible',
    createElement: el,
    body: { animate: anim, append() {}, children: [] },
});
// o relógio de segurança troca na hora: a saída acaba e a próxima pode começar
vi.stubGlobal('window', {
    setTimeout: (f: () => void) => {
        f();
        return 0;
    },
});
vi.stubGlobal('HTMLElement', class {});

describe('saída da partida no tema', () => {
    it('avisa a quadra pra frear (câmera lenta de verdade); com Reduzir movimento, não', async () => {
        const got: number[] = [];
        const on = (ms: number) => got.push(ms);
        EventBus.on('match:slowmo', on);
        const { SLOWMO_MS, slowmoExit } = await import('./tv');
        let swapped = 0;
        slowmoExit(() => swapped++);
        expect(got).toEqual([SLOWMO_MS]);
        calm.on = true;
        slowmoExit(() => swapped++);
        expect(got).toEqual([SLOWMO_MS]);
        expect(swapped).toBe(2);
        EventBus.off('match:slowmo', on);
    });
    it('uma troca que falha (a tela do Duelo já saiu) não prende a próxima saída', async () => {
        const { slowmoExit } = await import('./tv');
        expect(() =>
            slowmoExit(() => {
                throw new Error('tela já saiu');
            }),
        ).toThrow();
        let n = 0;
        slowmoExit(() => n++);
        expect(n).toBe(1);
    });
    it('vale na copa, na Liga e no Duelo; no Duelo só na troca local, depois do fim já ir pra sala', () => {
        const match = readFileSync('src/ui/screens/Match.tsx', 'utf8');
        expect(match).toContain("slowmoExit(() => go(liga ? 'liga' : 'result'))");
        const duel = readFileSync('src/ui/duel/DuelMatch.tsx', 'utf8');
        expect(duel).toContain('onGo={() => slowmoExit(onSeeResult)}');
        // o `match:ended` (que avisa a sala) continua direto, sem esperar a câmera lenta
        const onEnded = duel.slice(duel.indexOf('const onEnded = () => {'), duel.indexOf('const onHalftime'));
        expect(onEnded).toContain('duel.ended(duel.result)');
        expect(onEnded).not.toContain('slowmo');
    });
});
