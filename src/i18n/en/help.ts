import type { help as pt } from '../pt/help';

/** Help ("How to play"), tips and the welcome walkthrough. */
export const help: typeof pt = {
    sections: {
        basico: {
            title: 'The basics',
            blocks: [
                {
                    p: 'Soccermon is a roguelike draft with the **151 Kanto Pokémon** playing **5-a-side futsal**. Each cup is a run: you build your team, face 4 knockout matches and try to lift the trophy.',
                },
                {
                    list: [
                        ['Draft', 'pick a formation, a captain and then 1 of 3 Pokémon for each slot.'],
                        ['Lineup', 'set your starters, bench, items and tactic before each match.'],
                        ['Match', "it's simulated. You're the coach: tactics, substitutions and lots of cheering."],
                        ['Cup', '{stages}. Lose and the cup is over (but your Pokédex and records stay).'],
                    ],
                },
            ],
        },
        draft: {
            title: 'Draft',
            blocks: [
                { p: 'There are **{picks} picks**: 5 starters + {bench} subs.' },
                {
                    list: [
                        ['1. Formation', 'sets the slots on the court (you can change it later, in the lineup).'],
                        [
                            '2. Captain',
                            '3 rare, epic or legendary candidates show up, from any position. Pick one and tap the slot where it will play (the number on the slot is its rating there).',
                        ],
                        [
                            '3. The other slots',
                            'tap a free slot on the court or on the bench: 3 Pokémon that play that position show up (anyone goes on the bench). You take 1.',
                        ],
                    ],
                },
                {
                    list: [
                        'The 3 options never repeat a Pokémon you already have and always include at least 2 different types.',
                        'Rarity improves as the draft goes on. The Pivot slot (the rarest position) leans a bit higher.',
                        'Each option tells you if it is a **natural** in that position, if it **also plays** there or if it would be **out of position**, and whether it activates a story synergy.',
                    ],
                },
                {
                    p: '**Reroll:** swaps the 3 options. You start with {rerolls}, and they last the whole cup: they work in the draft and in the rewards. Skipping a reward gives +1.',
                },
            ],
        },
        formacoes: {
            title: 'Formations',
            blocks: [
                {
                    p: 'All of them have a goalkeeper + 4 outfield players. The formation changes the draft slots and how the team lines up on the court.',
                },
                { dyn: 'formations' },
            ],
        },
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
                    p: "**Special editions** give +{bonus} to every attribute (they don't stack) and have their own look:",
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
                            "your team's best player in the match becomes a Star Player card (if it has no edition yet).",
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
                            'Bind, Wrap, Clamp and Fire Spin stun the target for a moment and slow it down; Constrict only slows. Each also has its own twist (see "Moves that do what they did in the games").',
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
        golpesJogos: {
            title: 'Moves that do what they did in the games',
            blocks: [
                {
                    p: 'Many moves got back the way they worked in Gen 1, adapted to the court. The full card and the Movedex explain each one.',
                },
                {
                    list: [
                        [
                            'Area',
                            'Earthquake, Surf, Blizzard, Rock Slide, Growl, Leer… hit every rival around (Earthquake and Surf hit teammates too). Whoever has the ball and gets hit loses it.',
                        ],
                        [
                            'Critical hits',
                            'Slash, Karate Chop, Razor Leaf, Crabhammer: a harder, more accurate shot, and a critical slide tackle wins outright. **Focus Energy** guarantees the next critical hit (and sometimes fails, like the Gen 1 bug).',
                        ],
                        [
                            'Charge',
                            'Solar Beam, Skull Bash, Sky Attack, Razor Wind: stop for a moment to charge and come out stronger. Tackled while charging, the move is lost. A Hyper Beam that scores needs no recharge.',
                        ],
                        [
                            'Fly and Dig',
                            'vanish for a moment (nobody can reach them): with the ball, they move forward and shoot; without it, they land on the ball carrier.',
                        ],
                        [
                            'Priority',
                            'Quick Attack tackles at once, no waiting; with the ball, a burst and a first-time shot. Agility lasts longer.',
                        ],
                        [
                            'Accuracy',
                            "Swift never misses and outfield players can't block it; Drill Peck and Cut go through the block; Egg Bomb goes over it. Sand Attack, Kinesis, Flash and Smokescreen throw the rival's aim off.",
                        ],
                        [
                            'Fixed damage',
                            "Sonic Boom, Dragon Rage, Night Shade, Seismic Toss: a shot at a fixed speed that doesn't depend on attributes or type. Super Fang cuts stamina in half; Low Kick floors heavy Pokémon for longer.",
                        ],
                        [
                            'Multi-hit',
                            'Double Kick, Fury Swipes, Double Slap, Pin Missile…: 2 to 5 tackle attempts in a row. Bonemerang, Barrage and friends can bring the ball back to the shooter.',
                        ],
                        [
                            'Trapping',
                            'Wrap and Bind trap both Pokémon and the ball runs loose; Clamp steals and holds on; Fire Spin leaves a ring of fire on the ground; Constrict slows down.',
                        ],
                        [
                            'Toxic, Rage and Bide',
                            'Toxic gets worse over time; Rage grows with every hit taken; Bide stores energy and then unleashes it on everyone nearby.',
                        ],
                        [
                            'Clones and walls',
                            'Double Team makes clones that take the next hits; Minimize, Acid Armor, Withdraw and Defense Curl protect the ball; Barrier puts up a wall that stops a shot.',
                        ],
                        [
                            'Field control',
                            "Roar makes the rival flee and drop the ball; Whirlwind and Gust blow the ball away; Strength shoves; Conversion copies the rival's type; Soft-Boiled heals a teammate; Pay Day makes everyone stop to look at the coins.",
                        ],
                    ],
                },
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
        habilidades: {
            title: 'Abilities',
            blocks: [
                {
                    p: 'Many Abilities became futsal passives (the full card shows the effect). Some examples:',
                },
                {
                    list: [
                        ['Speed', 'Swift Swim, Chlorophyll, Run Away, Quick Feet.'],
                        [
                            'Attack',
                            'Hustle (Shooting +10%, Passing −5%), Sniper, Iron Fist, Technician (weak moves +50%).',
                        ],
                        [
                            'Final stretch',
                            'Overgrow, Blaze, Torrent and Swarm: +10% Shooting and Dribbling on low stamina.',
                        ],
                        [
                            'Aura',
                            'Intimidate (nearby rivals shoot worse), Unnerve, Stench, Pressure (nearby rivals tire faster).',
                        ],
                        [
                            'Contact',
                            'Static, Poison Point, Flame Body, Effect Spore and Cute Charm: whoever tackles may end up with a status condition.',
                        ],
                        ['Hit back', 'Anger Point, Defiant, Justified, Steadfast: get stronger when tackled.'],
                        ['With status', 'Guts and Marvel Scale get stronger when they have a status condition.'],
                        ['Stamina', 'Regenerator, Rain Dish, Ice Body and others restore stamina during the match.'],
                        ['Imposter', 'Ditto becomes the best Pokémon in its position on the court.'],
                    ],
                },
            ],
        },
        itens: {
            title: 'Items',
            blocks: [
                {
                    p: 'Each Pokémon holds **1 item**. They come from cup rewards, and in the lineup you can pass an item from one Pokémon to another (tap the player and use "Give to").',
                },
                { dyn: 'items' },
                { p: '**Type items** ({typeItems}): moves of that type become 20% stronger.' },
                { p: 'From the semi-final on, opponents also take the court holding items.' },
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
                            "2 starters of the same type get +3%; 3 or more, +6%. Each player's best synergy counts (they don't stack).",
                        ],
                        [
                            'Story synergy',
                            'famous Kanto duos and groups get a bonus together on the court and can pull off a **combo**: a pass from one, a shot from the other, 20% stronger and more accurate (once per half).',
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
                {
                    list: [
                        ['Speed', '1x, 2x, 4x, 8x or Highlights (only the best moments). Or skip to the end.'],
                        ['Tactic', 'up to 3 changes per match (see below).'],
                        [
                            'Substitute',
                            'choose who comes off and who comes on. The swap happens at the next dead ball (kick-off, goal kick or half-time). Nothing on your team is automatic.',
                        ],
                        [
                            'Panel',
                            'tap a Pokémon on the court (or in the team list) to see its stamina, evolution bar, current attributes, match numbers and moves.',
                        ],
                    ],
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
        copa: {
            title: 'The Cup',
            blocks: [
                {
                    p: '{stages}, always knockout. The first 3 opponents are randomly drawn Kanto Gyms; the final is always against the **{league}**. The difficulty rises each round.',
                },
                { dyn: 'gyms' },
                {
                    p: "Before each match you can see the opponent's cards in the lineup. Lose and the cup is over. Win the final: champion! Winning without conceding a goal in any match is a **perfect cup**.",
                },
            ],
        },
        recompensas: {
            title: 'Rewards',
            blocks: [
                { p: 'After each win (except the final) you pick **1 of 3**:' },
                {
                    list: [
                        [
                            'Sign',
                            "one of the best Pokémon from the team you just knocked out (without its item). If there's nobody new for you, a random reinforcement comes instead.",
                        ],
                        ['2 items', "type items tend to lean toward your team's types."],
                        [
                            'Gym TM',
                            'in {tmOdds}% of wins, one of the items becomes the TM the leader gave out in Gen 1 (Brock: Bide, Misty: BubbleBeam, Lt. Surge: Thunderbolt, Erika: Mega Drain, Koga: Toxic, Sabrina: Psywave, Blaine: Fire Blast, Giovanni: Fissure). If nobody on your team can learn it, you get a rare move that no Pokémon carries by default.',
                        ],
                    ],
                },
                {
                    list: [
                        'The new Pokémon comes in **in place of a sub** (never the captain) and inherits the item of whoever left.',
                        'The item goes to any player; if it already had one, the old item is replaced (and lost).',
                        'Rerolling costs 1 reroll. **Skip** takes nothing, but gives +1 reroll.',
                    ],
                },
                {
                    list: [
                        'TM: you pick who learns it (only Pokémon that learn the move in the games) and which move it forgets. The signature move is never forgotten.',
                        'A taught move stays after evolving (if the new form can learn it too).',
                        "Rival gyms also take the court with their leader's TM (up to 2 Pokémon per team).",
                    ],
                },
            ],
        },
        recordes: {
            title: 'Records and challenges',
            blocks: [
                {
                    p: 'The start screen keeps your records: cups played, titles, perfect cups, Star Player cards, evolutions and Icons.',
                },
                {
                    p: '**Challenge:** each cup has a seed. When you share, a link with ?seed= at the end goes along: whoever opens it plays the same cup, with the same opponents and the same draws. Who gets further?',
                },
            ],
        },
        pokedex: {
            title: 'Pokédex, Movedex and Profile',
            blocks: [
                {
                    list: [
                        [
                            'Pokédex',
                            '**seen** = showed up in your draft, in rewards or on a rival team. **Played** = took the court for your team for at least 1 minute. It keeps matches, titles and the highest rating of each one.',
                        ],
                        ['Movedex', 'moves are added when they appear on the court in your matches (from both teams).'],
                        ['Profile', "your club's name, tag and color, your avatar and your coaching career numbers."],
                    ],
                },
            ],
        },
        conta: {
            title: 'Account and cloud',
            blocks: [
                {
                    p: 'Without an account, everything is saved **in this browser, on this device**. Tap **Sign in with Google** on the start screen to keep your save in the cloud and continue on another device.',
                },
                {
                    list: [
                        'When you sign in, the most recent save wins (the device one or the cloud one).',
                        'Records, Pokédex, Movedex and career merge the best of both: no progress is lost.',
                        'You can delete your account and cloud save in Settings.',
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
            a: [{ p: 'Sign in with Google on both devices. The save goes to the cloud and follows your account.' }],
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
        formationLine: '{positions} (plus the goalkeeper). {description}',
        linkTerm: '{name} ({pct})',
        linkLine: '{desc} Combo: {combo}.',
        gymLine: '{types} type, {formation}, {tactic}.',
    },
    screen: {
        title: 'Help',
        replay: 'Show the walkthrough again',
        tipsBack: 'Tips are back on screen',
        tipsShow: 'Show the tips again',
        searchLabel: 'Search help',
        searchPlaceholder: 'Search: evolution, penalties, items…',
        nothing: 'Nothing found for “{query}”.',
        notFound: "Didn't find what you wanted?",
        askUs: 'Ask us',
        faq: 'Frequently asked questions',
    },
    tip: {
        label: 'Tip:',
        close: 'Close tip',
    },
    onboarding: {
        count: 'How to play · {n}/{total}',
        skip: 'Skip',
        carousel: 'carousel',
        step: 'step',
        stepOf: '{n} of {total}',
        goToStep: 'Go to step {n}: {title}',
        prev: 'Previous',
        next: 'Next',
        go: "Let's play",
        welcomeTitle: 'Welcome to Soccermon',
        welcomeText:
            'The **151 of Kanto** in 5-a-side futsal. Build your team, coach from the touchline and win the cup.',
        draftTitle: 'Draft: 1 of 3',
        draftText:
            "Pick a formation and a captain. Then tap a slot: 3 Pokémon show up for it and you take 1. Don't like them? **Reroll**.",
        lineupTitle: 'Lineup and tactics',
        lineupText:
            'Tap two players to swap their slots, bench included. Same type and famous duos give **synergy**; items help too.',
        coachTitle: "You're the coach",
        coachText:
            'The match is simulated. Change the tactic, make substitutions and tap a Pokémon to see its panel. Moves fire off on the court and whoever plays great **evolves mid-match**!',
        tactic: 'Tactic',
        sub: 'Substitute',
        cupTitle: 'The Cup',
        cupText:
            "Round of 16, quarters, semi and final against Kanto's Gyms and the Indigo League. Won? Pick a **reinforcement** (you can sign one from the rival), an item or the **Gym TM**. A draw goes to penalties.",
        cupPath: ['R16', 'QF', 'SF', 'Final'],
        dexTitle: 'Pokédex and account',
        dexText:
            'Whoever you see and field goes into the Pokédex; the moves you see, into the Movedex. **Sign in with Google** to save in the cloud and play on another device.',
    },
};
