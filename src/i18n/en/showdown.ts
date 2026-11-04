import type { showdown as pt, ShowdownScript, ShowdownSolo } from '../pt/showdown';

/** Big boot duel lines (same shape as the PT file: `s` = shooter, `g` = keeper; the last line is the keeper's big boot). */
export const showdown: typeof pt = {
    tag: 'Big boot duel',
    goal: 'BIG BOOT!',
    goalSub: 'goal to goal',
    counter: 'COUNTER!',
    back: 'Sends back the L3',
    pairs: {
        '6-4': [
            ['s', 'Charmander? Seriously, it was you?'],
            ['g', 'Yep. You can take a picture.'],
            ['s', 'This stays between us, okay?'],
            ['g', 'Too late. Big boot!'],
        ],
        '4-6': [
            ['s', 'You stopped that facing backwards?'],
            ['g', 'I do everything backwards. Ask Ash.'],
            ['s', 'He complains about you a lot.'],
            ['g', 'Big boot!'],
        ],
        '9-7': [
            ['s', 'Two cannons and a Squirtle stopped me?'],
            ['g', 'It was the sunglasses. They help.'],
            ['s', "Those aren't even part of the kit."],
            ['g', 'Squirtle Squad!'],
        ],
        '7-9': [
            ['s', "Hey, you didn't even jump!"],
            ['g', 'With this shell? Not even trying.'],
            ['g', 'Cannon kick!'],
        ],
        '3-1': [
            ['s', "A Bulbasaur? Where's the rest of the garden?"],
            ['g', 'Still growing. Be patient.'],
            ['s', 'My shot had Solar Beam!'],
            ['g', 'So does mine. Big boot!'],
        ],
        '1-3': [
            ['s', 'You stopped it with the flower?'],
            ['g', 'The flower is just decoration.'],
            ['s', 'Heavy decoration.'],
            ['g', 'Big boot!'],
        ],
        '150-151': [
            ['s', "I'm an upgraded clone. Explain this."],
            ['g', 'Mew!'],
            ['s', 'That explains nothing.'],
            ['g', 'Meeew!'],
        ],
        '151-150': [
            ['s', 'Mew? Mew mew?'],
            ['g', 'I read your mind. It was just "mew".'],
            ['s', 'Mew!'],
            ['g', 'Big boot!'],
        ],
        '26-25': [
            ['s', "Pikachu? Where's your Thunder Stone?"],
            ['g', "Pika. I'm good like this."],
            ['s', "Remember Lt. Surge's gym?"],
            ['g', 'I do. I won. Pika... CHU!'],
        ],
        '25-26': [
            ['s', 'Pika? You stopped my Thunderbolt?'],
            ['g', 'Shocking a Raichu? That tickles.'],
            ['g', 'Rai... CHU!'],
        ],
        '130-129': [
            ['g', 'Splash.'],
            ['s', 'Splash does nothing! I know, I used it.'],
            ['g', 'SPLASH!'],
        ],
        '129-130': [
            ['s', 'Gyarados? Help me out, cousin!'],
            ['g', "Cousin? We don't even talk anymore."],
            ['s', 'Not since you evolved!'],
            ['g', 'Big boot!'],
        ],
        '107-106': [
            ['s', 'With your foot? How tacky.'],
            ['g', "It's football, bro. Feet."],
            ['s', "I'm a puncher. Why did I kick?"],
            ['g', 'High Jump Kick!'],
        ],
        '106-107': [
            ['s', 'Hitmonchan using his foot? Are you sick?'],
            ['g', 'Felt like it today.'],
            ['s', 'This is family betrayal.'],
            ['g', 'Mega Kick!'],
        ],
        '34-31': [
            ['s', 'Honey? You stopped my shot?'],
            ['g', "I did. We'll talk at home."],
            ['s', "I'm sleeping on the couch, right?"],
            ['g', 'You are. Big boot!'],
        ],
        '31-34': [
            ['s', 'In front of everyone, honey?'],
            ['g', 'Sorry. Work is work.'],
            ['g', 'Big boot!'],
        ],
        '94-65': [
            ['s', 'How did you see my ghost ball?'],
            ['g', "Saw it yesterday. I'm psychic."],
            ['s', "Hehehe... that's cheating."],
            ['g', 'Foreseen. Big boot!'],
        ],
        '65-94': [
            ['s', "I calculated everything. You weren't in it."],
            ['g', 'Hehehe. I was behind you.'],
            ['s', 'Since when?'],
            ['g', 'Boo!'],
        ],
        '68-66': [
            ['s', 'Four arms and a Machop stopped me?'],
            ['g', 'With my foot. My arms were busy.'],
            ['s', 'Busy doing what?'],
            ['g', 'Leg day!'],
        ],
        '66-68': [
            ['s', 'I practiced that shot a thousand times!'],
            ['g', 'Cute. I do four thousand.'],
            ['g', 'Take it, shorty!'],
        ],
        '6-9': [
            ['s', 'You again, Blastoise?'],
            ['g', 'The rival always picks the right type.'],
            ['s', "That's so unfair."],
            ['g', "It's on the chart. Big boot!"],
        ],
        '9-6': [
            ['s', 'Fire stopped water? That feels wrong.'],
            ['g', 'I never read the type chart.'],
            ['g', 'Fly, ball!'],
        ],
        '55-54': [
            ['s', 'Psyduck? You stopped that?'],
            ['g', 'Ow, my head... stopped what?'],
            ['s', 'I had that headache too.'],
            ['g', 'Psy... DUCK!'],
        ],
        '54-55': [
            ['s', 'Ow... my head. Did it go in?'],
            ['g', 'No. Is the headache gone?'],
            ['s', 'Worse.'],
            ['g', 'Sorry. Big boot!'],
        ],
        '80-79': [
            ['s', 'Slowpoke... you... stopped it?'],
            ['g', '.........'],
            ['s', "He doesn't even know yet."],
            ['g', '...big boot.'],
        ],
        '79-80': [
            ['s', '...'],
            ['g', "He's still kicking, folks."],
            ['s', '...did I kick?'],
            ['g', 'You did. Yesterday. Big boot!'],
        ],
        '25-52': [
            ['s', 'Pika! Team Rocket in goal?'],
            ['g', 'The ball is ours. Pikachu is next.'],
            ['s', 'Pika pika...'],
            ['g', "Meowth, that's right!"],
        ],
        '52-25': [
            ['s', 'Meow! It was the perfect plan!'],
            ['g', 'Pika pika.'],
            ['s', 'Team Rocket blasting off again...'],
            ['g', 'Pika... CHU!'],
        ],
        '39-143': [
            ['s', 'I sang and you stopped it?'],
            ['g', 'Zzz...'],
            ['s', 'He fell asleep before the song!'],
            ['g', 'Zzz... BIG BOOT... zzz'],
        ],
        '143-39': [
            ['s', "Zzz... huh? It didn't go in?"],
            ['g', 'Sleeping on the pitch? Marker face.'],
            ['g', 'Puff!'],
        ],
        '95-25': [
            ['s', 'Shocks do nothing to rock.'],
            ['g', "Pika. That's why it's a big boot."],
            ['g', 'Pika... CHU!'],
        ],
    } as Record<string, ShowdownScript>,
    up: [
        [
            ['s', 'You, of all Pokémon, {g}?'],
            ['g', 'Me. Surprise!'],
            ['g', 'Big boot!'],
        ],
        [
            ['s', 'I lost to my baby self?'],
            ['g', 'Your baby self trained harder.'],
            ['s', 'That was personal.'],
            ['g', 'Big boot!'],
        ],
        [
            ['s', 'I evolved for this?'],
            ['g', 'Apparently for nothing.'],
            ['g', 'Take that!'],
        ],
    ] as readonly ShowdownScript[],
    down: [
        [
            ['s', 'I was going to pass you someday.'],
            ['g', "Sit down, I'll teach you."],
            ['g', 'Here it comes!'],
        ],
        [
            ['s', '{g}, go easy!'],
            ['g', 'Easy? Then why did I evolve?'],
            ['g', 'Big boot!'],
        ],
        [
            ['s', 'I thought I had it, {g}.'],
            ['g', 'Close. You just need to evolve.'],
            ['s', 'And now?'],
            ['g', 'Now run.'],
        ],
    ] as readonly ShowdownScript[],
    solo: {
        143: {
            keeper: [
                [
                    ['s', 'Is he asleep?'],
                    ['g', 'Zzz...'],
                    ['g', 'Zzz... BIG BOOT... zzz'],
                ],
            ],
            shooter: [
                [
                    ['s', "Zzz... huh? It didn't go in?"],
                    ['g', 'You kicked in your sleep, dude.'],
                    ['g', 'Wake up!'],
                ],
            ],
        },
        129: {
            keeper: [
                [
                    ['g', 'Splash.'],
                    ['s', '...He used Splash and it worked?'],
                    ['g', 'SPLASH!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'That was my best Splash!'],
                    ['g', "It's your only move."],
                    ['s', 'Fair.'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        79: {
            keeper: [
                [
                    ['s', 'Did he really stop it?'],
                    ['g', '.........'],
                    ['s', 'Still loading.'],
                    ['g', '...big boot.'],
                ],
            ],
            shooter: [
                [
                    ['s', '...'],
                    ['s', '...wait, did I kick?'],
                    ['g', 'Three seconds ago. Big boot!'],
                ],
            ],
        },
        25: {
            keeper: [
                [
                    ['s', 'You stopped my shot? A mouse?'],
                    ['g', 'Pika.'],
                    ['s', 'Electric mouse, sorry.'],
                    ['g', 'Pika... CHU!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Pika?'],
                    ['g', 'Your Thunderbolt? Felt a little zap.'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        150: {
            keeper: [
                [
                    ['s', 'He stopped it with his mind?'],
                    ['g', 'With my foot. My mind is off duty.'],
                    ['g', 'Big boot!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Impossible. I calculated everything.'],
                    ['g', 'You forgot to calculate me.'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        151: {
            keeper: [
                [
                    ['s', 'It was just a Mew...'],
                    ['g', 'Mew!'],
                    ['g', 'Meeew!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Mew?'],
                    ['g', 'Stop laughing, Mew.'],
                    ['s', 'Mew mew!'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        132: {
            keeper: [
                [
                    ['s', "Hey, that's my shot!"],
                    ['g', 'I copied it. Even better now.'],
                    ['g', 'Big boot!'],
                ],
            ],
            shooter: [
                [
                    ['s', "I copied a star's shot!"],
                    ['g', 'You copied it wrong, then.'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        54: {
            keeper: [
                [
                    ['s', 'He stopped it without looking?'],
                    ['g', 'Ow, my head...'],
                    ['g', 'Psy... DUCK!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Ow... my head. Did it go in?'],
                    ['g', 'Not even close. Feel better.'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        94: {
            keeper: [
                [
                    ['s', 'How did you get there?'],
                    ['g', "Hehehe. I'm always there."],
                    ['g', 'Boo!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Hehehe... it was meant to go through.'],
                    ['g', "I'm flesh and bone, buddy."],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        39: {
            keeper: [
                [
                    ['s', 'Why is she holding a marker?'],
                    ['g', 'Whoever falls asleep gets doodled.'],
                    ['g', 'Puff!'],
                ],
            ],
            shooter: [
                [
                    ['s', "My song didn't put you to sleep?"],
                    ['g', 'I had headphones on.'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        52: {
            keeper: [
                [
                    ['s', 'Team Rocket in goal?'],
                    ['g', 'This ball belongs to Team Rocket now!'],
                    ['g', "Meowth, that's right!"],
                ],
            ],
            shooter: [
                [
                    ['s', 'Meow! It was the perfect plan!'],
                    ['g', 'It never is, Meowth.'],
                    ['s', 'Team Rocket blasting off again...'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        83: {
            keeper: [
                [
                    ['s', 'He stopped it with a leek?'],
                    ['g', 'Competition-grade leek.'],
                    ['g', 'Big boot!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Not even with my leek?'],
                    ['g', 'You were supposed to use your foot.'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
        63: {
            keeper: [
                [
                    ['s', 'Is he sleeping in goal?'],
                    ['g', 'Zzz...'],
                    ['g', 'Teleport!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Zzz...'],
                    ['g', 'Kicked and went back to sleep?'],
                    ['g', 'Wake up, Abra!'],
                ],
            ],
        },
        133: {
            keeper: [
                [
                    ['s', "An Eevee? Where's the evolution?"],
                    ['g', 'Still picking my stone.'],
                    ['g', 'Eevee!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Vee! I thought that was a goal!'],
                    ['g', 'Evolve first, then we talk.'],
                    ['g', 'Big boot!'],
                ],
            ],
        },
    } as Record<string, ShowdownSolo>,
    shot: [
        'That was my best shot.',
        'With your foot?',
        'Hey, that was a goal!',
        'Wait, you stopped it?',
        'My max move... on his foot?',
        'It was top corner!',
        'Did anyone see that?',
        'I practiced that all week!',
    ],
    gk: [
        'I could tell.',
        'I practiced all week too.',
        'My turn now.',
        'Nice. Now watch mine.',
        'Keepers kick too, you know?',
        'Better run back. Here it comes.',
        'It was good. Shame it came back.',
        'Thanks for the pass.',
    ],
    more: [
        "From the goal? It won't reach.",
        'Everyone, get back! Back!',
        'Nobody shoots goal to goal.',
        'Wait, from there?',
    ],
    shout: [
        'Take it back!',
        'Big boot!',
        'Returning it!',
        'Back home!',
        'Here it comes!',
        'Catch this!',
        'First time!',
        'Special delivery!',
    ],
};
