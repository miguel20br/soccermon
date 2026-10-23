import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COACH_EVENTS, EVENT_NAMES, isBot, pickedReward, sendable } from './track';

describe('nomes dos eventos', () => {
    it('a lista do cliente é a da última migração do game_events_name_check (fora dela, o lote inteiro dá 400)', () => {
        const dir = 'supabase/migrations';
        const last = readdirSync(dir)
            .filter((f) => readFileSync(`${dir}/${f}`, 'utf8').includes('add constraint game_events_name_check'))
            .sort()
            .at(-1)!;
        const sql = readFileSync(`${dir}/${last}`, 'utf8');
        const list = sql.slice(sql.indexOf('name in ('));
        const names = [...list.slice(0, list.indexOf(')')).matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
        expect([...EVENT_NAMES].sort()).toEqual(names.sort());
    });

    it('nome desconhecido não entra; coach_* só com a migração no ar', () => {
        expect(sendable('screen')).toBe(true);
        expect(sendable('nao_existe')).toBe(false);
        expect(sendable('coach_shown')).toBe(COACH_EVENTS);
    });
});

const mon = (uid: string, moves: string[], item: string | null = null) => ({ uid, speciesId: uid, moves, item });

describe('pickedReward', () => {
    const rewards = [
        { kind: 'pokemon', inst: mon('pidgey', ['tackle']), from: null },
        { kind: 'tm', move: 'bubblebeam', leader: null },
        { kind: 'item', item: 'leftovers' },
    ];
    // biome-ignore lint/suspicious/noExplicitAny: só os campos que a função lê
    const run = (picks: unknown[]) => ({ picks, rewards }) as any;
    const before = run([mon('a', ['tackle', 'growl']), mon('b', ['ember'])]);

    it('acha Pokémon, MT e item; pular dá null', () => {
        expect(pickedReward(before, run([...before.picks, mon('pidgey', ['tackle'])]))?.kind).toBe('pokemon');
        expect(pickedReward(before, run([mon('a', ['bubblebeam', 'growl']), before.picks[1]]))?.kind).toBe('tm');
        expect(pickedReward(before, run([before.picks[0], mon('b', ['ember'], 'leftovers')]))?.kind).toBe('item');
        expect(pickedReward(before, before)).toBeNull();
    });
});

describe('isBot', () => {
    const ua = {
        chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        cubot: 'Mozilla/5.0 (Linux; Android 10; CUBOT KingKong 5 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
        googlebot:
            'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        headless:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0 Safari/537.36',
    };

    it('navegador automatizado (Playwright, Puppeteer: os testes no ar contavam como desktop novo) e rastreador não contam', () => {
        expect(isBot({ webdriver: true, userAgent: ua.chrome })).toBe(true);
        expect(isBot({ webdriver: false, userAgent: ua.googlebot })).toBe(true);
        expect(isBot({ webdriver: false, userAgent: ua.headless })).toBe(true);
    });

    it('gente conta, inclusive celular com "bot" no nome', () => {
        expect(isBot({ webdriver: false, userAgent: ua.chrome })).toBe(false);
        expect(isBot({ webdriver: false, userAgent: ua.cubot })).toBe(false);
    });

    it('Chrome e Safari de celular de verdade (e os navegadores dentro do TikTok, Instagram e app do Google) contam', () => {
        const real = [
            // Chrome Android (UA reduzido, o de hoje) e com modelo (Samsung, Motorola)
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 14; SM-A155M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.7258.143 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 13; moto g54 5G Build/T1TDS33.16-34-1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
            // Samsung Internet e Firefox Android
            'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Android 14; Mobile; rv:142.0) Gecko/142.0 Firefox/142.0',
            // Safari e Chrome no iPhone, iPad
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.122 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
            // dentro do TikTok (Android e iPhone), do Instagram e do app do Google
            'Mozilla/5.0 (Linux; Android 12; SM-A125M Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 trill_330604 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/trill app_version/33.6.4 ByteLocale/pt-BR Region/BR BytedanceWebview/d8a21c6',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_35.1.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/pt Region/BR WKWebView/1 BytedanceWebview/d8a21c6',
            'Mozilla/5.0 (Linux; Android 14; 23129RAA4G Build/UKQ1.231003.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.107 Mobile Safari/537.36 Instagram 356.0.0.41.101 Android (34/14; 440dpi; 1080x2400; Xiaomi; 23129RAA4G; topaz; qcom; pt_BR; 664108843)',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/350.0.698229112 Mobile/15E148 Safari/604.1',
            // app de busca da Yandex (gente) x robô da Yandex
            'Mozilla/5.0 (Linux; Android 13; SM-A536E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.4.3.97.00 SA/3 Mobile Safari/537.36 YandexSearch/24.41',
        ];
        for (const userAgent of real) expect(isBot({ webdriver: false, userAgent }), userAgent).toBe(false);
        expect(isBot({ userAgent: 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)' })).toBe(true);
    });
});
