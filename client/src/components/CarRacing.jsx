import React, { useRef, useEffect, useState } from 'react';

function CarRacing({ socket, roomId, mode, onExit }) {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [opponentScore, setOpponentScore] = useState(0);

    const carX = useRef(175);
    const obstacles = useRef([]);
    const frameId = useRef(0);
    const speed = useRef(5);

    // Multi Logic
    useEffect(() => {
        if (mode === 'multi') {
            if (gameOver) {
                socket.emit('game_event', { roomId, type: 'race_score', payload: score });
            }
            socket.on('game_update', ({ type, payload }) => {
                if (type === 'race_score') setOpponentScore(payload);
            });
            return () => socket.off('game_update');
        }
    }, [gameOver, score, roomId, socket, mode]);

    // Single Logic (Bot Score Simulation)
    useEffect(() => {
        if (mode === 'single' && !gameOver) {
            const interval = setInterval(() => {
                setOpponentScore(prev => prev + 10);
            }, 800); // Bot gets 10 points every 800ms (fairly decent player speed)
            return () => clearInterval(interval);
        }
    }, [mode, gameOver]);

    // Game Loop & Controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameOver) return;
            if (e.key === 'ArrowLeft') carX.current = Math.max(25, carX.current - 20);
            if (e.key === 'ArrowRight') carX.current = Math.min(325, carX.current + 20);
        };
        window.addEventListener('keydown', handleKeyDown);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const update = () => {
            if (gameOver) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Road
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#fff';
            ctx.setLineDash([20, 20]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();

            // Car
            ctx.fillStyle = '#e94560'; // Neon Red
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#e94560';
            ctx.fillRect(carX.current - 15, canvas.height - 60, 30, 50);
            ctx.shadowBlur = 0;

            // Obstacles
            if (Math.random() < 0.02) {
                obstacles.current.push({ x: Math.random() * (canvas.width - 40) + 20, y: -50 });
            }

            ctx.fillStyle = '#00fff5'; // Neon Cyan
            obstacles.current.forEach((obs, index) => {
                obs.y += speed.current;
                ctx.fillRect(obs.x - 15, obs.y, 30, 30);
                if (
                    obs.y > canvas.height - 90 && obs.y < canvas.height - 10 &&
                    Math.abs(obs.x - carX.current) < 30
                ) {
                    setGameOver(true);
                }
                if (obs.y > canvas.height) {
                    obstacles.current.splice(index, 1);
                    setScore(prev => prev + 10);
                    speed.current += 0.01;
                }
            });
            frameId.current = requestAnimationFrame(update);
        };
        frameId.current = requestAnimationFrame(update);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            cancelAnimationFrame(frameId.current);
        };
    }, [gameOver]);

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '350px', margin: '0 auto 20px' }}>
                <span>SCORE: {score}</span>
                <span style={{ color: '#00fff5' }}>{mode === 'single' ? 'BOT' : 'OPP'}: {opponentScore}</span>
            </div>

            <canvas
                ref={canvasRef}
                width={350}
                height={500}
                style={{ border: '4px solid #fff', borderRadius: '5px', boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}
            />

            {gameOver && (
                <div style={{ marginTop: 20 }}>
                    <h2 style={{ color: '#e94560' }}>CRASH!</h2>
                    <button onClick={() => {
                        setGameOver(false);
                        setScore(0);
                        setOpponentScore(0);
                        obstacles.current = [];
                        speed.current = 5;
                    }} className="neon-btn" style={{ marginRight: 10 }}>RETRY</button>
                    <button onClick={onExit} className="neon-btn secondary">EXIT</button>
                </div>
            )}
        </div>
    );
}

export default CarRacing;
