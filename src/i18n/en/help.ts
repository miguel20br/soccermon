import type { help as pt } from '../pt/help';

/** Help: "How it works" for each mode, the rules not shown on screen and the FAQ. */
export const help: typeof pt = {
    sections: {
        posicoes: {
            title: 'Positions and attributes',
            blocks: [
                {
                    p: "**9 attributes** (1 to 99), taken from each Pokémon's base stats: Pace (Speed), Dribbling, Shooting, Passing, Defending, Physical, Positioning (reading the game), Stamina (HP) and Goalkeeping.",
                },
                {
                    p: 'Body shape matters too: Pokémon with hands or arms are better in goal; quadrupeds, birds and fish are worse. Small ones dribble better; giant ones, worse.',
                },
                {
                    list: [
                        ['Goalkeeper', 'uses the Goalkeeping attribute (HP, Defense, Sp. Def and size).'],
                        ['Defender', 'the center-back: Defending, Positioning, Physical and Passing.'],
                        ['Winger', 'runs down the flanks: Pace, Dribbling, Passing and Stamina.'],
                        [
                            'Pivot',
                            'the target striker: Shooting and Physical weigh a lot, plus Dribbling and Positioning.',
                        ],
                    ],
                },
                {
                    p: 'Each Pokémon plays well in **up to 3 positions** (the ones close to its best rating). In its main position it gives 100%; in the others it plays well in, −2%.',
                },
                {
                    p: '**Out of position** loses 7% in the attributes for that slot. If the goal is involved (goalkeeper outfield or an outfield player in goal), it loses 25%.',
                },
                {
                    p: 'Special cases: **Onix** can always play in goal, and **Ditto** plays in any slot, because on the court it becomes a copy of the best Pokémon in that position.',
                },
            ],
        },
        cartas: {
            title: 'Cards, rating and editions',
            blocks: [
                {
                    p: 'The big number on the card is the **rating** in the main position. The color comes from the rating: **Bronze** up to 64, **Silver** from 65 to 74, **Gold** 75 or more.',
                },
                {
                    p: "The Pokémon's rarity (common, uncommon, rare, epic, legendary) only changes the finish: matte, shiny or the legendaries' own card.",
                },
                {
                    p: 'Hover the mouse (or hold your finger) on a card to see the summary; tap to open the full card with attributes, moves, Ability and bonuses.',
                },
                {
                    p: '**Special editions** give +{bonus} to every attribute and have their own look. Shiny goes on top of any of them (+1) and the MVP seal adds +1 per level (up to 3). No attribute goes past 99:',
                },
                {
                    list: [
                        ['Shiny', 'the alternate coloring, 1 in 64 cards.'],
                        [
                            'Icon',
                            "{iconCount} famous Pokémon with a title (Ash's Pikachu, Brock's Onix, Misty's Psyduck…). 1 in {iconOdds} when one of them shows up in the draft or in a reward.",
                        ],
                        ['Event', 'the type of the week: 1 in 8 cards of that type. Changes every week.'],
                        [
                            'Star Player',
                            "your team's best player in a win earns the MVP seal: a plain card becomes a Star Player; Icon and Event cards keep their edition and get the seal. With a rating of 8+ the seal levels up, up to MVP 3.",
                        ],
                    ],
                },
            ],
        },
        tipos: {
            title: 'Types and effectiveness',
            blocks: [
                {
                    p: "The series' type chart applies, but softened for futsal: type helps, but it doesn't win matches on its own.",
                },
                {
                    list: [
                        ["It's super effective!", '+12% (4× = +25%).'],
                        ["It's not very effective…", '−10% (¼ = −16%).'],
                        ["It doesn't affect…", '−20%. Never drops to zero.'],
                    ],
                },
                {
                    p: "It counts for moves, shots against the goalkeeper, 50-50 challenges (the attacker's best type against the defender's) and even penalties. Tinted Lens and Adaptability boost the effect.",
                },
                { p: 'The few Fairy-type Pokémon get **Charm**: +8% to everything.' },
            ],
        },
        golpes: {
            title: 'Moves',
            blocks: [
                {
                    p: "Each Pokémon brings up to 4 moves: the species' signature move, one of its own type, one for coverage and one utility move. On the court, the Pokémon uses its moves on its own, at the right moment of the play.",
                },
                {
                    p: 'Each move has **1 use per match** (high-PP moves, 2) and the same Pokémon has to wait a little between one move and the next.',
                },
                {
                    list: [
                        ['Physical', 'with the ball it becomes a power shot; without it, a hard slide tackle.'],
                        ['Special', 'a long-range finish or a placed shot.'],
                        ['Burst', 'priority or Speed moves: dashes across the court.'],
                        ['Boost', 'raises attributes for a while (Swords Dance, Agility…).'],
                        ['Weaken', 'lowers an attribute of the nearest rival.'],
                        ['Status', 'paralyzes, puts to sleep, poisons or confuses the rival.'],
                        ['Heal', 'restores stamina.'],
                        [
                            'Specials',
                            'their own effect: Counter returns the hit, Substitute creates a decoy, Teleport escapes the marker, Metronome picks a random move, Leech Seed drains stamina and so on.',
                        ],
                    ],
                },
                {
                    list: [
                        [
                            'Trap',
                            'Bind, Wrap, Clamp and Fire Spin stun the target for a moment and slow it down; Constrict only slows. Each also has its own twist (see the Movedex).',
                        ],
                        [
                            'One-hit KO',
                            'Fissure, Guillotine and Horn Drill miss a lot, but when they hit they knock the rival down.',
                        ],
                        [
                            'With a price',
                            'Explosion and Self-Destruct blow up and leave the user on the floor; Hyper Beam must recharge; Double-Edge, Take Down and Submission tire the user; Thrash and Petal Dance may cause confusion; Jump Kick and High Jump Kick hurt if they miss.',
                        ],
                        ['Drain', "Absorb, Mega Drain, Leech Life and Dream Eater drain the target's stamina."],
                        [
                            'Extra effect',
                            'boosted compared to the games: Thunderbolt paralyzes, Flamethrower burns, Bite makes the target flinch…',
                        ],
                    ],
                },
                { p: "And yes: Magikarp's Splash is just Splash. But nothing happened! The fun is evolving." },
            ],
        },
        status: {
            title: 'Status conditions',
            blocks: [
                {
                    list: [
                        ['Paralyzed', 'Pace −40% and Dribbling −15%.'],
                        ['Asleep', 'out of the play for a moment.'],
                        ['Frozen', 'stands still for a moment.'],
                        ['Poisoned', 'slowly loses stamina.'],
                        ['Burned', 'Shooting and Physical −20% and slowly loses stamina.'],
                        ['Confused', 'Passing −30% and Shooting −15%.'],
                        ['Infatuated', '(Cute Charm) freezes up for a moment.'],
                        ['Flinched', "(Bite, King's Rock…) loses the timing of the play."],
                    ],
                },
                {
                    p: 'Status conditions wear off on their own after a while. Abilities and items can prevent or shorten them (Limber, Insomnia, Lum Berry…).',
                },
            ],
        },
        sinergias: {
            title: 'Captain and synergies',
            blocks: [
                {
                    list: [
                        [
                            'Captain',
                            '+3% to everything for itself. Its aura gives +3% to the team and +6% to those who share a type with it. Only while the captain is on the court.',
                        ],
                        [
                            'Type synergy',
                            "2 starters of the same type get +3%; 3, +6%; 4, +8%; 5, +10%. Each player's best type synergy counts.",
                        ],
                        [
                            'Story synergy',
                            'famous Kanto duos and groups get a bonus together on the court and can pull off a **combo**: a pass from one, a shot from the other, 20% stronger and more accurate (once per half). **Special** ones (all 3 Legendary Birds, all 3 starters, Mew + Mewtwo) give more when complete and the cards glow together. Type + story add up to +15%.',
                        ],
                    ],
                },
                { dyn: 'links' },
                { p: 'All of this is recalculated after every substitution or evolution.' },
            ],
        },
        partida: {
            title: 'The match',
            blocks: [
                {
                    p: 'Two 20-minute halves (on the game clock). The match is **simulated**: the Pokémon play on their own and you coach from the touchline.',
                },
                { dyn: 'tactics' },
                {
                    p: '**Stamina:** drops with effort (less for high-HP Pokémon) and tired players perform worse. Half-time restores a little. The rival team may take off its most tired player at half-time.',
                },
                { p: '**Grit:** a team losing by 3 or more grows into the game. A comeback is always possible.' },
                {
                    p: "**Penalties:** a draw at the end goes to 5 kicks per team and then sudden death. The best shooters take them, and the kicker's type against the goalkeeper's counts.",
                },
                {
                    p: 'Left in the middle? The lineup stays locked and, when you come back, the same match picks up where it was.',
                },
            ],
        },
        golpeMax: {
            title: "The captain's max move",
            blocks: [
                {
                    p: 'Every captain has a **max move**, with 3 levels: **L1**, **L2** and **L3**. {maxWho}',
                },
                { p: '{maxFill}' },
                { dyn: 'maxLevels' },
                {
                    p: '**At the right time:** with an outfield captain, the button lights up when he has the ball near goal, and the move goes off right away. {maxTiming} Shortcut: M. **Wait** saves it for the next level.',
                },
                {
                    p: "**Keeper captain:** his move is the **big boot**. The button only lights up on a rival shot he is going to reach. On the tap, instead of saving, he sends it back: at L1 and L2 as a long ball up the pitch (L2 knocks down anyone in the way); at L3, straight at the rival's goal. Off the beat: the big boot still goes, just weaker.",
                },
                {
                    p: "The L1 status and the L3 effect come from the move's type, if it is one of the Pokémon's types (otherwise, its first type):",
                },
                { dyn: 'maxTypes' },
                { p: "Each Pokémon's full card has a **Max move** section with what it does at each level." },
            ],
        },
        evolucao: {
            title: 'Evolution on the court',
            blocks: [
                {
                    p: 'A Pokémon that plays far above normal for its position **evolves mid-match**, at the next dead ball.',
                },
                {
                    list: [
                        'The bar adds up everything it did: goals, assists, shots on target, saves, tackles, interceptions, passes and moves, weighted by position (so goalkeepers and Defenders evolve as often as Pivots).',
                        "A single goal isn't enough. It evolves at most once per match.",
                        "The evolution lasts for the rest of the cup. It learns the new form's moves and keeps its Ability if the new form also has it.",
                        'A move taught by TM stays after evolving (if the new form can learn it too).',
                        'Eevee becomes one of its three evolutions (always the same one for that card). Ditto does not evolve.',
                        'The rival can evolve during the match too!',
                    ],
                },
            ],
        },
    },
    faq: [
        {
            q: 'Did I lose my cup?',
            a: [
                {
                    p: "If you lost a match, yes: it's knockout, the cup ends there. Records, Pokédex and Movedex stay.",
                },
                {
                    p: 'If you just closed the game, no: the cup is saved and picks up where you left off (even the match in progress). The save is only lost if you clear the browser data without being signed in.',
                },
            ],
        },
        {
            q: 'How do I save on another device?',
            a: [
                { p: 'Sign in with Google on both devices. The save goes to the cloud and follows your account.' },
                {
                    p: 'When you sign in, the most recent save wins. Records, Pokédex and career keep the best of both. You can delete the account in Settings.',
                },
            ],
        },
        {
            q: 'Can I play offline?',
            a: [
                {
                    p: 'You need internet to open the game and load sprites and sounds. The match runs entirely on your device and the save stays in the browser, so a quick connection drop loses nothing.',
                },
            ],
        },
        {
            q: 'Why did my stronger team lose?',
            a: [
                {
                    p: 'On the court, attribute differences weigh less than on the card, on purpose: upsets happen. Type, stamina, tactics, moves and status conditions change the game.',
                },
            ],
        },
        {
            q: 'Is this official from Nintendo?',
            a: [
                {
                    p: 'No. It is a non-profit fan game, made by a fan: no ads, no donations, no purchases. Pokémon is a trademark of Nintendo, Game Freak and Creatures.',
                },
            ],
        },
        {
            q: 'I found a bug. Now what?',
            a: [
                { p: 'Tell us! Say what happened, on which screen and, if you can, send a screenshot.' },
                { link: 'Send feedback' },
            ],
        },
    ],
    gen: {
        tacticFeel: {
            balanced: 'the team plays a middle ground',
            offensive: 'high lines and more shots, but leaves space at the back',
            defensive: 'low block, attacks little',
            counter: 'the Pivot waits up front to lead the counter-attack',
        },
        tacticLine: '{feel}. {attrs}{drain}.',
        drainMore: '; tires faster ({pct})',
        drainLess: '; tires slower ({pct})',
        linkTerm: '{name} ({pct})',
        linkLine: '{desc} Combo: {combo}.',
        maxRow: [
            'shot with {pw} power and the type status on whoever blocks or saves it.',
            'shot with {pw} and it knocks down anyone in the way (the keeper does not fall).',
            'shot with {pw}, always on target, with the special scene and the type effect (12 Pokémon have their own signature).',
        ],
        maxTypeLine: 'L1 {st} whoever blocks or saves it · L3: {fx}.',
    },
    screen: {
        title: 'Help',
        tipsBack: 'Tips are back on screen.',
        tipsShow: 'Show the tips again',
        searchLabel: 'Search help',
        searchPlaceholder: 'Search: evolution, penalties, status…',
        nothing: 'Nothing found for “{query}”.',
        notFound: "Didn't find what you wanted?",
        askUs: 'Ask us',
        groups: {
            team: 'Building the team',
            match: 'The match',
        },
        faq: 'Frequently asked questions',
    },
    /** Leitor de tela: o carrossel de formações. */
    carousel: 'carousel',
    tip: {
        label: 'Tip:',
        close: 'Close tip',
    },
    coach: {
        skip: 'Skip',
        next: 'Next',
        done: 'Got it',
        count: '{n} of {total}',
        label: 'Tutorial tip',
        intro: ['First time? Start with the Lightning Cup: 4 games, about 10 minutes.', 'The rules live here.'],
        rota: [
            'Tap a lit node, then Go.',
            'The first match gives no card. After that, a loss is a yellow and the second one is red.',
            'Wins pay ₽ (a Match pays more). Spend it at the Market or save it to earn interest.',
        ],
        rotaGrupo: ['Losing here costs no card.'],
        rotaNova: ['New: Indigo Road, a long cup through the Kanto gyms.'],
        relampago: ['4-game knockout: lose and you are out. Pick a formation.'],
        relampagoDraft: ['Tap a slot: 3 show up and you keep 1.'],
        relampagoVestiario: ['Tap two to swap. The bracket opens from the rival poster.'],
        relampagoJogo: ['Change tactics and make subs. Busy players evolve.'],
        duelo: ['Join without an account. Then you create the room and send the link.'],
        dueloSala: [
            'Best of 3: same team in every game, lineup can change between them.',
            'Create the room and send the link to your friend.',
        ],
        dia: ['Same draft and same rivals for everyone today.', 'Only the first attempt counts for the ranking.'],
        liga: [
            'Winning raises your Elo, losing lowers it.',
            "You face another trainer's saved team. They don't need to be online.",
        ],
        golpe: ["Bar at L1: your captain's max move is unlocked.", 'Tap as the green circle closes.'],
        utRepetida: ["A duplicate doesn't join the Club: sell it or swap it for the one you have."],
        replay: {
            title: 'How it works',
            hint: 'The balloons come back the next time you enter the mode.',
            done: 'Will show again',
            intro: 'Stadium',
            rota: 'Indigo Road',
            rotaGrupo: 'Plateau',
            relampago: 'Lightning Cup',
            duelo: 'Duel',
            dia: 'Daily Cup',
            liga: 'League',
            golpe: 'Max move',
        },
    },
};
