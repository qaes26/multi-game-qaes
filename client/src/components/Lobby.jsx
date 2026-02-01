import React, { useState, useEffect } from 'react';

function Lobby({ socket, onGameStart }) {
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        if (!socket) return;
        socket.on('waiting_for_match', () => setStatus('searching'));
        socket.on('match_found', (data) => {
            setStatus('connected');
            setTimeout(() => onGameStart(data), 2000);
        });
        return () => {
            socket.off('waiting_for_match');
            socket.off('match_found');
        };
    }, [socket, onGameStart]);

    const handlePlayNow = () => {
        if (socket && socket.connected) {
            socket.emit('join_lobby');
        }
    };

    return (
        <div className="game-container" style={{ textAlign: 'center', maxWidth: '800px' }}>
            <h1 className="brand-title">ألعاب قيس طلال الجازي</h1>
            <h3 style={{ marginBottom: '40px', color: '#a2d2ff' }}>Ultimate Arcade Hub</h3>

            {status === 'idle' && (
                <div style={{ animation: 'fadeIn 1s' }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#ccc' }}>
                        Connect with a friend on your local network and jump into the action.
                    </p>
                    <button className="neon-btn" onClick={handlePlayNow}>
                        CONNECT & PLAY
                    </button>
                </div>
            )}

            {status === 'searching' && (
                <div className="lobby-status">
                    SCANNING NETWORK... <br />
                    <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Waiting for opponent to join</span>
                </div>
            )}

            {status === 'connected' && (
                <div className="lobby-status" style={{ borderColor: '#00fff5', color: '#00fff5' }}>
                    SYSTEM LINK ESTABLISHED <br />
                    <span style={{ fontSize: '0.9rem' }}>Launching Game Module...</span>
                </div>
            )}

            {/* Decorative 'Featured Games' preview (Visual Only) */}
            <div className="game-grid" style={{ opacity: 0.5, pointerEvents: 'none', transform: 'scale(0.9)' }}>
                <div className="game-card"> <span className="game-icon">⭕</span> <h3>Tic Tac Toe</h3> </div>
                <div className="game-card"> <span className="game-icon">🐍</span> <h3>Snakes</h3> </div>
                <div className="game-card"> <span className="game-icon">🏎️</span> <h3>Racing</h3> </div>
            </div>
        </div>
    );
}

export default Lobby;
