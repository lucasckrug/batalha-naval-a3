// Controls.js
import React from 'react';

const Controls = ({ startGame, leaveGame, message }) => (
    <div className="controls-container">
        <button className="start-button" onClick={startGame}>Start Game</button>
        <button className="leave-button" onClick={leaveGame}>Leave Game</button>
        <p className="message">{message}</p>
    </div>
);

export default Controls;
