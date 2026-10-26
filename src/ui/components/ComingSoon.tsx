import { type ReactNode, useEffect, useState } from 'react';
import { useT } from '../../i18n/react';
import { ligaCountdown } from '../../league/rules';
import { LONG_CUP_LIVE } from '../../store/long-cup';
import { Sheet } from '../kit/Sheet';
import { HudIcon } from './MatchHud';
import { MenuIcon } from './MenuIcon';

interface Soon {
    id: string;
    title: string;
    text: string;
    note?: string;
    art: ReactNode;
    /** Linha curta embaixo do nome no cartãozinho (a contagem da Liga). */
    tag?: string;
}

const img = (src: string) => <img className="pixel" src={src} alt="" draggable={false} />;
/** Arte de cada "Em breve" de home.soon, na mesma ordem. */
const SOON_ART = [
    'assets/trainers/red.png',
    'assets/ui/simbolo.svg',
    'assets/cards/143.gif',
    'assets/ui/poke-ball.png',
];

/**
 * Faixa "Vem aí" da Home: o que ainda não dá pra jogar (Rota Índigo enquanto `LONG_CUP_LIVE` for false, a Liga até
 * `LIGA_OPENS_AT`, e os quatro de home.soon) numa fileira de cartõezinhos com silhueta e cadeado. Tocar abre uma
 * folha com o teaser. Fica embaixo dos modos: mostra o futuro sem disputar com o "Nova copa".
 */
export function ComingSoon() {
    const { t, d } = useT();
    const [open, setOpen] = useState<string | null>(null);
    const [liga, setLiga] = useState(() => ligaCountdown());
    useEffect(() => {
        const id = window.setInterval(() => setLiga(ligaCountdown()), 30000);
        return () => clearInterval(id);
    }, []);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const items: Soon[] = [
        ...(LONG_CUP_LIVE
            ? []
            : [
                  {
                      id: 'rota',
                      title: t('home.longCup.title'),
                      text: t('home.longCup.line'),
                      note: t('home.longCup.note'),
                      art: img('assets/trainers/hiker.png'),
                  },
              ]),
        ...(liga
            ? [
                  {
                      id: 'liga',
                      title: t('liga.home.ligaTag'),
                      text: t('liga.home.ligaClosed'),
                      note: t('liga.home.ligaOpensIn', liga),
                      art: <MenuIcon kind="liga" />,
                      tag: t('home.soonDays', { d: liga.d }),
                  },
              ]
            : []),
        ...d.home.soon.map((c, i) => ({ id: `soon${i}`, title: c.title, text: c.text, art: img(SOON_ART[i]) })),
    ];
    const cur = items.find((it) => it.id === open);
    const closeSoon = () => setOpen(null);

    return (
        <section className="soon-strip" aria-labelledby="soon-title">
            <h2 id="soon-title" className="bc-lbl">
                {t('home.soonTitle')}
            </h2>
            <ul className="soon-row">
                {items.map((it) => (
                    <li key={it.id}>
                        <button
                            type="button"
                            className="soon-tile"
                            aria-haspopup="dialog"
                            onClick={() => setOpen(it.id)}
                        >
                            <span className="soon-art" aria-hidden>
                                {it.art}
                            </span>
                            <b>{it.title}</b>
                            {it.tag && <small>{it.tag}</small>}
                            <HudIcon kind="lock" className="soon-lock" />
                        </button>
                    </li>
                ))}
            </ul>
            <Sheet open={!!cur} onClose={closeSoon} title={cur?.title} className="soon-sheet">
                <span className="soon-sheet-art" aria-hidden>
                    {cur?.art}
                </span>
                <span className="bc-tag">{t('home.soonRibbon')}</span>
                <p>{cur?.text}</p>
                {cur?.note && <p className="soon-note">{cur.note}</p>}
            </Sheet>
        </section>
    );
}
