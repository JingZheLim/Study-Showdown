const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Game state
const players = {};
let currentGame = null;

// Math question generator
function generateMathQuestion() {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, correctAnswer;

    switch (operation) {
        case '+':
            num1 = Math.floor(Math.random() * 20) + 1;
            num2 = Math.floor(Math.random() * 20) + 1;
            correctAnswer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * 30) + 10;
            num2 = Math.floor(Math.random() * num1) + 1;
            correctAnswer = num1 - num2;
            break;
        case '*':
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            correctAnswer = num1 * num2;
            break;
    }

    const wrongAnswers = [
        correctAnswer + Math.floor(Math.random() * 5) + 1,
        correctAnswer - Math.floor(Math.random() * 5) + 1,
        correctAnswer + Math.floor(Math.random() * 10) + 5
    ];

    // Shuffle answers
    const answers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

    return {
        question: `What is ${num1} ${operation} ${num2}?`,
        correctAnswer,
        answers
    };
}

// End game function
function endGame(reason) {
    const playerIds = Object.keys(players);
    const winner = playerIds.find(id => players[id].hp > 0);

    io.emit('gameOver', {
        reason,
        winner: winner ? players[winner].name : null
    });

    // Reset game state
    Object.keys(players).forEach(id => delete players[id]);
    currentGame = null;
}

io.on('connection', (socket) => {
    // Handle player joining
    socket.on('joinGame', (playerName) => {
        if (Object.keys(players).length < 2) {
            players[socket.id] = { 
                id: socket.id, 
                name: playerName, 
                hp: 100, 
                isAlive: true 
            };
            
            // Emit player info to the joining player
            socket.emit('playerInfo', { id: socket.id, players });
            
            // Broadcast to other players that someone joined
            socket.broadcast.emit('playerJoined', { id: socket.id, players });

            // Start the game if 2 players join
            if (Object.keys(players).length === 2) {
                currentGame = { 
                    round: 0, 
                    maxRounds: 1000,
                    currentQuestion: generateMathQuestion()
                };
                
                // Emit start game to both players
                io.emit('startGame', { 
                    players, 
                    game: currentGame,
                    question: currentGame.currentQuestion.question,
                    answers: currentGame.currentQuestion.answers
                });
            }
        } else {
            socket.emit('gameFull');
        }
    });

    // Handle answer submission
socket.on('submitAnswer', ({ playerId, answer }) => {
    // Ensure game is active and valid
    if (!currentGame || !currentGame.currentQuestion) {
        return;
    }

    const isCorrect = currentGame.currentQuestion.correctAnswer === parseInt(answer);
    let damage;

    if (isCorrect) {
        // If the answer is correct, damage the opponent
        damage = Math.floor(Math.random() * 20) + 10;
        const opponentId = Object.keys(players).find((id) => id !== playerId);
        if (opponentId && players[opponentId].isAlive) {
            players[opponentId].hp -= damage;
            if (players[opponentId].hp <= 0) {
                players[opponentId].hp = 0;
                players[opponentId].isAlive = false;
            }
        }
    } else {
        // If the answer is incorrect, damage the player who answered
        damage = 5;
        players[playerId].hp -= damage;
        if (players[playerId].hp <= 0) {
            players[playerId].hp = 0;
            players[playerId].isAlive = false;
        }
    }

    // Generate next question
    const nextQuestion = generateMathQuestion();
    currentGame.currentQuestion = nextQuestion;

    // Broadcast game state
    io.emit('gameUpdate', { 
        players, 
        damage, 
        attacker: playerId,
        question: nextQuestion.question,
        answers: nextQuestion.answers,
        isCorrect
    });

    // Check for game end conditions
    const alivePlayers = Object.values(players).filter(player => player.isAlive);
    if (alivePlayers.length === 1) {
        endGame(`${alivePlayers[0].name} wins!`);
    }
});


    // Handle player disconnect
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            delete players[socket.id];
            io.emit('playerLeft', { id: socket.id, players });
            
            // End game if a player leaves
            if (Object.keys(players).length < 2) {
                endGame('Player left the game');
            }
        }
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});