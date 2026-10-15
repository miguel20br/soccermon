import { useEffect, useMemo, useRef, useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { species } from '../../engine/data';
import { useGame } from '../../store/game-store';
import { CLUB_COLORS, DEFAULT_PROFILE, isPlayed, type Profile, rivalColor, tagFromName } from '../../store/profile';
import { hexCss, speciesGif } from './club';
import { CheckIcon } from './icons';

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
export function ClubTab() {
    const profile = useGame((s) => s.profile);
    const updateProfile = useGame((s) => s.updateProfile);
    const dex = useGame((s) => s.dex);
    const run = useGame((s) => s.run);
    const user = useCloud((s) => s.user);
    const [saved, flash] = useSavedFlash();
    const save = (patch: Partial<Profile>) => {
        updateProfile(patch);
        flash();
    };

    // a sigla tem estado próprio enquanto a pessoa digita (1–2 letras ainda não valem)
    const [tag, setTag] = useState(profile.clubTag);
    useEffect(() => setTag(profile.clubTag), [profile.clubTag]);

    const avatars = useMemo(() => {
        const ids = new Set<number>([25]);
        for (const [id, e] of Object.entries(dex)) if (isPlayed(e)) ids.add(Number(id));
        return [...ids].sort((a, b) => a - b);
    }, [dex]);

    const club = CLUB_COLORS.find((c) => c.id === profile.clubColor)?.hex ?? CLUB_COLORS[0].hex;
    const rival = rivalColor(club, PREVIEW_RIVAL);
    const runOld = run && !['eliminated', 'champion'].includes(run.status) && run.teamName !== profile.clubName;
    const av = profile.avatar;

    return (
        <div className="pf-club">
            <div className={`pf-saved${saved ? ' on' : ''}`} aria-live="polite">
                {saved && (
                    <>
                        <CheckIcon /> Salvo
                    </>
                )}
            </div>

            <section className="panel pf-card">
                <h2>Treinador</h2>
                <label className="pf-field">
                    <span>Seu nome</span>
                    <input
                        className="pf-input"
                        value={profile.trainerName}
                        maxLength={20}
                        placeholder={user?.name || 'Treinador'}
                        autoComplete="nickname"
                        onChange={(e) => save({ trainerName: e.target.value })}
                        onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== profile.trainerName) save({ trainerName: v });
                        }}
                    />
                </label>
                <fieldset className="pf-field">
                    <legend>Avatar</legend>
                    <div className="pf-avatars">
                        {user?.avatar && (
                            <button
                                type="button"
                                aria-pressed={av.kind === 'google'}
                                className={`pf-av${av.kind === 'google' ? ' active' : ''}`}
                                onClick={() => save({ avatar: { kind: 'google' } })}
                                title="Foto da conta Google"
                            >
                                <img src={user.avatar} alt="Foto da conta Google" referrerPolicy="no-referrer" />
                            </button>
                        )}
                        {avatars.map((id) => {
                            const on = av.kind === 'pokemon' && av.speciesId === id;
                            return (
                                <button
                                    type="button"
                                    aria-pressed={on}
                                    key={id}
                                    className={`pf-av${on ? ' active' : ''}`}
                                    onClick={() => save({ avatar: { kind: 'pokemon', speciesId: id } })}
                                    title={species(id).name}
                                >
                                    <img className="pixel" src={speciesGif(id)} alt={species(id).name} loading="lazy" />
                                </button>
                            );
                        })}
                    </div>
                    <small className="muted">Os Pokémon que jogarem pelo seu time viram opção de avatar.</small>
                </fieldset>
            </section>

            <section className="panel pf-card">
                <h2>Clube</h2>
                <div className="pf-row">
                    <label className="pf-field grow">
                        <span>Nome do clube</span>
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
                        <span>Sigla</span>
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
                    O nome já vem preenchido na Nova copa. A sigla (3 letras ou números) aparece no placar do celular.
                    {runOld && ` A copa em andamento continua como ${run?.teamName}.`}
                </small>

                <fieldset className="pf-field">
                    <legend>Cor do clube</legend>
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
                                    <span>{c.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                <div className="pf-field">
                    <span>Prévia do placar</span>
                    <div className="pf-preview" role="img" aria-label={`Prévia: ${profile.clubTag} 2 x 1 rival`}>
                        <span className="pf-pv-team" style={{ ['--c' as string]: hexCss(club) }}>
                            <i />
                            {profile.clubTag}
                        </span>
                        <b>2 x 1</b>
                        <span className="pf-pv-team away" style={{ ['--c' as string]: hexCss(rival) }}>
                            CER
                            <i />
                        </span>
                    </div>
                    {rival !== PREVIEW_RIVAL && (
                        <small className="muted">Rival com cor parecida com a sua usa o uniforme reserva.</small>
                    )}
                </div>
            </section>
        </div>
    );
}
