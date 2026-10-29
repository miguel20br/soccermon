import { type CSSProperties, useCallback, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { useCloud } from '../../cloud/cloud';
import { SPECIES } from '../../engine/data';
import type { PokemonInstance } from '../../engine/instance';
import {
    challengeFriend,
    type FriendNumbers,
    type FriendRow,
    type FriendTitle,
    isFriendCode,
    type PublicPeer,
    useFriends,
} from '../../friends/api';
import { useT } from '../../i18n/react';
import type { Peer } from '../../net/duel-state';
import { parseCardShowcase } from '../../store/binder';
import { type ClubLook, lookOfPeer, lookOfProfile, peerLookFields } from '../../store/club-kit';
import { headToHead } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { frameTier, parseShowcase, type ShowItem, type Tier } from '../../store/medals';
import { activeTitle, activeTrainer, TRAINERS, type TrainerId, trainerFrame } from '../../store/missions';
import { bannerOf, clubColorHex } from '../../store/profile';
import { titleClass } from '../../store/title-codes';
import { cupCounts, cupList, METALS } from '../../store/trophies';
import { useCardModal } from '../card-modal';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { PixelTrophy } from '../components/PixelTrophy';
import { Sheet } from '../kit/Sheet';
import { AddFriendButton } from './AddFriendButton';
import { useCardShowcase } from './Album';
import { Crest } from './Crest';
import {
    avatarImage,
    avatarWire,
    hexCss,
    peerAvatar,
    peerTitle,
    speciesGif,
    titleName,
    trainerLabel,
    useAvatar,
} from './club';
import { frameClass, ShowcaseRow, useShowcase } from './Medals';
import { Num } from './NumbersTab';
import { NewDot, useNews } from './news';
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
    /** Código de amigo (pedir amizade por ele; o botão sabe se já são amigos ou se o pedido já foi). */
    code?: string;
    /** Quem não é amigo, aberto de um ranking: só nome e clube (a vitrine só amigo lê). */
    bare?: boolean;
    anon?: boolean;
    /** Taças da Copa por metal (bronze, prata, ouro): o pedaço da sala de troféus. */
    cups: [number, number, number];
    /** Perfil de um amigo (Perfil → Amigos → tocar no nome): números, últimos títulos e o retrospecto no Duelo. */
    friend?: { code: string; club: string; numbers: FriendNumbers | null; hall: FriendTitle[] };
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const int = (v: unknown, max = 1e7) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
const parseCups = (v: unknown): [number, number, number] => {
    const a = Array.isArray(v) ? v : [];
    return [int(a[0], 999), int(a[1], 999), int(a[2], 999)];
};

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
        cups: parseCups(p.cups),
        other,
        id: str(p.id, 64),
        code: typeof p.code === 'string' && isFriendCode(p.code) ? p.code : undefined,
        anon: p.anon === true,
    };
}

const obj = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
function friendTitle(v: unknown): FriendTitle | null {
    const h = obj(v);
    const final = Array.isArray(h.final) ? h.final : [];
    const captain = int(h.captain, 999);
    if (!h.date) return null;
    return {
        date: int(h.date, 1e13),
        club: str(h.club, 40),
        color: str(h.color, 12),
        final: [int(final[0], 99), int(final[1], 99)],
        perfect: h.perfect === true,
        captain: SPECIES.some((sp) => sp.id === captain) ? captain : 25,
        shiny: h.shiny === true,
    };
}

/**
 * Perfil de um amigo: a linha da lista (nome e clube que o servidor guarda) + a vitrine que ele publicou (dado de
 * fora, validado campo a campo como o peer do Duelo). Sem vitrine (amigo numa versão antiga): só o nome e o clube.
 */
export function friendInfo(r: FriendRow, raw: unknown): PlayerInfo {
    const p = obj(raw);
    const n = obj(p.numbers);
    const base = peerInfo({
        ...p,
        title: str(p.title, 60),
        id: '',
        name: r.trainer,
        clubName: r.club,
        clubTag: r.club_tag,
        clubColor: clubColorHex(r.club_color),
    } as Peer);
    return {
        ...base,
        id: undefined,
        friend: {
            code: r.code,
            club: r.club,
            numbers: p.numbers
                ? {
                      matches: int(n.matches),
                      wins: int(n.wins),
                      goals: int(n.goals),
                      titles: int(n.titles),
                      perfect: int(n.perfect),
                      bestStreak: int(n.bestStreak),
                      duelWins: int(n.duelWins),
                      played: int(n.played, 999),
                  }
                : null,
            hall: (Array.isArray(p.hall) ? p.hall.slice(0, 3) : [])
                .map(friendTitle)
                .filter((h): h is FriendTitle => !!h),
        },
    };
}

/** Seu perfil público (o mesmo que vai pra sala do Duelo). */
export function useMyInfo(): PlayerInfo {
    const profile = useGame((s) => s.profile);
    const avatar = useAvatar();
    const show = useShowcase();
    const cards = useCardShowcase().insts;
    const title = activeTitle(profile);
    const hall = useGame((s) => s.hall);
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
        cups: cupList(cupCounts(hall)),
        other: false,
    };
}

/** Seu perfil como vai pra sala do Duelo e pra vitrine dos amigos (sem o id da conta). */
export function usePublicPeer(): PublicPeer {
    const profile = useGame((s) => s.profile);
    const user = useCloud((s) => s.user);
    const showcase = useShowcase().encoded;
    const cards = useCardShowcase().encoded;
    const code = useFriends((s) => s.code);
    const hall = useGame((s) => s.hall);
    return useMemo(() => {
        const av = avatarImage(profile.avatar, user?.avatar);
        return {
            name: trainerLabel(profile, user?.name),
            avatar: avatarWire(av.src),
            avatarGoogle: av.google,
            trainer: activeTrainer(profile),
            title: titleName(activeTitle(profile)),
            titleId: activeTitle(profile),
            clubName: profile.clubName || 'Pallet FC',
            clubTag: profile.clubTag || 'PAL',
            clubColor: clubColorHex(profile.clubColor),
            banner: bannerOf(profile.banner),
            ...peerLookFields(lookOfProfile(profile)),
            showcase,
            cards,
            cups: cupList(cupCounts(hall)),
            ...(code ? { code } : {}),
        };
    }, [profile, user, showcase, cards, code, hall]);
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
    const open = !!info;

    useEffect(() => {
        if (!open) return;
        const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        return () => back?.focus({ preventScroll: true });
    }, [open]);
    // com a carta inteira aberta por cima, Esc e toque fora fecham só a carta
    const closeIfTop = useCallback(() => {
        if (!useCardModal.getState().inst) close();
    }, [close]);

    if (!info) return null;
    return (
        <Sheet
            open
            onClose={closeIfTop}
            title={info.name}
            style={{ '--club': hexCss(info.look.color), '--tc': hexCss(info.look.color) } as CSSProperties}
            className={`pcard bc-surface bc-stripe${trainerFrame(info.trainer)}`}
        >
            <header className="pcard-head">
                {!info.bare && (
                    <div className="pf-duo">
                        <TrainerSprite id={info.trainer} className="pf-duo-trainer" />
                        <img
                            className={`pf-avatar${info.avatar.google ? '' : ' pixel'}${frameClass(info.frame)}`}
                            src={info.avatar.src}
                            alt=""
                            referrerPolicy="no-referrer"
                        />
                    </div>
                )}
                <div className="pf-who">
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
            {info.bare && <p className="muted pcard-empty">{t('profile.card.notFriend')}</p>}
            {!info.bare && <ShowcaseRow items={info.showcase} className="pcard-medals" />}
            {info.cups.some((n) => n > 0) && (
                <div
                    className="pcard-cups"
                    role="img"
                    aria-label={`${t('trophies.cardTrophies')}: ${info.cups.join(' · ')}`}
                >
                    {METALS.map((m, i) =>
                        info.cups[i] ? (
                            <span key={m} className="pcard-cup">
                                <PixelTrophy kind="taca" metal={m} />
                                <b>{t('trophies.times', { n: info.cups[i] })}</b>
                            </span>
                        ) : null,
                    )}
                </div>
            )}
            {!info.bare && <h3 className="bc-lbl pcard-lbl">{t('profile.card.cards')}</h3>}
            {info.bare ? null : info.cards.length ? (
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
            {info.friend && <FriendPart f={info.friend} name={info.name} />}
            {info.other && !info.friend && (info.id || info.code) && (
                <div className="pcard-friend">
                    <AddFriendButton peer={{ id: info.id, code: info.code, anon: info.anon }} />
                </div>
            )}
        </Sheet>
    );
}

/** O que só o perfil do amigo tem: números, os últimos títulos e "vocês no Duelo". */
function FriendPart({ f, name }: { f: NonNullable<PlayerInfo['friend']>; name: string }) {
    const { t, lang } = useT();
    const duels = useGame((s) => s.duels);
    const vs = headToHead(duels, { code: f.code, trainer: name, club: f.club });
    const total = vs.win + vs.draw + vs.loss;
    return (
        <>
            <h3 className="bc-lbl pcard-lbl">{t('profile.card.numbers')}</h3>
            {f.numbers ? (
                <div className="pf-career pcard-nums">
                    <Num label={t('profile.numbers.matches')} v={f.numbers.matches} />
                    <Num label={t('profile.numbers.wins')} v={f.numbers.wins} />
                    <Num label={t('profile.numbers.titles')} v={f.numbers.titles} />
                    <Num label={t('profile.card.played')} v={f.numbers.played} />
                </div>
            ) : (
                <p className="muted pcard-empty">{t('profile.card.noVitrine', { name })}</p>
            )}
            {f.hall.length > 0 && (
                <>
                    <h3 className="bc-lbl pcard-lbl">{t('profile.card.lastTitles')}</h3>
                    <ul className="pcard-titles">
                        {f.hall.map((h) => (
                            <li key={h.date} style={{ '--tc': hexCss(clubColorHex(h.color)) } as CSSProperties}>
                                <img className="pixel" src={speciesGif(h.captain, h.shiny)} alt="" />
                                <span>
                                    <b>{h.club}</b>
                                    <small>
                                        {new Date(h.date).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US')} ·{' '}
                                        {t('profile.card.final', { a: h.final[0], b: h.final[1] })}
                                        {h.perfect ? ` · ${t('profile.card.perfect')}` : ''}
                                    </small>
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <h3 className="bc-lbl pcard-lbl">{t('profile.card.h2h')}</h3>
            <p className="pcard-h2h" data-testid="friend-h2h">
                {total ? t('profile.card.h2hLine', { w: vs.win, d: vs.draw, l: vs.loss }) : t('profile.card.h2hNone')}
            </p>
            <div className="pcard-friend">
                <button
                    type="button"
                    className="btn outline"
                    onClick={() => {
                        usePlayerCard.getState().close();
                        challengeFriend({ code: f.code, trainer: name });
                    }}
                >
                    <HudIcon kind="play" /> {t('friends.challenge')}
                </button>
            </div>
        </>
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
    const news = useNews();
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
            <NewDot on={news.size > 0} className="profile-chip-dot" />
        </button>
    );
}
