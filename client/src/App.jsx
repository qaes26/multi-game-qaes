import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import TicTacToe from './components/TicTacToe';
import TriviaGame from './components/TriviaGame';
import CarRacing from './components/CarRacing';
import ModeSelection from './components/ModeSelection';
import { getRandomQuestions } from './data/questions';
import { socket } from './socket';

function App() {
  const [gameState, setGameState] = useState({
    phase: 'mode_select',
    mode: null,
    roomId: null,
    opponent: null,
    selectedGame: null,
    gameData: null // Store shared data like questions
  });

  // Socket only needed for Multi
  useEffect(() => {
    if (gameState.mode === 'multi') {
      socket.connect();

      socket.on('game_update', (data) => {
        if (data.type === 'switch_game') {
          setGameState(prev => ({
            ...prev,
            phase: 'game',
            selectedGame: data.payload.gameId,
            gameData: data.payload.gameData // Receive questions from P1
          }));
        }
      });

      return () => {
        socket.off('game_update');
        socket.disconnect();
      };
    }
  }, [gameState.mode]);

  const handleModeSelect = (mode) => {
    if (mode === 'single') {
      setGameState({ phase: 'menu', mode: 'single', roomId: 'local', opponent: 'Computer', selectedGame: null });
    } else {
      setGameState({ phase: 'lobby', mode: 'multi', roomId: null, opponent: null, selectedGame: null });
    }
  };

  const handleGameStart = (matchData) => {
    setGameState(prev => ({
      ...prev,
      phase: 'menu',
      roomId: matchData.roomId,
      opponent: matchData.opponent
    }));
  };

  const selectGame = (gameId) => {
    let extraData = null;

    // Generate questions if Trivia
    if (gameId === 'trivia') {
      extraData = getRandomQuestions(15);
    }

    if (gameState.mode === 'multi') {
      socket.emit('game_event', {
        roomId: gameState.roomId,
        type: 'switch_game',
        payload: { gameId, gameData: extraData } // Send questions to P2
      });
    }
    setGameState(prev => ({ ...prev, phase: 'game', selectedGame: gameId, gameData: extraData }));
  };

  const exitGame = () => {
    setGameState(prev => ({ ...prev, phase: 'menu', selectedGame: null, gameData: null }));
  };

  return (
    <div className="app-container">
      {gameState.phase === 'mode_select' && (
        <ModeSelection onSelectMode={handleModeSelect} />
      )}

      {gameState.phase === 'lobby' && (
        <Lobby socket={socket} onGameStart={handleGameStart} />
      )}

      {gameState.phase === 'menu' && (
        <div className="game-container">
          <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>SELECT GAME MODULE</h1>
          <p style={{ textAlign: 'center', color: '#00fff5' }}>
            Mode: {gameState.mode === 'single' ? 'Single Player' : `Connected: ${gameState.roomId}`}
          </p>

          <div className="game-grid">
            <div className="game-card" onClick={() => selectGame('ttt')}>
              <span className="game-icon">⭕</span>
              <h3>Tic-Tac-Toe</h3>
              <p>Strategic Logic Battle</p>
            </div>
            <div className="game-card" onClick={() => selectGame('trivia')}>
              <span className="game-icon">🧩</span>
              <h3>Arabic Trivia</h3>
              <p>Battle of Wits (15 Qs)</p>
            </div>
            <div className="game-card" onClick={() => selectGame('car')}>
              <span className="game-icon">🏎️</span>
              <h3>Cyber Racing</h3>
              <p>High Speed Dodge</p>
            </div>
          </div>
          <button className="neon-btn secondary" style={{ marginTop: 30 }} onClick={() => setGameState({ phase: 'mode_select', mode: null, roomId: null, opponent: null, selectedGame: null })}>Back to Home</button>
        </div>
      )}

      {gameState.phase === 'game' && (
        <div className="game-container">
          {gameState.selectedGame === 'ttt' &&
            <TicTacToe socket={socket} roomId={gameState.roomId} mode={gameState.mode} onExit={exitGame} />}
          {gameState.selectedGame === 'trivia' &&
            <TriviaGame socket={socket} roomId={gameState.roomId} mode={gameState.mode} onExit={exitGame} initialQuestions={gameState.gameData} />}
          {gameState.selectedGame === 'car' &&
            <CarRacing socket={socket} roomId={gameState.roomId} mode={gameState.mode} onExit={exitGame} />}
        </div>
      )}
    </div>
  );
}

export default App;
