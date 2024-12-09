import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Board from './components/Boards';
import './css/batalha_naval.css';

const socket = io('batalha-naval-backend-production.up.railway.app', {
    transports: ['websocket']  // Força o uso de WebSocket
});

const App = () => {
    const [player1Board, setPlayer1Board] = useState(Array(5).fill().map(() => Array(5).fill(0)));
    const [player2Board, setPlayer2Board] = useState(Array(5).fill().map(() => Array(5).fill(0)));
    const [roomId, setRoomId] = useState(null);
    const [message, setMessage] = useState(''); // Mensagem a ser exibida
    const [gameStarted, setGameStarted] = useState(false);
    const [playerId, setPlayerId] = useState(null);
    const [waitingForOpponent, setWaitingForOpponent] = useState(false);
    const [winner, setWinner] = useState(null);
    const [shipPositioning, setShipPositioning] = useState({
        x: '',
        y: '',
        orientation: 'horizontal', // default
        shipName: 'submarino' // default ship
    });

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Conectado ao servidor');
        });
    
        socket.on('player_added', (msg) => {
            console.log("Mensagem do servidor:", msg);
            
            const messageText = msg.message;
            const playerIdFromServer = msg.player_id;
            const roomIdFromServer = msg.room_id;  // Supondo que o servidor envia room_id
        
            setMessage(messageText);
        
            if (playerId === null && playerIdFromServer !== undefined) {
                console.log("Definindo o playerId:", playerIdFromServer);
                setPlayerId(playerIdFromServer);
            }
        
            if (roomIdFromServer) {
                setRoomId(roomIdFromServer);  // Definir roomId após receber do servidor
            }
        
            if (messageText === 'Jogador 2 adicionado') {
                setWaitingForOpponent(false); 
            }
        });
    
         // Quando o jogo começa, notifica ambos os jogadores
         socket.on('game_started', (msg) => {
            console.log("Jogo iniciado:", msg);
            setMessage(msg.message);
            setGameStarted(true);
        });
        
        // Atualiza os tabuleiros dos jogadores após uma jogada
        socket.on('move_result', (result) => {
            if (result && Array.isArray(result.boards) && result.boards.length === 2) {
                setPlayer1Board(result.boards[0].board);
                setPlayer2Board(result.boards[1].board);
            }
    
            if (result.message) {
                setMessage(result.message);
            }
    
            if (result.winner) {
                setWinner(result.winner);
            }
        });
    
        // Lida com o evento quando o outro jogador sai
        socket.on('player_left', () => {
            console.log("O outro jogador saiu");
            setMessage('O outro jogador deixou o jogo.');
            resetGame();
        });
    
        // Limpeza dos eventos ao desmontar
        return () => {
            socket.off('connect');
            socket.off('player_added');
            socket.off('game_started');
            socket.off('move_result');
            socket.off('player_left');
        };
    }, [playerId]);
    
     // Função para começar o jogo e adicionar o jogador ao servidor
     const startGame = () => {
        if (playerId === null) { // Envia apenas uma vez
            console.log("Solicitando ao servidor para adicionar o jogador");
            socket.emit('add_player');
            setWaitingForOpponent(true); 
        } else if (playerId === 1) {
            console.log("Jogador 2 entrou, agora iniciando o jogo!");
            socket.emit('start_game'); // Quando o segundo jogador clica
        }
    };
    
    const handleClick = (x, y) => {
        if (!gameStarted) {
            alert("Comece o jogo primeiro!");
            return;
        }
        console.log("Enviando jogada:", { player_id: playerId, room_id: roomId, x, y });
        
        if (!roomId) {
            alert("Sala não encontrada. Tente novamente.");
            return;
        }
        
        socket.emit('make_move', { player_id: playerId, room_id: roomId, x, y });
    };

    const leaveGame = () => {
        if (playerId !== null) {
            console.log("Solicitando para sair do jogo:", playerId);
            
            if (!roomId) {
                alert("Sala não encontrada. Tente novamente.");
                return;
            }
    
            socket.emit('leave_game', { player_id: playerId, room_id: roomId });
            resetGame();
        }
    };
    

    // Função para resetar o jogo e o estado do jogador
    const resetGame = () => {
        console.log("Resetando o jogo e o estado do jogador");
        setPlayer1Board(Array(5).fill().map(() => Array(5).fill(0)));
        setPlayer2Board(Array(5).fill().map(() => Array(5).fill(0)));
        setMessage('');
        setGameStarted(false);
        setPlayerId(null);  // Redefine o ID do jogador para evitar conflitos
        setWinner(null);
        setWaitingForOpponent(false);
    };

    const handleShipPlacement = () => {
        if (!gameStarted) {
            alert("O jogo ainda não começou!");
            return;
        }
    
        const { x, y, orientation, shipName } = shipPositioning;
    
        const adjustedX = parseInt(x) - 1; // Ajusta a entrada para 0 a 4
        const adjustedY = parseInt(y) - 1; // Ajusta a entrada para 0 a 4
    
        if (adjustedX < 0 || adjustedX >= 5 || adjustedY < 0 || adjustedY >= 5) {
            alert("Coordenadas fora do tabuleiro. Use valores de 1 a 5.");
            return;
        }
    
        if (!roomId) {
            alert("Sala não encontrada. Tente novamente.");
            return;
        }
    
        socket.emit('place_ship', {
            player_id: playerId,
            room_id: roomId,
            x: adjustedX,
            y: adjustedY,
            orientation,
            shipName
        });
    
        socket.on('place_ship_response', (response) => {
            if (response.success) {
                setMessage(response.message);
    
                if (playerId === 0) {
                    setPlayer1Board(response.updated_board);
                } else {
                    setPlayer2Board(response.updated_board);
                }
            } else {
                setMessage(response.message);
            }
        });
    };
    

    // Atualiza os valores do formulário para posicionar o navio
    const handleChange = (e) => {
        const { name, value } = e.target;
        setShipPositioning(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Define os tabuleiros com base no ID do jogador
    const myBoard = playerId === 0 ? player1Board : player2Board;
    const opponentBoard = playerId === 0 ? player2Board : player1Board;
    
    return (
        <div className="app-container">
            {!gameStarted && (
                <div className="start-game-container">
                    <h2 className="start-game-title">Batalha Naval</h2>
                    <button className="start-button" onClick={startGame}>Start Game</button>
                </div>
            )}
            {gameStarted ? (
                <>
                    <div className="board-container">
                        <div className="board-wrapper">
                            <h2 className="board-title">Seu Tabuleiro</h2>
                            <Board board={myBoard} isMyBoard={true} />
                        </div>
                        <div className="board-wrapper">
                            <h2 className="board-title">Tabuleiro do Oponente</h2>
                            <Board board={opponentBoard} isMyBoard={false} handleClick={handleClick} />
                        </div>
                    </div>
                    <div></div>
                    {message && (
                        <div className="message-container">
                            <span className="message-label">Mensagem:</span>
                            <span className="message-content">{message}</span>
                        </div>
                    )}
                    <div>
                        <button className="leave-button" onClick={leaveGame} disabled={playerId === null}>Leave Game</button>
                    </div>
                    <div className="ship-placement-form">
                        <h3>Posicionar Navio</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleShipPlacement(); }}>
                            <label>
                                Nome do Navio:
                                <select
                                    name="shipName"
                                    value={shipPositioning.shipName}
                                    onChange={handleChange}
                                >
                                    <option value="submarino">Submarino (1)</option>
                                    <option value="barco">Barco (2)</option>
                                    <option value="navio">Navio (3)</option>
                                    <option value="porta_aviao">Porta-avião (3)</option>
                                </select>
                            </label>
                            <br />
                            <label>
                                Coordenada Y:
                                <input
                                    type="number"
                                    name="x"
                                    value={shipPositioning.x}
                                    onChange={handleChange}
                                    min="1"
                                    max="5"
                                />
                            </label>
                            <br />
                            <label>
                                Coordenada X:
                                <input
                                    type="number"
                                    name="y"
                                    value={shipPositioning.y}
                                    onChange={handleChange}
                                    min="1"
                                    max="5"
                                />
                            </label>
                            <br />
                            <label>
                                Orientação:
                                <select
                                    name="orientation"
                                    value={shipPositioning.orientation}
                                    onChange={handleChange}
                                >
                                    <option value="horizontal">Horizontal</option>
                                    <option value="vertical">Vertical</option>
                                </select>
                            </label>
                            <br />
                            <button type="submit">Posicionar Navio</button>
                        </form>
                        
                    </div>
                    
                    <div className="player-info">
                        <h3>{playerId === 0 ? 'Jogador 1:' : 'Jogador 2:'}</h3>
                    </div>
                    
                    
                </>
            ) : (
                <p className="waiting-message">{waitingForOpponent && 'Aguardando oponente...'}</p>
            )}
        </div>
    );
};

export default App;
