import { type CSSProperties, useEffect, useRef } from 'react';
import { create } from 'zustand';
import type { PokemonInstance } from '../../engine/instance';
import { useT } from '../../i18n/react';
import type { Peer } from '../../net/duel-state';
import { parseCardShowcase } from '../../store/binder';
import { type ClubLook, lookOfPeer, lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { frameTier, parseShowcase, type ShowItem, type Tier } from '../../store/medals';
import { activeTitle, activeTrainer, TRAINERS, type TrainerId, trainerFrame } from '../../store/missions';
import { titleClass } from '../../store/title-codes';
import { useCardModal } from '../card-modal';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { AddFriendButton } from './AddFriendButton';
import { useCardShowcase } from './Album';
import { Crest } from './Crest';
import { hexCss, peerAvatar, peerTitle, titleName, trainerLabel, useAvatar } from './club';
import { frameClass, ShowcaseRow, useShowcase } from './Medals';
import { TrainerSprite } from './TrainerTab';
import './profile.css';
import './player-card.css';

/** O que o cartão do treinador mostra (seu perfil ou o do rival, já validado). */
export interface PlayerInfo {
    name: string;
    trainer: TrainerId;
    avatar: { src: string; google: boolean };
    frame: Tier;
    title: { name: string; look: string };
    clubName: string;
    clubTag: string;
    look: ClubLook;
    showcase: ShowItem[];
    cards: PokemonInstance[];
    /** Outro jogador: mostra o "Adicionar amigo". */
    other: boolean;
    /** Id da conta de quem está na sala (o servidor de amigos acha o cartão dele por aqui). */
    id?: string;
    anon?: boolean;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

/** Perfil de quem está na sala do Duelo (dado de fora: cada campo passa pela validação que já existe). */
export function peerInfo(p: Peer, other = true): PlayerInfo {
    const showcase = parseShowcase(p.showcase);
    return {
        name: str(p.name, 40),
        trainer: TRAINERS.includes(p.trainer as TrainerId) ? (p.trainer as TrainerId) : 'red',
        avatar: peerAvatar(p),
        frame: frameTier(showcase),
        title: peerTitle(p),
        clubName: str(p.clubName, 40),
        clubTag: str(p.clubTag, 4),
        look: lookOfPeer(p),
        showcase,
        cards: parseCardShowcase(p.cards),
        other,
        id: str(p.id, 64),
        anon: p.anon === true,
    };
}

/** Seu perfil público (o mesmo que vai pra sala do Duelo). */
export function useMyInfo(): PlayerInfo {
    const profile = useGame((s) => s.profile);
    const avatar = useAvatar();
    const show = useShowcase();
    const cards = useCardShowcase().insts;
    const title = activeTitle(profile);
    return {
        name: trainerLabel(profile),
        trainer: activeTrainer(profile),
        avatar,
        frame: show.frame,
        title: { name: titleName(title), look: titleClass(title).trim() },
        clubName: profile.clubName || 'Pallet FC',
        clubTag: profile.clubTag,
        look: lookOfProfile(profile),
        showcase: show.items,
        cards,
        other: false,
    };
}

/** Cartão do treinador aberto (de qualquer tela: Perfil, sala, VERSUS, placar). */
export const usePlayerCard = create<{ info: PlayerInfo | null; open(i: PlayerInfo): void; close(): void }>((set) => ({
    info: null,
    open: (info) => set({ info }),
    close: () => set({ info: null }),
}));

/**
 * Cartão do treinador (modal): avatar, nome, título, clube, as medalhas da vitrine e as 3 cartas grandes (tocar abre
 * a carta inteira). De outro jogador, o "Adicionar amigo" (src/ui/profile/FriendsTab.tsx).
 */
export function PlayerCardModal() {
    const { info, close } = usePlayerCard();
    const { t } = useT();
    const ref = useRef<HTMLDivElement>(null);
    const open = !!info;

    useEffect(() => {
        if (!open) return;
        // Esc com a carta inteira aberta por cima fecha só a carta
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !useCardModal.getState().inst && close();
        window.addEventListener('keydown', onKey);
        const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        ref.current?.focus({ preventScroll: true });
        return () => {
            window.removeEventListener('keydown', onKey);
            back?.focus({ preventScroll: true });
        };
    }, [open, close]);

    if (!info) return null;
    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; Esc e o botão fechar cobrem o teclado
        <div className="modal-backdrop" onClick={close} role="presentation">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche */}
            <div
                ref={ref}
                tabIndex={-1}
                className={`modal panel pcard bc-surface bc-stripe${trainerFrame(info.trainer)}`}
                style={{ '--club': hexCss(info.look.color), '--tc': hexCss(info.look.color) } as CSSProperties}
                role="dialog"
                aria-modal="true"
                aria-label={t('profile.card.aria', { name: info.name })}
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className="modal-close" onClick={close} aria-label={t('common.ui.close')}>
                    <HudIcon kind="close" />
                </button>
                <header className="pcard-head">
                    <div className="pf-duo">
                        <TrainerSprite id={info.trainer} className="pf-duo-trainer" />
                        <img
                            className={`pf-avatar${info.avatar.google ? '' : ' pixel'}${frameClass(info.frame)}`}
                            src={info.avatar.src}
                            alt=""
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <div className="pf-who">
                        <h2>{info.name}</h2>
                        {info.title.name && (
                            <span className={`pf-title-line${info.title.look ? ` ${info.title.look}` : ''}`}>
                                {info.title.name}
                            </span>
                        )}
                        <span className="pf-clubline">
                            <Crest look={info.look} className="crest pf-crest" />
                            {info.clubName} · <b>{info.clubTag}</b>
                        </span>
                        {info.anon && <span className="duel-anon pcard-anon">{t('duel.lobby.anon')}</span>}
                    </div>
                </header>
                <ShowcaseRow items={info.showcase} className="pcard-medals" />
                <h3 className="bc-lbl pcard-lbl">{t('profile.card.cards')}</h3>
                {info.cards.length ? (
                    <ul className="pcard-cards">
                        {info.cards.map((p) => (
                            <li key={p.uid}>
                                <FutCard inst={p} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="muted pcard-empty">{t('profile.card.noCards')}</p>
                )}
                {info.other && info.id && (
                    <div className="pcard-friend">
                        <AddFriendButton peer={{ id: info.id, anon: info.anon }} />
                    </div>
                )}
            </div>
        </div>
    );
}

/** Botão do Perfil no canto de cima (Home e telas de menu): o avatar redondo e, com espaço, o nome. */
export function ProfileChip() {
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const avatar = useAvatar();
    const frame = useShowcase().frame;
    const { t } = useT();
    const name = trainerLabel(profile);
    return (
        <button
            type="button"
            className="profile-chip"
            style={{ '--club': hexCss(lookOfProfile(profile).color) } as CSSProperties}
            onClick={() => go('profile')}
            aria-label={`${t('profile.title')}: ${name}`}
            title={t('profile.title')}
        >
            <img
                className={`pf-avatar${avatar.google ? '' : ' pixel'}${frameClass(frame)}`}
                src={avatar.src}
                alt=""
                referrerPolicy="no-referrer"
            />
            <span className="profile-chip-name">{name}</span>
        </button>
    );
}
