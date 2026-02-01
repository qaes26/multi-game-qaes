import React, { useState, useEffect } from 'react';

function TicTacToe({ socket, roomId, mode, onExit }) {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isMyTurn, setIsMyTurn] = useState(true);
    const [winner, setWinner] = useState(null);

    // Multi: Listen for socket events
    useEffect(() => {
        if (mode === 'multi') {
            socket.on('game_update', ({ type, payload }) => {
                if (type === 'move') {
                    const { index, symbol } = payload;
                    setBoard(prev => {
                        const newBoard = [...prev];
                        newBoard[index] = symbol;
                        checkWin(newBoard);
                        return newBoard;
                    });
                    setIsMyTurn(true);
                } else if (type === 'reset') {
                    setBoard(Array(9).fill(null));
                    setWinner(null);
                    setIsMyTurn(true);
                }
            });
            return () => socket.off('game_update');
        }
    }, [socket, mode]);

    // Single: AI Logic
    useEffect(() => {
        if (mode === 'single' && !isMyTurn && !winner) {
            const timer = setTimeout(() => {
                makeAiMove();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isMyTurn, winner, mode]);

    const makeAiMove = () => {
        const available = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        if (available.length === 0) return;

        // Simple AI: Random Move
        const randomIndex = available[Math.floor(Math.random() * available.length)];

        // Better AI: Block or Win? (Keep simple for now, maybe add later)

        const newBoard = [...board];
        newBoard[randomIndex] = 'O'; // Computer is O
        setBoard(newBoard);
        checkWin(newBoard);
        setIsMyTurn(true);
    };

    const checkWin = (currentBoard) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let line of lines) {
            const [a, b, c] = line;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                setWinner(currentBoard[a]);
                return;
            }
        }
        if (!currentBoard.includes(null)) setWinner('Draw');
    };

    const handleClick = (index) => {
        if (board[index] || winner || !isMyTurn) return;

        const newBoard = [...board];
        newBoard[index] = 'X'; // Player is X
        setBoard(newBoard);
        checkWin(newBoard);
        setIsMyTurn(false);

        if (mode === 'multi') {
            socket.emit('game_event', {
                roomId,
                type: 'move',
                payload: { index, symbol: 'O' }
            });
        }
    };

    const resetGame = () => {
        if (mode === 'multi') {
            socket.emit('game_event', { roomId, type: 'reset' });
        }
        setBoard(Array(9).fill(null));
        setWinner(null);
        setIsMyTurn(true);
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Tic Tac Toe</h2>
                <span style={{ color: isMyTurn ? '#00fff5' : '#666' }}>
                    {winner ? 'GAME OVER' : (isMyTurn ? 'YOUR TURN' : (mode === 'single' ? 'AI THINKING...' : 'OPPONENT TURN'))}
                </span>
            </div>

            {winner && (
                <h3 style={{ color: '#e94560', fontSize: '2rem', margin: '20px 0' }}>
                    {winner === 'Draw' ? "DRAW!" : (winner === 'X' ? "VICTORY!" : "DEFEAT!")}
                </h3>
            )}

            <div className="ttt-board">
                {board.map((cell, i) => (
                    <div key={i} className={`ttt-cell ${cell ? cell.toLowerCase() : ''}`} onClick={() => handleClick(i)}>
                        {cell}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 30 }}>
                {winner && <button className="neon-btn" onClick={resetGame} style={{ marginRight: 15 }}>REMATCH</button>}
                <button className="neon-btn secondary" onClick={onExit}>EXIT TO MENU</button>
            </div>
        </div>
    );
}

export default TicTacToe;
