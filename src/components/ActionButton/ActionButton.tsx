import './ActionButton.css';

type ActionButtonProps = {
    text: string;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
};

function ActionButton({
    text,
    onClick,
    className = 'btn-undo',
    disabled = false,
    type = 'button'
}: ActionButtonProps) {
    return (
        <button className={className} onClick={onClick} disabled={disabled} type={type}>
            {text}
        </button>
    );
}

export default ActionButton;
