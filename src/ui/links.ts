import { getLang, type Lang } from '../i18n';

/** Links externos do jogo. */
export const REPO_URL = 'https://github.com/miguel20br/soccermon';
/** Feedback e bugs: o Discussions do repo (não precisa saber usar issue). */
export const FEEDBACK_URL = `${REPO_URL}/discussions`;

/** Página de privacidade no idioma do jogo (public/privacidade.html / public/privacy.html). */
export const privacyUrl = (lang: Lang = getLang()): string => (lang === 'en' ? 'privacy.html' : 'privacidade.html');
