import { LINKS } from '../../engine/links';
import { SECRET_LINKS } from '../../store/secret-links';

export interface SpeciesSynergy {
    id: string;
    /** Um sprite por parceiro (o último estágio de cada família). */
    faces: number[];
    /** Bônus em % (null = só em quadra). */
    bonus: number | null;
    secret: boolean;
}

export interface SpeciesSynergies {
    /** De história + secretas já descobertas. */
    shown: SpeciesSynergy[];
    /** Secretas da espécie ainda não descobertas: só a contagem, sem id (nada de nome nem parceiro). */
    hidden: number;
}

const pct = (b: number) => Math.round((b - 1) * 100);
const last = (g: readonly number[]) => g[g.length - 1];

/** Sinergias de que a espécie participa (ou a família dela). As secretas não descobertas viram só um número. */
export function speciesSynergies(speciesId: number, found: ReadonlySet<string>): SpeciesSynergies {
    const shown: SpeciesSynergy[] = LINKS.filter((l) => !l.secret && l.groups.some((g) => g.includes(speciesId))).map(
        (l) => ({ id: l.id, faces: l.groups.map(last), bonus: pct(l.bonus), secret: false }),
    );
    const secrets: SpeciesSynergy[] = [];
    for (const s of SECRET_LINKS) {
        const faces =
            s.pairs === 'mirror'
                ? speciesId === 150
                    ? [150, 150]
                    : null
                : (s.pairs.find(([a, b]) => a.includes(speciesId) || b.includes(speciesId))?.map(last) ?? null);
        if (faces) secrets.push({ id: s.id, faces, bonus: null, secret: true });
    }
    // as geradas por família repetem o id: vale a definição da família da espécie
    for (const l of LINKS) {
        if (l.secret && l.groups.some((g) => g.includes(speciesId)) && !secrets.some((x) => x.id === l.secret))
            secrets.push({ id: l.secret, faces: l.groups.map(last), bonus: pct(l.bonus), secret: true });
    }
    return {
        shown: [...shown, ...secrets.filter((s) => found.has(s.id))],
        hidden: secrets.filter((s) => !found.has(s.id)).length,
    };
}
