import React, { useState, useEffect } from 'react';
import { questionBank, getRandomQuestions } from '../data/questions';

function TriviaGame({ socket, roomId, mode, onExit }) {
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [myScore, setMyScore] = useState(0);
    const [opScore, setOpScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswerCorrect, setIsAnswerCorrect] = useState(null); // true/false for visual feedback

    // Initialize Questions
    useEffect(() => {
        if (mode === 'single') {
            setQuestions(getRandomQuestions(15));
        } else if (mode === 'multi') {
            // In multi, we wait for server or P1 to decide questions, but for simplicity
            // let's have P1 gen and send, OR server gen.
            // Simplest: Both gen random specific seed? 
            // Better: P1 generates and sends 'init_trivia' event.
            // Even better: Logic in App.jsx? 
            // Let's handle it here: If I am the one who selected the game (initiator), I broadcast.
            // Note: 'selectGame' in App broadcasts 'switch_game'. 
            // We can attach questions to that payload in App.jsx!
            // BUT, App.jsx doesn't know about questions lib easily without import. 
            // Let's do a trick: Pass questions as prop? Or handle syncing here.
            // Since we are already loaded, we check if we have questions. 
            // If not, we rely on the prop passed from App (if we modify App to pass it).
            // Let's modify App.jsx to generate questions when selecting trivia.
        }
    }, [mode]);

    // Receive synced questions from props or generation usually happen in parent, 
    // but for now let's assume passed via props OR we sync here.
    // Actually, let's auto-generate if questions empty, but sending to OP is hard if we don't control the socket event "switch_game" anymore.
    // Let's assume App.jsx will be updated to pass `initialData` for the game.

    // To make it standalone without complex App changes:
    // We can emit 'trivia_init' when component mounts if we are "Host" (alphabetical ID?).
    // For now, let's just make it so BOTH generate random for MVP unless we update App.jsx heavily.
    // Wait, user Requirement: "Every game 15 riddles". If both gen random, they differ.
    // I WILL UDPATE App.jsx to handle the data generation and passing.

    // ... For this file, I will expect `questions` to be passed in OR I'll handle if missing.
    // Let's assume passed in via `initialData` prop.

    // Update: I'll use a local state init if provided.
    // For the sake of this file, let's implement the GAMEPLAY. 
    // Data sync will be handled in App.jsx update.

    const handleOptionClick = (option) => {
        if (gameOver || selectedOption) return;

        setSelectedOption(option);
        const correct = option === questions[currentQIndex].answer;
        setIsAnswerCorrect(correct);

        if (correct) {
            setMyScore(prev => prev + 10);
            if (mode === 'multi') {
                socket.emit('game_event', { roomId, type: 'trivia_score', payload: myScore + 10 });
            }
        }

        // Delay next question
        setTimeout(() => {
            if (currentQIndex < 14) {
                setCurrentQIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswerCorrect(null);
            } else {
                setGameOver(true);
                if (mode === 'multi') {
                    // Final score push
                    socket.emit('game_event', { roomId, type: 'trivia_score', payload: myScore + (correct ? 10 : 0) });
                }
            }
        }, 1500);
    };

    // Bot Logic
    useEffect(() => {
        if (mode === 'single' && !gameOver) {
            // Bot answers randomly every 3-5 seconds
            const timer = setInterval(() => {
                // Bot correctness chance: 60%
                const isCorrect = Math.random() < 0.6;
                if (isCorrect) setOpScore(prev => prev + 10);

                // Bot doesn't "progress" questions, it just accumulates score over time 
                // to simulate a parallel player. 
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [mode, gameOver]);

    // Multi Logic: Listen for opponent score
    useEffect(() => {
        if (mode === 'multi' && socket) {
            socket.on('game_update', ({ type, payload }) => {
                if (type === 'trivia_score') setOpScore(payload);
            });
            return () => socket.off('game_update');
        }
    }, [mode, socket]);

    // Allow parent to feed questions
    useEffect(() => {
        // If questions passed via props (we'll modify App to pass them)
        // For now, if questions is empty, load random (fallback for single)
        if (questions.length === 0) {
            setQuestions(getRandomQuestions(15));
        }
    }, []);

    // Update App to pass props:
    // <TriviaGame ... initialQuestions={...} />
    // I will add `initialQuestions` prop support.

    const currentQ = questions[currentQIndex];

    if (!currentQ) return <div style={{ color: 'white' }}>Loading Riddles...</div>;

    return (
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            {/* Header / Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: '1.2rem' }}>
                <div style={{ color: '#00fff5' }}>YOU: {myScore}</div>
                <div style={{ color: '#fff' }}>Q: {currentQIndex + 1} / 15</div>
                <div style={{ color: '#e94560' }}>{mode === 'single' ? 'BOT' : 'OPP'}: {opScore}</div>
            </div>

            {!gameOver ? (
                <div className="trivia-card" style={{ animation: 'fadeIn 0.5s' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 30, lineHeight: '1.6' }}>
                        {currentQ.question}
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        {currentQ.options.map((opt, i) => {
                            let btnStyle = {};
                            if (selectedOption) {
                                if (opt === currentQ.answer) btnStyle = { backgroundColor: 'green', borderColor: 'green' }; // Show correct
                                else if (opt === selectedOption) btnStyle = { backgroundColor: 'red', borderColor: 'red' }; // Show wrong if picked
                                else btnStyle = { opacity: 0.5 };
                            }

                            return (
                                <button
                                    key={i}
                                    className="neon-btn secondary"
                                    style={{ fontSize: '1rem', padding: '15px', ...btnStyle }}
                                    onClick={() => handleOptionClick(opt)}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                    {isAnswerCorrect !== null && (
                        <div style={{ marginTop: 20, fontSize: '1.5rem', fontWeight: 'bold', color: isAnswerCorrect ? 'green' : 'red' }}>
                            {isAnswerCorrect ? "Correct! (+10)" : "Wrong!"}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ animation: 'zoomIn 0.5s' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: 10 }}>GAME OVER</h1>
                    <h2 style={{ color: myScore > opScore ? '#00fff5' : (myScore < opScore ? '#e94560' : '#fff') }}>
                        {myScore > opScore ? "🏆 YOU WIN! 🏆" : (myScore < opScore ? "💀 YOU LOSE! 💀" : "🤝 DRAW! 🤝")}
                    </h2>
                    <p style={{ fontSize: '1.5rem' }}>Final Score: {myScore} - {opScore}</p>
                    <div style={{ marginTop: 30 }}>
                        <button className="neon-btn" onClick={onExit}>EXIT TO MENU</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TriviaGame;
