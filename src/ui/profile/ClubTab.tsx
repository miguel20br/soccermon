import { useEffect, useMemo, useRef, useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { species } from '../../engine/data';
import { useT } from '../../i18n/react';
import {
    againstLook,
    CREST_SHAPES,
    CREST_SYMBOLS,
    type CrestSymbol,
    isUnlocked,
    KIT_PATTERNS,
    type KitPattern,
    lookOfCupClub,
    lookOfProfile,
    SECOND_COLORS,
    UNLOCK,
} from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { medalTiers, TIER_NAMES } from '../../store/medals';
import { newsKey } from '../../store/news';
import {
    avatarOptions,
    bannerInk,
    bannerOf,
    CLUB_COLORS,
    DEFAULT_PROFILE,
    GENERATIONS,
    type Profile,
    rivalColor,
    tagFromName,
} from '../../store/profile';
import { Crest, KitShirt, kitBackground } from './Crest';
import { avatarGif, bannerText, hexCss, titleName } from './club';
import { CheckIcon, LockIcon, ShinySpark } from './icons';
import { useMedalView } from './Medals';
import { NewBadge, useNews } from './news';
import { MissionSummary, TrainerCard } from './TrainerTab';

/** Rival da prévia do placar (Cerulean): azul, troca de uniforme se bater com a sua cor. */
const PREVIEW_RIVAL = 0x2f6fde;
const cleanTag = (s: string) =>
    s
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 3);

/** "Salvo" discreto depois de cada mudança (o perfil salva sozinho). */
function useSavedFlash(): [boolean, () => void] {
    const [on, setOn] = useState(false);
    const timer = useRef(0);
    useEffect(() => () => clearTimeout(timer.current), []);
    return [
        on,
        () => {
            setOn(true);
            clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setOn(false), 1400);
        },
    ];
}

/** Meu clube: nome do treinador, clube, sigla, cor e avatar. Tudo salva na hora. */
/** Perfil → Treinador (`trainer`: nome, avatar, treinador, título e as missões) ou Clube (`club`: cor, escudo, uniforme, faixa). */
export function ClubTab({ part }: { part: 'trainer' | 'club' }) {
    const profile = useGame((s) => s.profile);
    const updateProfile = useGame((s) => s.updateProfile);
    const dex = useGame((s) => s.dex);
    const run = useGame((s) => s.run);
    const user = useCloud((s) => s.user);
    const [saved, flash] = useSavedFlash();
    const { t, d } = useT();
    const save = (patch: Partial<Profile>) => {
        updateProfile(patch);
        flash();
    };

    // a sigla tem estado próprio enquanto a pessoa digita (1–2 letras ainda não valem)
    const [tag, setTag] = useState(profile.clubTag);
    useEffect(() => setTag(profile.clubTag), [profile.clubTag]);

    const club = CLUB_COLORS.find((c) => c.id === profile.clubColor)?.hex ?? CLUB_COLORS[0].hex;
    const rival = rivalColor(club, PREVIEW_RIVAL);
    const look = lookOfProfile(profile);
    const rivalLook = againstLook(look, lookOfCupClub('Cerulean Cascata', PREVIEW_RIVAL));
    const runOld = run && !['eliminated', 'champion'].includes(run.status) && run.teamName !== profile.clubName;
    const av = profile.avatar;
    // avatar com shiny liberado que foi tocado: mostra a escolha Normal / Shiny
    const [choosing, setChoosing] = useState<number | null>(null);
    const news = useNews();
    const avKeys = (id: number, shiny: boolean) =>
        shiny ? [newsKey.avatar(id), newsKey.avatar(id, true)] : [newsKey.avatar(id)];

    return (
        <div className="pf-club">
            <div className={`pf-saved${saved ? ' on' : ''}`} aria-live="polite">
                {saved && (
                    <>
                        <CheckIcon /> {t('profile.club.saved')}
                    </>
                )}
            </div>

            {part === 'trainer' && <MissionSummary />}
            {part === 'trainer' && (
                <section className="panel pf-card">
                    <h2>{t('profile.club.trainerTitle')}</h2>
                    <label className="pf-field">
                        <span>{t('profile.club.yourName')}</span>
                        <input
                            className="pf-input"
                            value={profile.trainerName}
                            maxLength={20}
                            placeholder={user?.name || t('profile.trainer')}
                            autoComplete="nickname"
                            onChange={(e) => save({ trainerName: e.target.value })}
                            onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v !== profile.trainerName) save({ trainerName: v });
                            }}
                        />
                    </label>
                    <fieldset className="pf-field">
                        <legend>{t('profile.club.avatar')}</legend>
                        {user?.avatar && (
                            <div className="pf-avatars">
                                <button
                                    type="button"
                                    aria-pressed={av.kind === 'google'}
                                    className={`pf-av${av.kind === 'google' ? ' active' : ''}`}
                                    onClick={() => save({ avatar: { kind: 'google' } })}
                                    title={t('profile.club.googlePhoto')}
                                >
                                    <img
                                        src={user.avatar}
                                        alt={t('profile.club.googlePhoto')}
                                        referrerPolicy="no-referrer"
                                    />
                                </button>
                            </div>
                        )}
                        {/* um bloco por geração (fechado); o escolhido aparece no título do bloco */}
                        {GENERATIONS.map((g) => {
                            const opts = avatarOptions(dex, g);
                            const mine = av.kind === 'pokemon' && av.speciesId >= g.from && av.speciesId <= g.to;
                            return (
                                <details key={g.gen} className="pf-gen">
                                    <summary>
                                        {mine && (
                                            <span className="pf-av active pf-gen-current">
                                                <img
                                                    className="pixel"
                                                    src={avatarGif(av.speciesId, av.shiny === true)}
                                                    alt=""
                                                />
                                                {av.shiny && <ShinySpark />}
                                            </span>
                                        )}
                                        <b>{t('profile.club.gen', { gen: g.gen, region: g.region })}</b>
                                        <span className="pf-count">
                                            {opts.length}/{g.to - g.from + 1}
                                        </span>
                                        <NewBadge
                                            on={opts.some((o) => avKeys(o.speciesId, o.shiny).some((k) => news.has(k)))}
                                        />
                                    </summary>
                                    <div className="pf-avatars">
                                        {opts.map(({ speciesId: id, shiny }) => {
                                            const on = mine && av.speciesId === id;
                                            const onShiny = on && av.shiny === true;
                                            const name = species(id).name;
                                            const pick = (s: boolean) => {
                                                setChoosing(null);
                                                save({
                                                    avatar: s
                                                        ? { kind: 'pokemon', speciesId: id, shiny: true }
                                                        : { kind: 'pokemon', speciesId: id },
                                                });
                                            };
                                            // shiny liberado: tocar abre a escolha Normal / Shiny no lugar do botão
                                            return shiny && choosing === id ? (
                                                <fieldset
                                                    key={id}
                                                    className="pf-av-choice"
                                                    aria-label={t('profile.club.avatarPick', { name })}
                                                >
                                                    {[false, true].map((s) => (
                                                        <button
                                                            type="button"
                                                            key={String(s)}
                                                            className="pf-av-opt"
                                                            aria-pressed={on && onShiny === s}
                                                            onClick={() => pick(s)}
                                                        >
                                                            <span
                                                                className={`pf-av${on && onShiny === s ? ' active' : ''}${s ? ' pf-av-shiny' : ''}`}
                                                            >
                                                                <img className="pixel" src={avatarGif(id, s)} alt="" />
                                                                {s && <ShinySpark />}
                                                            </span>
                                                            <small>
                                                                {t(
                                                                    s
                                                                        ? 'profile.club.avatarShiny'
                                                                        : 'profile.club.avatarNormal',
                                                                )}
                                                            </small>
                                                        </button>
                                                    ))}
                                                </fieldset>
                                            ) : (
                                                <button
                                                    type="button"
                                                    aria-pressed={on}
                                                    aria-expanded={shiny ? false : undefined}
                                                    key={id}
                                                    className={`pf-av${on ? ' active' : ''}${shiny ? ' pf-av-has-shiny' : ''}`}
                                                    onClick={() => (shiny ? setChoosing(id) : pick(false))}
                                                    title={shiny ? t('profile.club.avatarHasShiny', { name }) : name}
                                                >
                                                    <img
                                                        className="pixel"
                                                        src={avatarGif(id, onShiny)}
                                                        alt={shiny ? t('profile.club.avatarHasShiny', { name }) : name}
                                                        loading="lazy"
                                                    />
                                                    {shiny && <ShinySpark />}
                                                    <NewBadge k={avKeys(id, shiny)} className="corner" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </details>
                            );
                        })}
                        <small className="muted">{t('profile.club.avatarHelp')}</small>
                    </fieldset>
                </section>
            )}
            {part === 'trainer' && <TrainerCard save={save} />}

            {part === 'club' && (
                <section className="panel pf-card">
                    <h2>{t('profile.club.clubTitle')}</h2>
                    <div className="pf-row">
                        <label className="pf-field grow">
                            <span>{t('profile.club.clubName')}</span>
                            <input
                                className="pf-input"
                                value={profile.clubName}
                                maxLength={22}
                                autoComplete="off"
                                onChange={(e) => {
                                    const name = e.target.value;
                                    // sigla automática até a pessoa escolher uma
                                    const auto = profile.clubTag === tagFromName(profile.clubName);
                                    save(auto ? { clubName: name, clubTag: tagFromName(name) } : { clubName: name });
                                }}
                                onBlur={(e) => {
                                    const name = e.target.value.trim() || DEFAULT_PROFILE.clubName;
                                    if (name === profile.clubName) return;
                                    const auto = profile.clubTag === tagFromName(profile.clubName);
                                    save(auto ? { clubName: name, clubTag: tagFromName(name) } : { clubName: name });
                                }}
                            />
                        </label>
                        <label className="pf-field pf-tag-field">
                            <span>{t('profile.club.tag')}</span>
                            <input
                                className="pf-input pf-tag-input"
                                value={tag}
                                maxLength={3}
                                autoCapitalize="characters"
                                autoComplete="off"
                                spellCheck={false}
                                aria-describedby="pf-tag-help"
                                onChange={(e) => {
                                    const v = cleanTag(e.target.value);
                                    setTag(v);
                                    if (v.length === 3) save({ clubTag: v });
                                }}
                                onBlur={() => {
                                    if (tag.length === 3) return;
                                    const v = tag ? tag.padEnd(3, 'X') : tagFromName(profile.clubName);
                                    setTag(v);
                                    save({ clubTag: v });
                                }}
                            />
                        </label>
                    </div>
                    <small id="pf-tag-help" className="muted">
                        {t('profile.club.tagHelp')}
                        {runOld && t('profile.club.runOld', { team: run?.teamName ?? '' })}
                    </small>

                    <fieldset className="pf-field">
                        <legend>{t('profile.club.color')}</legend>
                        <div className="pf-colors">
                            {CLUB_COLORS.map((c) => {
                                const on = c.id === profile.clubColor;
                                return (
                                    <button
                                        type="button"
                                        aria-pressed={on}
                                        key={c.id}
                                        className={`pf-color${on ? ' active' : ''}`}
                                        style={{ ['--sw' as string]: hexCss(c.hex) }}
                                        onClick={() => save({ clubColor: c.id })}
                                    >
                                        <i />
                                        <span>{d.common.color[c.id] ?? c.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <KitEditor save={save} />

                    <div className="pf-field">
                        <span id="pf-banner-label">{t('profile.club.banner')}</span>
                        <select
                            aria-labelledby="pf-banner-label"
                            className="pf-input"
                            value={bannerOf(profile.banner)}
                            data-testid="pf-banner"
                            onChange={(e) => save({ banner: Number(e.target.value) })}
                        >
                            {d.profile.club.banners.map((_, i) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: a lista é fixa e o índice é o que salva
                                <option key={i} value={i}>
                                    {bannerText(i, profile.clubName)}
                                </option>
                            ))}
                        </select>
                        <div
                            className="pf-banner"
                            style={{ ['--c' as string]: hexCss(club), ['--ink' as string]: hexCss(bannerInk(club)) }}
                        >
                            {bannerText(profile.banner, profile.clubName)}
                        </div>
                        <small className="muted">{t('profile.club.bannerHelp')}</small>
                    </div>

                    <div className="pf-field">
                        <span>{t('profile.club.preview')}</span>
                        <div
                            className="pf-preview"
                            role="img"
                            aria-label={t('profile.club.previewAria', { tag: profile.clubTag })}
                        >
                            <span
                                className="pf-pv-team"
                                style={{
                                    ['--kit' as string]: kitBackground(look.color, look.color2, look.pattern, '3px'),
                                }}
                            >
                                <i />
                                <Crest look={look} className="crest pf-pv-crest" />
                                {profile.clubTag}
                            </span>
                            <b>2 x 1</b>
                            <span
                                className="pf-pv-team away"
                                style={{
                                    ['--kit' as string]: kitBackground(
                                        rivalLook.color,
                                        rivalLook.color2,
                                        rivalLook.pattern,
                                        '3px',
                                    ),
                                }}
                            >
                                CER
                                <Crest look={rivalLook} className="crest pf-pv-crest" />
                                <i />
                            </span>
                        </div>
                        {rival !== PREVIEW_RIVAL && <small className="muted">{t('profile.club.awayKit')}</small>}
                    </div>
                </section>
            )}
        </div>
    );
}

/** Escudo (formato, símbolo) e uniforme (cor secundária, padrão). Peça bloqueada mostra como liberar. */
function KitEditor({ save }: { save: (patch: Partial<Profile>) => void }) {
    const profile = useGame((s) => s.profile);
    const view = useMedalView();
    const tiers = useMemo(() => medalTiers(view), [view]);
    const { t, d } = useT();
    const [hint, setHint] = useState<string | null>(null);
    const look = lookOfProfile(profile);
    const open = (piece: CrestSymbol | KitPattern) => isUnlocked(piece, view.done, tiers);
    const how = (piece: CrestSymbol | KitPattern) => {
        const u = UNLOCK[piece];
        if (!u) return '';
        return 'collection' in u
            ? t('profile.club.unlockCollection', { name: titleName(u.collection) })
            : t('profile.club.unlockMedal', {
                  name: d.profile.medals.names[u.medal] ?? u.medal,
                  tier: d.profile.medals.tiers[TIER_NAMES[u.tier]],
              });
    };
    const lockedBtn = (piece: CrestSymbol | KitPattern, name: string, art: React.ReactNode) => (
        <button
            type="button"
            key={piece}
            className="kit-opt locked"
            aria-label={`${name}: ${how(piece)}`}
            onClick={() => setHint(`${name}: ${how(piece)}`)}
        >
            {art}
            <span className="kit-lock">
                <LockIcon />
            </span>
            <small>{name}</small>
        </button>
    );

    return (
        <div className="pf-field kit-editor" data-testid="kit-editor">
            <span className="kit-title">{t('profile.club.kitTitle')}</span>
            <div className="kit-hero" aria-hidden>
                <Crest look={look} className="crest kit-hero-crest" />
                <KitShirt look={look} className="kit-shirt kit-hero-shirt" />
            </div>

            <fieldset className="kit-group">
                <legend>{t('profile.club.crestShape')}</legend>
                <div className="kit-opts">
                    {CREST_SHAPES.map((shape) => (
                        <button
                            type="button"
                            key={shape}
                            aria-pressed={look.shape === shape}
                            className={`kit-opt${look.shape === shape ? ' active' : ''}`}
                            onClick={() => save({ crestShape: shape })}
                        >
                            <Crest look={{ ...look, shape }} className="crest kit-crest" />
                            <small>{d.profile.club.shapes[shape]}</small>
                        </button>
                    ))}
                </div>
            </fieldset>

            <fieldset className="kit-group">
                <legend>{t('profile.club.crestSymbol')}</legend>
                <div className="kit-opts">
                    {CREST_SYMBOLS.map((symbol) => {
                        const name = d.profile.club.symbols[symbol] ?? symbol;
                        const art = <Crest look={{ ...look, symbol }} className="crest kit-crest" />;
                        if (!open(symbol)) return lockedBtn(symbol, name, art);
                        return (
                            <button
                                type="button"
                                key={symbol}
                                aria-pressed={look.symbol === symbol}
                                className={`kit-opt${look.symbol === symbol ? ' active' : ''}`}
                                onClick={() => save({ crestSymbol: symbol })}
                            >
                                {art}
                                <small>{name}</small>
                                {UNLOCK[symbol] && <NewBadge k={newsKey.kit(symbol)} className="corner" />}
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <fieldset className="kit-group">
                <legend>{t('profile.club.color2')}</legend>
                <div className="pf-colors">
                    {SECOND_COLORS.map((c) => {
                        const on = c.hex === look.color2;
                        return (
                            <button
                                type="button"
                                aria-pressed={on}
                                key={c.id}
                                className={`pf-color${on ? ' active' : ''}`}
                                style={{ ['--sw' as string]: hexCss(c.hex) }}
                                onClick={() => save({ clubColor2: c.id })}
                            >
                                <i />
                                <span>{d.common.color[c.id] ?? c.name}</span>
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <fieldset className="kit-group">
                <legend>{t('profile.club.kitPattern')}</legend>
                <div className="kit-opts">
                    {KIT_PATTERNS.map((pattern) => {
                        const name = d.profile.club.patterns[pattern] ?? pattern;
                        const art = <KitShirt look={{ ...look, pattern }} />;
                        if (!open(pattern)) return lockedBtn(pattern, name, art);
                        return (
                            <button
                                type="button"
                                key={pattern}
                                aria-pressed={look.pattern === pattern}
                                className={`kit-opt${look.pattern === pattern ? ' active' : ''}`}
                                onClick={() => save({ kitPattern: pattern })}
                            >
                                {art}
                                <small>{name}</small>
                                {UNLOCK[pattern] && <NewBadge k={newsKey.kit(pattern)} className="corner" />}
                            </button>
                        );
                    })}
                </div>
            </fieldset>
            {hint && (
                <small className="kit-hint" role="status">
                    <LockIcon /> {hint}
                </small>
            )}
            <small className="muted">{t('profile.club.kitHelp')}</small>
        </div>
    );
}
