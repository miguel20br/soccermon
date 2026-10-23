import type { ExplainMoveId } from '../../engine/moves';

/**
 * What each move does in futsal, in English (Portuguese source: MOVE_EXPLAIN in src/engine/moves.ts).
 * Same keys as the engine (a missing one is a compile error). Wording follows the official move effects,
 * adapted to the court.
 */
export const moveExplainEn: Record<ExplainMoveId, string> = {
    counter: 'Counter: the first time it takes a move or a slide tackle, it hits the attacker back (once per match).',
    haze: 'Haze: eliminates status conditions and stat changes of everyone nearby (both teams).',
    mist: "The team is shrouded in Mist: its stats can't be lowered for 12 seconds.",
    teleport: 'Vanishes and reappears elsewhere on the court: shakes off its marker.',
    mirrormove: 'Uses the last move the rival used.',
    mimic: 'Copies the last move the rival used and keeps it for the rest of the match.',
    metronome: 'Waggles a finger and uses a random move!',
    substitute: 'Puts in a substitute that takes the next move or slide tackle in its place (costs a little stamina).',
    leechseed: "Plants a seed on the rival: its stamina slowly drains to the user (Grass types can't be seeded).",
    bide: 'Stores energy for 3 s, then unleashes a wave that pushes and stuns everyone nearby: the more hits it took, the stronger.',
    rage: 'Rage for 15 s: Shooting and Physical go up, and every slide tackle or move it takes makes it even stronger (up to 3 times).',
    conversion: "Copies the nearest rival's type for 12 s (changes type matchups) and removes stat drops.",
    disable: 'Disables a move the nearest rival still had left to use.',
    roar: 'Roar: the nearest rival flees back to its own half and drops the ball.',
    whirlwind: 'A gust that pushes nearby rivals and blows a loose ball far away.',
    splash: "Flops and splashes: hard to tackle for a moment (and that's really all it does).",
    transform:
        'Becomes a copy of the nearest rival: takes its better attributes for 12 seconds. (Ditto already starts transformed by its Imposter ability.)',
    // F1 area
    acid: 'With the ball: a placed shot. Without it: sprays acid on every rival within 4 m.',
    blizzard:
        'With the ball: a placed shot that may freeze the keeper. Without it: a blizzard on every rival within 4 m, which may freeze them.',
    bubble: 'With the ball: a placed shot. Without it: bubbles on every rival within 4 m (may slow them down).',
    growl: 'Area growl: lowers the Shooting and Physical of every rival within 4 m.',
    leer: 'Area leer: rivals within 4 m freeze for a moment and tackle worse.',
    tailwhip: 'Area tail wag: lowers the Tackling and Physical of every rival within 4 m.',
    screech: 'Area screech: sharply lowers the Tackling and Physical of rivals within 4 m.',
    stringshot: 'Area string: every rival within 4 m slows down.',
    poisongas: 'A cloud of gas: tries to poison every rival within 3 m.',
    rockslide: 'With the ball: a power shot. Without it: rocks rain on every rival within 4 m, which may flinch.',
    rollingkick: 'With the ball: a power shot. Without it: a spinning kick that knocks down everyone within 2 m.',
    earthquake:
        'With the ball: a huge power shot. Without it: a 4 m tremor that knocks down EVERYONE around, teammates too.',
    surf: 'With the ball: a placed shot. Without it: a wave that pushes everyone within 4 m, teammates too.',
    swift: "Stars that never miss: outfield players can't block the shot (only the keeper). Without the ball, hits every rival within 4 m.",
    razorleaf: 'Sharp leaves: a shot with a high critical-hit ratio. Without the ball, cuts every rival within 4 m.',
    razorwind:
        'Charges for 0.6 s standing still, then lets loose blades of wind: a shot that crits easily, or every rival within 4 m without the ball. If tackled while charging, the move is lost.',
    // F2 critical hits
    slash: 'A slash with a high critical-hit ratio: the shot comes out harder and more accurate; a critical slide tackle wins outright.',
    karatechop:
        'A karate chop with a high critical-hit ratio: harder, more accurate shot; a critical slide tackle wins outright.',
    crabhammer: 'A hammer blow with a high critical-hit ratio: a huge shot; a critical slide tackle wins outright.',
    skyattack:
        'Glows for 0.6 s while charging, then fires the strongest shot in the game, with a high critical-hit ratio. If tackled while charging, the move is lost.',
    focusenergy:
        'Gets pumped: the next shot or slide tackle is a guaranteed critical hit (sometimes it fails, like the buggy Gen 1 Focus Energy).',
    // F3 charge
    solarbeam:
        'Takes in sunlight for 0.6 s standing still, then fires the strongest shot in the game. If tackled while charging, the move is lost.',
    skullbash: 'Lowers its head for 0.6 s (nobody can take the ball off it meanwhile), then unleashes a huge header.',
    hyperbeam: "A huge beam, but it must recharge afterwards. If it scores, it doesn't recharge (just like Gen 1).",
    // F4 vanish
    fly: 'Flies up high for 0.8 s (nobody can reach it): with the ball, goes over the marking and shoots; without it, swoops on the ball carrier and pounces.',
    dig: 'Digs a hole for 0.8 s (nobody can reach it): with the ball, pops up further ahead and shoots; without it, bursts out under the ball carrier and pounces.',
    // F5 priority
    quickattack:
        'Always strikes first: without the ball, lunges 2 m and tackles at once, no waiting; with the ball, a burst and a first-time shot or pass.',
    agility: 'A long burst: much faster for 5 seconds.',
    // F6 accuracy
    drillpeck: 'A drill: a power shot that goes through the first block in its way.',
    cut: 'A cut: a shot that goes through the first block; its slide tackle keeps full strength from behind.',
    eggbomb: "A lob: the ball goes over the blocks and the keeper reaches less of it (but it's inaccurate).",
    sandattack: "Sand in the eyes: the nearest rival's accuracy falls (shots and passes go wide) for 6 s.",
    kinesis: "Bends a spoon: the nearest rival's next shot goes way off target.",
    flash: 'A blinding flash: every rival within 7 m shoots and passes wide for 5 s.',
    smokescreen: 'A smokescreen on the ground (3 m, 5 s): shots and passes from inside it go wide, for both teams.',
    // F7 fixed damage
    sonicboom:
        "Fixed damage: a shot at a fixed speed (doesn't depend on attributes or type). Without the ball, a boom that stuns the rival for a fixed time (Ghost types are immune).",
    dragonrage:
        'Fixed damage: a shot at a high fixed speed, with no type advantage for the keeper. Without the ball, stuns the rival for a fixed time.',
    nightshade:
        "Fixed damage: a shot at a fixed speed that ignores the keeper's type. Without the ball, stuns for a fixed time and even hits Normal types.",
    seismictoss:
        'A throw: in a slide tackle, hurls the rival 3 m and leaves it down for 1 s, regardless of Physical. With the ball, a shot at a fixed speed.',
    psywave: 'A psychic wave of random strength: it may come out a rocket or a dud.',
    superfang: "Fangs: a slide tackle that connects cuts the rival's stamina in half.",
    lowkick: 'A low kick: the heavier the rival, the longer it stays down (a Snorlax stays down about 2 s).',
    // F8 multi-hit and reach
    doublekick: 'Kicks twice: without the ball, two tackle attempts in a row.',
    twineedle: 'Stings twice: two tackle attempts, each of which may poison.',
    bonemerang:
        'A boomerang: a long-range tackle (2.8 m), two attempts; if its shot is parried or blocked, it comes back to its feet.',
    furyattack: 'Hits 2 to 5 times: tackle attempts in a row (each one weaker).',
    furyswipes: 'Scratches 2 to 5 times: tackle attempts in a row (each one weaker).',
    doubleslap: 'Slaps 2 to 5 times: tackle attempts in a row (each one weaker).',
    cometpunch: 'Punches 2 to 5 times: tackle attempts in a row (each one weaker).',
    barrage: 'Hits 2 to 5 times as tackle attempts; its shot may come back to its feet if saved.',
    pinmissile: 'Hits 2 to 5 times as tackle attempts; its shot may come back to its feet if saved.',
    spikecannon: 'Hits 2 to 5 times as tackle attempts; its shot may come back to its feet if saved.',
    vinewhip: 'A whip: a long-range tackle (2.8 m).',
    slam: 'Slams with a tail or vine: with the ball, a power shot; without it, a long-range tackle (2.8 m).',
    boneclub: 'Bone in hand: a long-range tackle (2.8 m) that can make the rival flinch.',
    rockthrow: 'A thrown rock: a long-range tackle (2.8 m).',
    // F9 trapping
    wrap: 'Wraps from range (2.8 m): the ball carrier and the user are both stuck for 1.2 s and the ball runs loose.',
    bind: 'Binds from range (2.8 m): the ball carrier and the user are both stuck for 1.2 s and the ball runs loose.',
    clamp: 'Clamps shut: steals the ball and nobody can take it off it for 1 s.',
    firespin: 'A ring of fire on the ground (2 m, 4 s): burns and slows down any rival who passes.',
    constrict: 'Squeezes: the rival slows down for 2 s.',
    // F10 growing counter
    toxic: 'Badly poisons: stamina drains faster and faster (up to 3x) for 12 s.',
    // F11 evasion and walls
    doubleteam: 'Two clones: the next 2 slide tackles or moves on it hit a clone.',
    minimize: 'Shrinks for 4 s: very hard to tackle (Stomp ignores it).',
    acidarmor: 'Melts: for 3 s slide tackles slip right through it.',
    withdraw: 'Withdraws into its shell for 1.5 s: nobody can take the ball off it, but it moves slowly.',
    defensecurl: "Curls up: the next slide tackle it takes doesn't win the ball.",
    harden: "Hardens: the next slide tackle it takes doesn't win the ball.",
    lightscreen: 'Light Screen: for 15 s, special and status moves against your team are halved.',
    reflect: 'Reflect: for 15 s, slide tackles against your team are 30% weaker.',
    barrier: 'An invisible wall in front of it for 3 s: blocks the next shot that passes close.',
    stomp: 'A stomp: with the ball, a power shot; without it, a tackle that may cause flinching and ignores anyone who used Minimize.',
    // F12 field control
    gust: 'With the ball: a placed shot. Without it: a gust that pushes the rival and blows a loose ball far away.',
    strength: 'A bulldozer slide tackle: when it wins the challenge, it pushes the rival 2.5 m.',
    softboiled: 'Restores its own stamina and that of the most tired teammate within 8 m.',
    dreameater:
        'With the ball: a placed shot. Without it: drains the stamina of the nearest rival; if someone is asleep, eats their dream and drains twice as much.',
    payday: 'Coins scattered everywhere: with the ball, a shot; without it, rivals within 3 m stop for a moment to look.',
};
