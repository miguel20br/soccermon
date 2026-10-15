import { useGame } from '../../store/game-store';

/** Passo a passo de boas-vindas (em construção). */
export function Onboarding() {
    const setOnboarded = useGame((s) => s.setOnboarded);
    return (
        <div className="modal-backdrop" role="presentation">
            <div className="modal panel" role="dialog" aria-modal="true" aria-label="Como jogar">
                <button type="button" className="btn primary" onClick={() => setOnboarded(true)}>
                    Bora jogar
                </button>
            </div>
        </div>
    );
}
