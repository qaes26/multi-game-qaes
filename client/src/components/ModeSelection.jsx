import React from 'react';

function ModeSelection({ onSelectMode }) {
    return (
        <div className="game-container" style={{ textAlign: 'center', maxWidth: '800px' }}>
            <h1 className="brand-title">ألعاب قيس طلال الجازي</h1>
            <h3 style={{ marginBottom: '40px', color: '#a2d2ff' }}>Select Game Mode</h3>

            <div className="game-grid" style={{ marginTop: '20px' }}>
                <div className="game-card" onClick={() => onSelectMode('single')}>
                    <span className="game-icon">🤖</span>
                    <h3>VS COMPUTER</h3>
                    <p>Challenge the AI</p>
                </div>

                <div className="game-card" onClick={() => onSelectMode('multi')}>
                    <span className="game-icon">👥</span>
                    <h3>VS FRIEND</h3>
                    <p>Local Network (LAN)</p>
                </div>
            </div>
        </div>
    );
}

export default ModeSelection;
