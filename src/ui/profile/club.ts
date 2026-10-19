import type { CSSProperties } from 'react';
import { useCloud } from '../../cloud/cloud';
import { dict, fmt, getLang, t } from '../../i18n';
import { useGame } from '../../store/game-store';
import { DEFAULT_TITLE, MISSIONS, type Mission, missionOfTrainer, type TrainerId } from '../../store/missions';
import { type Avatar, bannerOf, clubColorHex, type Profile, rivalColor } from '../../store/profile';
import { CUSTOM_TITLES, titleClass } from '../../store/title-codes';
import './club.css';

export const hexCss = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Cor do seu clube (número, para o Phaser) — acompanha o perfil. */
export const useClubColor = () => useGame((s) => clubColorHex(s.profile.clubColor));

/** `--club` (e `--rival`, se passar a cor do rival) para pendurar no style de um bloco. */
export function clubVars(club: number, rival?: number): CSSProperties {
    const vars: Record<string, string> = { '--club': hexCss(club) };
    if (rival !== undefined) vars['--rival'] = hexCss(rivalColor(club, rival));
    return vars as CSSProperties;
}

/** Nome que aparece para o treinador: o escolhido, senão o da conta Google, senão "Treinador". */
export function trainerLabel(profile: Profile, googleName?: string | null): string {
    return profile.trainerName.trim() || googleName?.trim() || t('profile.trainer');
}

/** Texto da faixa da torcida (no idioma da tela, com o nome do clube). */
export const bannerText = (banner: unknown, club: string) =>
    fmt(dict().profile.club.banners[bannerOf(banner)], { club });

export const speciesGif = (id: number) => `assets/cards/${id}.gif`;

/** Foto do avatar: a do Google (se escolheu e está logado) ou o sprite do Pokémon (Pikachu de reserva). */
export function avatarImage(avatar: Avatar, googlePhoto: string | null | undefined): { src: string; google: boolean } {
    if (avatar.kind === 'google' && googlePhoto) return { src: googlePhoto, google: true };
    return { src: speciesGif(avatar.kind === 'pokemon' ? avatar.speciesId : 25), google: false };
}

/** Avatar do perfil, pronto para usar (lê o perfil e a conta). */
export function useAvatar() {
    const avatar = useGame((s) => s.profile.avatar);
    const photo = useCloud((s) => s.user?.avatar ?? null);
    return avatarImage(avatar, photo);
}

export const trainerName = (id: TrainerId) => dict().profile.trainers[id] ?? id;

/** Nome do título (das missões ou de código). */
export function titleName(id: string): string {
    return dict().profile.titles[id] ?? CUSTOM_TITLES[id]?.[getLang()] ?? id;
}

/** Título de quem está na sala do duelo: pelo id quando vem (idioma de quem vê + visual), senão o nome que veio. */
export const peerTitle = (p: { title: string; titleId?: string }) => ({
    name: p.titleId ? titleName(p.titleId) : p.title,
    look: titleClass(p.titleId ?? '').trim(),
});

/** Texto de uma missão (as de ginásio usam o mesmo modelo com o líder e a cidade). */
export function missionText(m: Mission): string {
    const d = dict().profile.missions;
    return m.vars ? fmt(d.gym, m.vars) : (d.text[m.id] ?? m.id);
}

/** Missão que dá este título (os de Pallet e de código não têm). */
export const missionOfTitle = (id: string) => MISSIONS.find((m) => m.title === id);

/** Como se ganha o treinador: a tarefa da missão, ou "Desde o começo" (os 4 livres). */
export function trainerHow(id: TrainerId): string {
    const m = missionOfTrainer(id);
    return m ? missionText(m) : t('profile.picker.fromStart');
}

/** Como se ganha o título: a tarefa da missão, "Desde o começo" (Pallet) ou "Código". */
export function titleHow(id: string): string {
    if (id === DEFAULT_TITLE) return t('profile.picker.fromStart');
    const m = missionOfTitle(id);
    return m ? missionText(m) : t('profile.picker.byCode');
}
