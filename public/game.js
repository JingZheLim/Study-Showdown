const socket = io();

// DOM Elements
const player1Name = document.getElementById('player1-name');
const player2Name = document.getElementById('player2-name');
const player1Health = document.getElementById('player1-health');
const player2Health = document.getElementById('player2-health');
const gameQuestion = document.getElementById('game-question');
const answerButtons = document.querySelectorAll('.answer-btn');
const gameLog = document.getElementById('game-log');

socket.on('connect', () => {
    console.log('Connected to server');
});

document.addEventListener('DOMContentLoaded', () => {
    const playerName = localStorage.getItem('playerName') || `Player ${Math.floor(Math.random() * 100)}`;
    socket.emit('joinGame', playerName);
});

// Player info
let currentPlayerId = null;
let players = {};

// Debugging function
function debugLog(message) {
    console.log(message);
}

// Handle game start
socket.on('startGame', (data) => {
    debugLog('Game start event received');
    debugLog(JSON.stringify(data));

    if (!data || !data.players) {
        debugLog('Invalid game start data');
        return;
    }

    players = data.players;
    const playerIds = Object.keys(players);

    if (playerIds.length !== 2) {
        debugLog(`Unexpected number of players: ${playerIds.length}`);
        return;
    }

    // Update player names
    player1Name.textContent = players[playerIds[0]].name || 'Player 1';
    player2Name.textContent = players[playerIds[1]].name || 'Player 2';

    // Update question and answer buttons
    gameQuestion.textContent = data.question || 'Question not available';
    answerButtons.forEach((btn, index) => {
        btn.textContent = data.answers[index] || '-';
        btn.disabled = false;  // Ensure buttons are enabled at game start
    });

    // Reset health bars
    player1Health.style.width = '100%';
    player2Health.style.width = '100%';
});

// Handle game updates
socket.on('gameUpdate', (data) => {
    debugLog('Game update event received');
    debugLog(JSON.stringify(data));

    if (!data || !data.players) {
        debugLog('Invalid game update data');
        return;
    }

    players = data.players;
    const playerIds = Object.keys(players);

    if (playerIds.length !== 2) {
        debugLog(`Unexpected number of players: ${playerIds.length}`);
        return;
    }

    // Safely update health bars
    try {
        player1Health.style.width = `${players[playerIds[0]].hp || 100}%`;
        player2Health.style.width = `${players[playerIds[1]].hp || 100}%`;
    } catch (error) {
        debugLog(`Error updating health bars: ${error.message}`);
    }

    // Update question and answers
    gameQuestion.textContent = data.question || 'Question not available';
    answerButtons.forEach((btn, index) => {
        btn.textContent = data.answers[index] || '-';
        btn.disabled = false;  // Re-enable buttons after each round
    });

    // Log the attack
    if (data.attacker) {
        const attackerName = players[data.attacker]?.name || 'Unknown Player';
        const log = `${attackerName} ${data.isCorrect ? 'correctly answered' : 'answered incorrectly'} and dealt ${data.damage || 0} damage!`;
        gameLog.innerHTML += `<p>${log}</p>`;
        gameLog.scrollTop = gameLog.scrollHeight;
    }
});

// Handle game over
socket.on('gameOver', ({ reason, winner }) => {
    alert(`Game Over! ${winner ? `${winner} wins!` : reason}`);
    window.location.href = 'index.html';
});

// Handle player disconnect
socket.on('playerLeft', ({ id }) => {
    alert('Your opponent left the game. Returning to the main menu.');
    window.location.href = 'index.html';
});

// Submit answer
answerButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const answer = button.textContent;
        socket.emit('submitAnswer', { 
            playerId: Object.keys(players).find(id => id === socket.id), 
            answer 
        });
        
        // Disable buttons after answering to prevent multiple submissions
        answerButtons.forEach(btn => btn.disabled = true);
    });
});