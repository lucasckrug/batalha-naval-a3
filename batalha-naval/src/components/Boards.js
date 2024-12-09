import React from 'react';
import '../css/board.css';

const Board = ({ board, isMyBoard, handleClick, playerId }) => {
    return (
        <div className="board">
            {/* Header with X and Y indicators */}
            <div className="board-row header">
                <div className="board-cell header-cell indicators">
                    <span className="x-indicator">X →<br></br></span>
                    <span className="y-indicator"><br></br><br></br>Y ↓</span>
                </div>
                {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="board-cell header-cell">{num}</div>
                ))}
            </div>
            {/* Rows with Y axis labels */}
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                    <div className="board-cell header-cell">{rowIndex + 1}</div>
                    {row.map((cell, colIndex) => {
                        const cellClass = cell === 1 && isMyBoard ? 'ship' :
                                          cell === 2 ? 'hit' :
                                          cell === 3 ? 'miss' : '';
                        return (
                            <div
                                key={colIndex}
                                className={`board-cell ${cellClass}`}
                                onClick={() => {
                                    console.log(`Célula clicada: Linha ${rowIndex + 1}, Coluna ${colIndex + 1}`);
                                    if (!isMyBoard || (isMyBoard && playerId === 1)) {
                                        handleClick(rowIndex, colIndex);
                                    }
                                }}
                            ></div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Board;
