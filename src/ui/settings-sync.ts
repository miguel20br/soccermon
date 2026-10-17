import { setVolumes } from '../game/audio';
import { setLang } from '../i18n';
import { detectLang, htmlLang } from '../i18n/lang';
import { type ReduceMotion, type Settings, useGame } from '../store/game-store';
import './motion.css';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/** "Reduzir movimento" resolvido: 'system' segue o aparelho. */
export function reduceMotionOn(pref: ReduceMotion = useGame.getState().settings.reduceMotion): boolean {
    if (pref !== 'system') return pref === 'on';
    try {
        return window.matchMedia(REDUCE_QUERY).matches;
    } catch {
        return false;
    }
}

/**
 * Marca o <html> (o CSS em settings.css desliga animações, flashes e transições, e `lang` segue o idioma),
 * acerta o volume e o idioma dos textos fora do React.
 */
function apply(settings: Settings) {
    const lang = settings.lang ?? detectLang();
    setLang(lang);
    document.documentElement.lang = htmlLang(lang);
    document.title =
        lang === 'en' ? 'Soccermon · Pokémon draft and futsal cup' : 'Soccermon · Draft de Pokémon e copa de futsal';
    document.documentElement.dataset.reduceMotion = String(reduceMotionOn(settings.reduceMotion));
    setVolumes({
        master: settings.volume,
        cries: settings.criesVolume,
        sfx: settings.sfxVolume,
        crowd: settings.crowdVolume,
    });
}

/** Liga as configurações globais (uma vez, no início do app): movimento reduzido e volume por canal. */
export function startSettingsSync() {
    apply(useGame.getState().settings);
    useGame.subscribe((s, prev) => {
        if (s.settings !== prev.settings) apply(s.settings);
    });
    try {
        window.matchMedia(REDUCE_QUERY).addEventListener('change', () => apply(useGame.getState().settings));
    } catch {
        // navegador sem matchMedia: fica com a escolha manual
    }
}
