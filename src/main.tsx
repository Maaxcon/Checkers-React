import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/reset.css';
import './styles/style.css';
import Game from './Game.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Game />
    </StrictMode>
);
