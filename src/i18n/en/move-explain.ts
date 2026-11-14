import type { ExplainMoveId } from '../../engine/moves';

/**
 * What each move does in futsal, in English (Portuguese source: MOVE_EXPLAIN in src/engine/moves.ts).
 * Same keys as the engine (a missing one is a compile error). Wording follows the official move effects,
 * adapted to the court.
 */
export const moveExplainEn: Record<ExplainMoveId, string> = {
    counter:
        'Counter: the first time it takes a move or a slide tackle, it blocks it and stuns the attacker for 0.9 s (once per match).',
    haze: 'Haze: eliminates status conditions, stat changes and Leech Seed of everyone within 6 m (both teams).',
    mist: "For 12 seconds, moves that only lower stats (Growl, Leer...) don't affect the team.",
    teleport:
        'Vanishes and reappears 8 m ahead if its team has the ball (8 m back if not), in a random lane of the court.',
    mirrormove: 'Uses the last move the rival team used.',
    mimic: 'Copies the last move the rival team used and keeps it for the rest of the match.',
    metronome: 'Waggles a finger and uses a random move!',
    substitute:
        'Puts in a substitute that takes the next move or slide tackle in its place, for up to 15 s (costs 8% stamina).',
    leechseed:
        "Plants a seed on the nearest rival (within 6 m): for 12 s, 1.2% of its stamina per second goes to the user (Grass types can't be seeded).",
    bide: 'Holds on for 3 s (+30% Physical) counting the hits it takes, then pushes and stuns rivals within 3.5 m: the more hits, the stronger (up to 3).',
    rage: 'Rage for 15 s: +10% Shooting and Physical, and every slide tackle or move it takes adds another 5% (up to 3 times).',
    conversion:
        "Copies the nearest rival's type for 12 s (changes type matchups), removes stat drops and gives +8% Pace, Dribbling, Shooting, Passing and Defending for 10 s.",
    disable: 'Disables the strongest move the nearest rival (within 6 m) still has left to use.',
    roar: 'Roar: the nearest rival (within 5 m) runs back toward its own half for 1.6 s and drops the ball.',
    whirlwind: 'A gust: pushes rivals within 4.5 m back 2.8 m and blows a loose ball within 7 m far away.',
    splash: "Flops and splashes: 30% harder to tackle for 1.5 s (and that's really all it does).",
    transform:
        'Becomes a copy of the nearest rival: takes its better attributes for 12 seconds. (Ditto already starts transformed by its Imposter ability.)',
    // F1 area
    acid: 'With the ball: a placed shot. Without it: pushes and stuns every rival within 4 m.',
    blizzard:
        'With the ball: a placed shot that may freeze the keeper. Without it: pushes and stuns every rival within 4 m, which may freeze them.',
    bubble: 'With the ball: a placed shot. Without it: pushes and stuns every rival within 4 m (may slow them down).',
    growl: 'Area growl: lowers the Shooting and Physical of every rival within 4 m.',
    leer: 'Area leer: rivals within 4 m freeze for 0.3 s and lose 8% Tackling and Physical for 10 s.',
    tailwhip: 'Area tail wag: lowers the Tackling and Physical of every rival within 4 m.',
    screech: 'Area screech: lowers the Tackling and Physical of rivals within 4 m by 16% for 10 s.',
    stringshot: 'Area string: every rival within 4 m slows down.',
    poisongas: 'A cloud of gas: tries to poison every rival within 3 m.',
    rockslide: 'With the ball: a power shot. Without it: pushes and stuns every rival within 4 m, which may flinch.',
    rollingkick: 'With the ball: a power shot. Without it: a spinning kick that knocks down every rival within 2 m.',
    earthquake:
        'With the ball: a huge power shot. Without it: a 4 m tremor that knocks down EVERYONE around, teammates too.',
    surf: 'With the ball: a placed shot. Without it: a wave that pushes everyone within 4 m, teammates too.',
    swift: "Stars that never miss: outfield players can't block the shot (only the keeper). Without the ball, hits every rival within 4 m.",
    razorleaf:
        'Sharp leaves: a shot with a 20% to 35% critical-hit chance. Without the ball, hits every rival within 4 m.',
    razorwind:
        'Charges for 0.6 s standing still and comes out stronger: a shot with a 20% to 35% critical-hit chance or, without the ball, hits every rival within 4 m. If tackled while charging, the move is lost.',
    // F2 critical hits
    slash: 'A slash with a 20% to 35% critical-hit chance: a critical shot is 25% faster and more accurate; a critical slide tackle wins outright.',
    karatechop:
        'A karate chop with a 20% to 35% critical-hit chance: a critical shot is 25% faster and more accurate; a critical slide tackle wins outright.',
    crabhammer:
        'A hammer blow with a 20% to 35% critical-hit chance: a huge shot, 25% faster on a critical; a critical slide tackle wins outright.',
    skyattack:
        'Glows for 0.6 s while charging, then fires the strongest shot in the game, with a 20% to 35% critical-hit chance. If tackled while charging, the move is lost.',
    focusenergy:
        'Gets pumped: the next shot or slide tackle is a guaranteed critical hit (fails 1 time in 16, like the buggy Gen 1 Focus Energy).',
    // F3 charge
    solarbeam:
        'Charges for 0.6 s standing still, then fires a strong and very accurate placed shot. If tackled while charging, the move is lost.',
    skullbash: 'Lowers its head for 0.6 s (nobody can take the ball off it meanwhile), then unleashes a huge header.',
    hyperbeam:
        "A huge shot (without the ball, hits the nearest rival), but then it stands still for 0.9 s to recharge. If it scores, it doesn't recharge (just like Gen 1).",
    // F4 vanish
    fly: 'Flies up high for 0.8 s (nobody can reach it): with the ball, moves 2 m forward and shoots; without it, lands on the ball carrier (within 8 m) and tries to tackle.',
    dig: 'Digs a hole for 0.8 s (nobody can reach it): with the ball, pops up 2 m ahead and shoots; without it, bursts out under the ball carrier (within 8 m) and tries to tackle.',
    // F5 priority
    quickattack:
        'Always strikes first: without the ball, lunges 2 m and tackles at once, no waiting; with the ball, a burst and a first-time shot or pass.',
    agility: 'A long burst: +28% Pace and +10% Dribbling for 5 seconds.',
    // F6 accuracy
    drillpeck: 'A drill: a power shot that goes through the first block in its way.',
    cut: 'A cut: a shot that goes through the first block; its slide tackle keeps full strength from behind.',
    eggbomb:
        'A lob: the ball goes over the blocks and the keeper reaches 20% less (but the move misses 25% of the time).',
    sandattack:
        "Sand in the eyes: the nearest rival's (within 6 m) shots and passes go twice as far off target for 6 s.",
    kinesis:
        "Bends a spoon: the nearest rival's (within 6 m) next shot in the next 10 s goes 2.5 times further off target.",
    flash: 'A blinding flash: every rival within 7 m misses 60% more on shots and passes for 5 s.',
    smokescreen:
        'A smokescreen on the ground (3 m, 5 s) on the nearest rival: shots and passes from inside it miss 80% more, for both teams.',
    // F7 fixed damage
    sonicboom:
        "Fixed damage: a shot always at 20 m/s (doesn't depend on attributes or type). Without the ball, stuns the nearest rival for 0.6 s (Ghost types are immune).",
    dragonrage:
        'Fixed damage: a shot always at 24 m/s, with no type advantage for the keeper. Without the ball, stuns the nearest rival for 0.8 s.',
    nightshade:
        "Fixed damage: a shot always at 23 m/s that ignores the keeper's type. Without the ball, stuns the nearest rival for 0.8 s and even hits Normal types.",
    seismictoss:
        'A throw: in a slide tackle, hurls the rival 3 m and leaves it down for 1 s, regardless of Physical. With the ball, a shot always at 22 m/s.',
    psywave:
        'Random strength between 50% and 150% of normal: with the ball, a shot; without it, pushes and stuns the nearest rival.',
    superfang: "Fangs: a slide tackle that connects cuts the rival's stamina in half.",
    lowkick: 'A low kick: the heavier the rival, the longer it stays down (a Snorlax stays down about 2 s).',
    // F8 multi-hit and reach
    doublekick: 'Kicks twice: without the ball, two tackle attempts in a row.',
    twineedle: 'Stings twice: two tackle attempts, each of which may poison.',
    bonemerang:
        'A boomerang: a long-range tackle (2.8 m), two attempts; if its shot is parried or blocked, it comes back to its feet.',
    furyattack: 'Hits 2 to 5 times: tackle attempts in a row (each one 15% weaker).',
    furyswipes: 'Scratches 2 to 5 times: tackle attempts in a row (each one 15% weaker).',
    doubleslap: 'Slaps 2 to 5 times: tackle attempts in a row (each one 15% weaker).',
    cometpunch: 'Punches 2 to 5 times: tackle attempts in a row (each one 15% weaker).',
    barrage:
        'Hits 2 to 5 times as tackle attempts; if its shot is saved or blocked, it comes back to its feet 50% of the time.',
    pinmissile:
        'Hits 2 to 5 times as tackle attempts; if its shot is saved or blocked, it comes back to its feet 50% of the time.',
    spikecannon:
        'Hits 2 to 5 times as tackle attempts; if its shot is saved or blocked, it comes back to its feet 50% of the time.',
    vinewhip: 'A whip: a long-range tackle (2.8 m).',
    slam: 'Slams with a tail or vine: with the ball, a power shot; without it, a long-range tackle (2.8 m).',
    boneclub: 'Bone in hand: a long-range tackle (2.8 m) that can make the rival flinch.',
    rockthrow: 'A thrown rock: a long-range tackle (2.8 m).',
    // F9 trapping
    wrap: 'Wraps from range (2.8 m): the ball carrier and the user are both stuck for 1.2 s and the ball runs loose.',
    bind: 'Binds from range (2.8 m): the ball carrier and the user are both stuck for 1.2 s and the ball runs loose.',
    clamp: 'Clamps shut: steals the ball and nobody can take it off it for 1 s.',
    firespin: 'A ring of fire on the ground (2 m, 4 s): any rival who passes is 25% slower and may be burned.',
    constrict: 'Squeezes: the rival is 40% slower for 2 s.',
    // F10 growing counter
    toxic: 'Badly poisons: the nearest rival loses stamina faster and faster (up to 3x) for 12 s.',
    // F11 evasion and walls
    doubleteam: 'Two clones for up to 15 s: the next 2 slide tackles or moves on it hit a clone.',
    minimize: 'Shrinks for 4 s: slide tackles on it are 40% weaker (Stomp ignores it).',
    acidarmor: 'Melts: for 3 s no slide tackle can take the ball off it.',
    withdraw: 'Withdraws into its shell for 1.5 s: nobody can take the ball off it, but it moves 40% slower.',
    defensecurl: "Curls up: the next slide tackle it takes doesn't win the ball.",
    harden: "Hardens: the next slide tackle it takes doesn't win the ball.",
    lightscreen:
        'Light Screen: for 15 s, special moves against your team are halved, and sleep, paralysis, poison and confusion moves have half the chance.',
    reflect: 'Reflect: for 15 s, slide tackles against your team are 30% weaker.',
    barrier: 'An invisible wall in front of it for 3 s: blocks the next shot that passes close.',
    stomp: 'A stomp: with the ball, a power shot; without it, a tackle that may cause flinching and ignores anyone who used Minimize.',
    // F12 field control
    gust: 'With the ball: a placed shot. Without it: a gust that pushes the rival and blows a loose ball far away.',
    strength: 'A bulldozer slide tackle: when it wins the challenge, it pushes the rival 2.5 m.',
    softboiled: 'Restores its own stamina and that of the most tired teammate within 8 m.',
    dreameater:
        'With the ball: a placed shot. Without it: drains the stamina of the nearest rival; if someone within 7 m is asleep, targets them and drains twice as much.',
    payday: 'Coins scattered everywhere: with the ball, a shot; without it, rivals within 3 m stand still for 0.4 s.',
};
