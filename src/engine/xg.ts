import type { Vec2 } from './vec';

/**
 * xG pelo ângulo de abertura do gol (modelo Soccermatics), recalibrado para o gol de futsal (3 m).
 * Usado pela IA para decidir quando chutar e pela narração ("chance claríssima!").
 */
export function shotAngle(pos: Vec2, goalX: number, goalY: number, goalWidth: number): number {
    const dx = Math.abs(goalX - pos.x);
    const dy = Math.abs(goalY - pos.y);
    const half = goalWidth / 2;
    let a = Math.atan2(goalWidth * dx, dx * dx + dy * dy - half * half);
    if (a < 0) a += Math.PI;
    return a;
}

export function expectedGoals(pos: Vec2, goalX: number, goalY: number, goalWidth: number): number {
    const a = shotAngle(pos, goalX, goalY, goalWidth);
    const logit = -3.6 + 5.6 * a;
    return Math.min(0.6, 1 / (1 + Math.exp(-logit)));
}
