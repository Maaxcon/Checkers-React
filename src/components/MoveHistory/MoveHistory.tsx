import type { MoveLogEntry } from '../../types/types.ts';
import './MoveHistory.css';

type MoveHistoryProps = {
    moveLog: MoveLogEntry[];
    activeIndex: number | null;
    onSelect: (index: number | null) => void;
};

function MoveHistory({ moveLog, activeIndex, onSelect }: MoveHistoryProps) {
    return (
        <section className="history-panel move-history">
            <h2 className="history-title">Move History</h2>
            {moveLog.length === 0 ? (
                <p className="move-history__empty">No moves yet.</p>
            ) : (
                <ol className="history-list">
                    {moveLog.map((entry, index) => (
                        <li
                            key={`${entry.notation}-${index}`}
                            className={`history-item${activeIndex === index ? ' is-active' : ''}`}
                            onClick={() => onSelect(index)}
                        >
                            {index + 1}. {entry.notation}
                        </li>
                    ))}
                </ol>
            )}
            {moveLog.length > 0 ? (
                <button className="move-history__clear" onClick={() => onSelect(null)}>
                    Clear highlight
                </button>
            ) : null}
        </section>
    );
}

export default MoveHistory;
