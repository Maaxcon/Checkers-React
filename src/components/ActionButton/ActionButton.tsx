import React from 'react';
import './ActionButton.css';

type ActionButtonProps = {
    text: string;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    ariaPressed?: boolean;
};

function ActionButton({
    text,
    onClick,
    className = 'btn',
    disabled = false,
    type = 'button',
    ariaPressed
}: ActionButtonProps) {
    return (
        <button
            className={className}
            onClick={onClick}
            disabled={disabled}
            type={type}
            aria-pressed={ariaPressed}
        >
            {text}
        </button>
    );
}

export default React.memo(ActionButton);
