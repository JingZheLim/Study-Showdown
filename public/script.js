const backgroundMusic = document.getElementById('background-music');
const socket = io();
const playButton = document.getElementById('play-btn');
const statusIndicator = document.getElementById('status-indicator');

// Join the game when the "Play" button is clicked
playButton.addEventListener('click', () => {
    const playerName = prompt('Enter your name:');
    if (playerName) {
        socket.emit('joinGame', playerName);
        statusIndicator.textContent = 'Waiting for another player...';
        playButton.disabled = true;
    }
});

// Listen for player info
socket.on('playerInfo', (data) => {
    updatePlayerStatus(data);
});

// Listen for another player joining
socket.on('playerJoined', (data) => {
    statusIndicator.textContent = 'Player joined! Preparing game...';
    updatePlayerStatus(data);
});

// Function to update player status
function updatePlayerStatus(data) {
    const player1Status = document.getElementById('player1-status');
    const player2Status = document.getElementById('player2-status');

    const playerIds = Object.keys(data.players);
    if (playerIds.length === 1) {
        player1Status.textContent = `Player 1: ${data.players[playerIds[0]].name} (You)`;
        player2Status.textContent = 'Player 2: Waiting...';
    } else if (playerIds.length === 2) {
        player1Status.textContent = `Player 1: ${data.players[playerIds[0]].name}`;
        player2Status.textContent = `Player 2: ${data.players[playerIds[1]].name}`;
    }
}

// Start the game when both players are connected
socket.on('startGame', () => {
    window.location.href = 'game.html';
});

// Handle game full
socket.on('gameFull', () => {
    alert('The game is full! Please try again later.');
    playButton.disabled = false;
    statusIndicator.textContent = 'Idle';
});

// Handle player disconnect
socket.on('playerLeft', (data) => {
    statusIndicator.textContent = 'A player left. Waiting for another player...';
    playButton.disabled = false;
    resetPlayerStatus();
});

// Reset player status
function resetPlayerStatus() {
    document.getElementById('player1-status').textContent = 'Player 1: Waiting...';
    document.getElementById('player2-status').textContent = 'Player 2: Waiting...';
}

// Ensure music plays when the page loads
window.addEventListener('load', () => {
    backgroundMusic.play().catch(error => {
        console.log('Autoplay was prevented:', error);
    });
});