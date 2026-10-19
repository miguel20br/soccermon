import { useMemo } from 'react';
import { buildCupOpponents } from '../../engine/cup';
import { species } from '../../engine/data';
import { monRecipe } from '../../engine/duel-validate';
import { defaultMoveset } from '../../engine/moves';
import type { Special } from '../../engine/specials';
import { useT } from '../../i18n/react';
import { parseCardShowcase } from '../../store/binder';
import { lookOfPeer, lookOfProfile, matchLooks } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { frameTier, parseShowcase } from '../../store/medals';
import { clubColorHex } from '../../store/profile';
import { useCardShowcase } from '../profile/Album';
import { trainerLabel, useAvatar } from '../profile/club';
import { useShowcase } from '../profile/Medals';
import { Scoreboard } from './MatchHud';
import { VersusIntro } from './VersusIntro';

/** Carta de mentira do rival, como viria da sala (receita). */
const fake = (id: number, special: Special | null, shiny = false) =>
    monRecipe({
        uid: `lab-${id}`,
        speciesId: id,
        level: 50,
        xp: 0,
        moves: defaultMoveset(species(id)),
        ability: id === 132 ? 'imposter' : species(id).abilities[0],
        shiny,
        nickname: null,
        condition: 1,
        special,
    });

/** Rival de mentira do Duelo: vem como viria da sala (ids e vitrine já com o degrau). */
const RIVAL = {
    clubColor: 0xe8423f,
    color2: 0xf2c230,
    kitPattern: 'faixa',
    crestShape: 'hexagono',
    crestSymbol: 'chama',
    showcase: ['m:campeao:4', 'c:colPassaros', 's:6:holo'],
    // lixo na frente (espécie que não existe, texto) é ignorado: ficam as 3 cartas de verdade
    cards: [
        { speciesId: 999 },
        'lixo',
        fake(6, { kind: 'icone', title: 'Charizard Rebelde', level: 2 }),
        fake(150, null, true),
        fake(59, { kind: 'evento', type: 'Fire' }),
    ],
};

/**
 * `?lab=versus` (só no dev): o VERSUS do Duelo com o seu perfil (escudo, uniforme, vitrine e moldura) contra um rival
 * de mentira, e o placar com os dois uniformes embaixo (`&placar=1`: só o placar). `&clash=1`: o rival com a sua cor
 * (entra de reserva).
 */
export function VersusLab({ onExit }: { onExit: () => void }) {
    const profile = useGame((s) => s.profile);
    const avatar = useAvatar();
    const mine = useShowcase();
    const myCards = useCardShowcase().insts;
    const { t } = useT();
    const params = new URLSearchParams(window.location.search);
    const clash = params.get('clash') === '1';
    // &placar=1: só o placar (sem a tela de VERSUS por cima)
    const board = params.get('placar') === '1';
    const [home, away] = useMemo(() => {
        const [a, b] = buildCupOpponents('versus-lab');
        return [
            { ...a, name: profile.clubName, color: clubColorHex(profile.clubColor) },
            { ...b, name: 'Rival FC', color: clash ? clubColorHex(profile.clubColor) : RIVAL.clubColor },
        ];
    }, [profile.clubName, profile.clubColor, clash]);
    const looks = matchLooks(lookOfProfile(profile), lookOfPeer({ ...RIVAL, clubColor: away.color }));
    const rivalShow = parseShowcase(RIVAL.showcase);
    return (
        <div className="bc duel">
            {!board && (
                <VersusIntro
                    home={home}
                    away={away}
                    stage={t('duel.title')}
                    ready
                    onDone={onExit}
                    awayTrainer="blue"
                    awayTag="RIV"
                    awayLabel={t('duel.match.vsRival')}
                    homeCoach={{
                        name: trainerLabel(profile),
                        avatar: avatar.src,
                        avatarGoogle: avatar.google,
                        showcase: mine.items,
                        frame: mine.frame,
                        cards: myCards,
                    }}
                    awayCoach={{
                        name: 'Gary',
                        avatar: 'assets/avatars/6.gif',
                        showcase: rivalShow,
                        cards: parseCardShowcase(RIVAL.cards),
                        frame: frameTier(rivalShow),
                    }}
                    homeLook={looks[0]}
                    awayLook={looks[1]}
                    startsIn={9}
                />
            )}
            <div className="bc-head">
                <Scoreboard
                    names={[profile.clubName, 'Rival FC']}
                    tags={[profile.clubTag, 'RIV']}
                    colors={[looks[0].color, looks[1].color]}
                    looks={looks}
                    score={[2, 1]}
                    clock={{ main: "14'", sub: '', text: false, progress: 0.7 }}
                    stage={t('duel.title')}
                />
            </div>
        </div>
    );
}
