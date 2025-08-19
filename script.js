const GAME_CONFIG = {
    GRID_SIZE: 20,
    INITIAL_SPEED: 150,
    SPEED_INCREMENT: 5,
    POINTS_PER_COMMIT: 10,
    SPECIAL_COMMIT_CHANCE: 0.15,
    SPECIAL_COMMIT_POINTS: 25
};

let game = {
    canvas: null,
    ctx: null,
    snake: [{ x: 10, y: 10 }],
    direction: { x: 0, y: 0 },
    nextDirection: { x: 0, y: 0 },
    commit: null,
    specialCommit: null,
    score: 0,
    bestScore: 0,
    commits: 0,
    gameRunning: false,
    gamePaused: false,
    speed: GAME_CONFIG.INITIAL_SPEED,
    lastUpdateTime: 0,
    particles: [],
    achievements: {
        firstCommit: false,
        hotStreak: false,
        century: false,
        longSnake: false
    }
};

const elements = {
    canvas: null,
    overlay: null,
    overlayTitle: null,
    overlayMessage: null,
    startBtn: null,
    restartBtn: null,
    scoreElement: null,
    bestScoreElement: null,
    commitsElement: null,
    achievementList: null
};

function initGame() {
    elements.canvas = document.getElementById('gameCanvas');
    elements.overlay = document.getElementById('gameOverlay');
    elements.overlayTitle = document.getElementById('overlayTitle');
    elements.overlayMessage = document.getElementById('overlayMessage');
    elements.startBtn = document.getElementById('startBtn');
    elements.restartBtn = document.getElementById('restartBtn');
    elements.scoreElement = document.getElementById('score');
    elements.bestScoreElement = document.getElementById('best-score');
    elements.commitsElement = document.getElementById('commits');
    elements.achievementList = document.getElementById('achievementList');

    game.canvas = elements.canvas;
    game.ctx = elements.canvas.getContext('2d');
 
    const savedBestScore = localStorage?.getItem('contributionSnakeBestScore');
    if (savedBestScore) {
        game.bestScore = parseInt(savedBestScore);
        elements.bestScoreElement.textContent = game.bestScore;
    }
 
    loadAchievements(); 
    setupEventListeners(); 
    generateCommit(); 
    requestAnimationFrame(gameLoop);
}
 
function setupEventListeners() { 
    elements.startBtn.addEventListener('click', startGame);
    elements.restartBtn.addEventListener('click', restartGame); 
    document.addEventListener('keydown', handleKeyPress); 
    elements.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
} 

function handleKeyPress(e) {
    const key = e.key.toLowerCase(); 
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'r'].includes(key)) {
        e.preventDefault();
    }

    if (!game.gameRunning) {
        if (key === ' ' || key === 'enter') {
            if (elements.startBtn.style.display !== 'none') {
                startGame();
            } else {
                restartGame();
            }
        }
        return;
    }
 
    if (key === ' ') {
        togglePause();
        return;
    }
 
    if (key === 'r') {
        restartGame();
        return;
    }

    if (game.gamePaused) return;
 
    const currentDirection = game.direction;
    
    switch (key) {
        case 'arrowup':
        case 'w':
            if (currentDirection.y !== 1) {
                game.nextDirection = { x: 0, y: -1 };
            }
            break;
        case 'arrowdown':
        case 's':
            if (currentDirection.y !== -1) {
                game.nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'arrowleft':
        case 'a':
            if (currentDirection.x !== 1) {
                game.nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'arrowright':
        case 'd':
            if (currentDirection.x !== -1) {
                game.nextDirection = { x: 1, y: 0 };
            }
            break;
    }
}
 
function startGame() {
    resetGame();
    game.gameRunning = true;
    game.gamePaused = false;
    elements.overlay.style.display = 'none';
    game.direction = { x: 1, y: 0 };
    game.nextDirection = { x: 1, y: 0 };
}
 
function restartGame() {
    resetGame();
    elements.overlayTitle.textContent = '🚀 Ready to Code?';
    elements.overlayMessage.textContent = 'Use arrow keys or WASD to control your snake.\\nEat green commits to grow and increase your GitHub streak!';
    elements.startBtn.style.display = 'inline-block';
    elements.restartBtn.style.display = 'none';
    elements.overlay.style.display = 'flex';
}
 
function resetGame() {
    game.snake = [{ x: 10, y: 10 }];
    game.direction = { x: 0, y: 0 };
    game.nextDirection = { x: 0, y: 0 };
    game.score = 0;
    game.commits = 0;
    game.gameRunning = false;
    game.gamePaused = false;
    game.speed = GAME_CONFIG.INITIAL_SPEED;
    game.particles = [];
    
    generateCommit();
    updateUI();
}
 
function togglePause() {
    if (!game.gameRunning) return;
    
    game.gamePaused = !game.gamePaused;
    
    if (game.gamePaused) {
        elements.overlayTitle.textContent = '⏸️ Paused';
        elements.overlayMessage.textContent = 'Press Space to resume coding!';
        elements.startBtn.style.display = 'none';
        elements.restartBtn.style.display = 'inline-block';
        elements.restartBtn.textContent = 'Resume';
        elements.overlay.style.display = 'flex';
    } else {
        elements.overlay.style.display = 'none';
        elements.restartBtn.textContent = 'Code Again';
    }
}
 
function generateCommit() {
    const gridWidth = Math.floor(game.canvas.width / GAME_CONFIG.GRID_SIZE);
    const gridHeight = Math.floor(game.canvas.height / GAME_CONFIG.GRID_SIZE);
    
    let newCommit;
    let attempts = 0;
    
    do {
        newCommit = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        attempts++;
    } while (isPositionOnSnake(newCommit) && attempts < 100);
    
    game.commit = newCommit;
     
    if (Math.random() < GAME_CONFIG.SPECIAL_COMMIT_CHANCE && game.commits > 5) {
        do {
            game.specialCommit = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight),
                timer: 300 // Disappears after 5 seconds at 60fps
            };
        } while (isPositionOnSnake(game.specialCommit) || 
                (game.specialCommit.x === game.commit.x && game.specialCommit.y === game.commit.y));
    }
}
 
function isPositionOnSnake(pos) {
    return game.snake.some(segment => segment.x === pos.x && segment.y === pos.y);
} 
function gameLoop(currentTime) {
    if (game.gameRunning && !game.gamePaused) {
        if (currentTime - game.lastUpdateTime >= game.speed) {
            update();
            game.lastUpdateTime = currentTime;
        }
    }
    
    updateParticles();
    render();
    requestAnimationFrame(gameLoop);
}
 
function update() { 
    game.direction = { ...game.nextDirection }; 
    const head = { ...game.snake[0] };
    head.x += game.direction.x;
    head.y += game.direction.y; 
    const gridWidth = Math.floor(game.canvas.width / GAME_CONFIG.GRID_SIZE);
    const gridHeight = Math.floor(game.canvas.height / GAME_CONFIG.GRID_SIZE);
    
    if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
        gameOver();
        return;
    } 
    if (isPositionOnSnake(head)) {
        gameOver();
        return;
    }
    
    game.snake.unshift(head);
     
    let commitEaten = false;
    let points = 0;
    
    if (head.x === game.commit.x && head.y === game.commit.y) {
        commitEaten = true;
        points = GAME_CONFIG.POINTS_PER_COMMIT;
        game.commits++;
        createParticles(head.x * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
                       head.y * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2, '#39d353');
    }
     
    if (game.specialCommit && head.x === game.specialCommit.x && head.y === game.specialCommit.y) {
        commitEaten = true;
        points = GAME_CONFIG.SPECIAL_COMMIT_POINTS;
        game.commits++;
        createParticles(head.x * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2,
                       head.y * GAME_CONFIG.GRID_SIZE + GAME_CONFIG.GRID_SIZE / 2, '#ffd700');
        game.specialCommit = null;
    }
    
    if (commitEaten) {
        game.score += points;
        showScorePopup(points, head.x * GAME_CONFIG.GRID_SIZE, head.y * GAME_CONFIG.GRID_SIZE);
        
        // Increase speed slightly
        if (game.speed > 80) {
            game.speed -= GAME_CONFIG.SPEED_INCREMENT;
        }
        
        generateCommit();
        checkAchievements();
        updateUI();
    } else {
        game.snake.pop();
    }
     
    if (game.specialCommit) {
        game.specialCommit.timer--;
        if (game.specialCommit.timer <= 0) {
            game.specialCommit = null;
        }
    }
}
 
function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        game.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            maxLife: 30,
            color: color
        });
    }
}
 
function updateParticles() {
    game.particles = game.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vy += 0.1; // gravity
        return particle.life > 0;
    });
}
 
function showScorePopup(points, x, y) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${points}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    }, 1000);
}
 
function checkAchievements() {
    const achievements = game.achievements; 
    if (!achievements.firstCommit && game.commits >= 1) {
        achievements.firstCommit = true;
        unlockAchievement('firstCommit', 'First Commit');
    }
     
    if (!achievements.hotStreak && game.commits >= 10) {
        achievements.hotStreak = true;
        unlockAchievement('hotStreak', 'Hot Streak');
    }
     
    if (!achievements.century && game.score >= 100) {
        achievements.century = true;
        unlockAchievement('century', 'Century');
    }
     
    if (!achievements.longSnake && game.snake.length >= 20) {
        achievements.longSnake = true;
        unlockAchievement('longSnake', 'Long Snake');
    }
    
    saveAchievements();
}
 
function unlockAchievement(achievementId, name) {
    const achievementElements = elements.achievementList.querySelectorAll('.achievement');
    
    achievementElements.forEach(element => {
        const achievementName = element.querySelector('.achievement-name').textContent;
        if (achievementName === name) {
            element.classList.remove('locked');
            element.classList.add('unlocked');
            
            // Show notification
            showAchievementNotification(name);
        }
    });
}
 
function showAchievementNotification(name) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #238636, #39d353);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.5s ease, fadeOut 0.5s ease 2.5s forwards;
        box-shadow: 0 4px 20px rgba(57, 211, 83, 0.4);
    `;
    notification.innerHTML = `🏆 Achievement Unlocked: ${name}`;
    
    document.body.appendChild(notification);
     
    if (!document.querySelector('#achievement-animations')) {
        const style = document.createElement('style');
        style.id = 'achievement-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}
 
function saveAchievements() {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('contributionSnakeAchievements', JSON.stringify(game.achievements));
    }
}
 
function loadAchievements() {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('contributionSnakeAchievements');
        if (saved) {
            game.achievements = { ...game.achievements, ...JSON.parse(saved) };
            updateAchievementDisplay();
        }
    }
}
 
function updateAchievementDisplay() {
    const achievementElements = elements.achievementList.querySelectorAll('.achievement');
    const achievementNames = ['First Commit', 'Hot Streak', 'Century', 'Long Snake'];
    const achievementKeys = ['firstCommit', 'hotStreak', 'century', 'longSnake'];
    
    achievementElements.forEach((element, index) => {
        const key = achievementKeys[index];
        if (game.achievements[key]) {
            element.classList.remove('locked');
            element.classList.add('unlocked');
        }
    });
}
 
function gameOver() {
    game.gameRunning = false;
     
    if (game.score > game.bestScore) {
        game.bestScore = game.score;
        elements.bestScoreElement.textContent = game.bestScore;
        
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('contributionSnakeBestScore', game.bestScore.toString());
        }
    }
     
    elements.overlayTitle.textContent = '💥 Repository Crashed!';
    elements.overlayMessage.innerHTML = `
        Your coding session ended!<br>
        <strong>Final Score:</strong> ${game.score}<br>
        <strong>Commits Made:</strong> ${game.commits}<br>
        ${game.score === game.bestScore && game.score > 0 ? '<br>🎉 New Best Score!' : ''}
    `;
    elements.startBtn.style.display = 'none';
    elements.restartBtn.style.display = 'inline-block';
    elements.overlay.style.display = 'flex';
} 
function updateUI() {
    elements.scoreElement.textContent = game.score;
    elements.commitsElement.textContent = game.commits;
}
 
function render() {
    const ctx = game.ctx;
    const canvas = game.canvas;
     
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
     
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.3)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += GAME_CONFIG.GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += GAME_CONFIG.GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
     
    game.snake.forEach((segment, index) => {
        const x = segment.x * GAME_CONFIG.GRID_SIZE;
        const y = segment.y * GAME_CONFIG.GRID_SIZE;
        
        if (index === 0) { 
            ctx.fillStyle = '#39d353';
            ctx.shadowColor = '#39d353';
            ctx.shadowBlur = 15;
            ctx.fillRect(x + 1, y + 1, GAME_CONFIG.GRID_SIZE - 2, GAME_CONFIG.GRID_SIZE - 2);
             
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0d1117';
            const eyeSize = 3;
            const eyeOffset = 6;
            
            if (game.direction.x === 1) { // Moving right
                ctx.fillRect(x + GAME_CONFIG.GRID_SIZE - eyeOffset, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + GAME_CONFIG.GRID_SIZE - eyeOffset, y + GAME_CONFIG.GRID_SIZE - 7, eyeSize, eyeSize);
            } else if (game.direction.x === -1) { // Moving left
                ctx.fillRect(x + 3, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + 3, y + GAME_CONFIG.GRID_SIZE - 7, eyeSize, eyeSize);
            } else if (game.direction.y === -1) { // Moving up
                ctx.fillRect(x + 4, y + 3, eyeSize, eyeSize);
                ctx.fillRect(x + GAME_CONFIG.GRID_SIZE - 7, y + 3, eyeSize, eyeSize);
            } else if (game.direction.y === 1) { // Moving down
                ctx.fillRect(x + 4, y + GAME_CONFIG.GRID_SIZE - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + GAME_CONFIG.GRID_SIZE - 7, y + GAME_CONFIG.GRID_SIZE - eyeOffset, eyeSize, eyeSize);
            }
        } else { 
            const intensity = Math.max(0.3, 1 - (index / game.snake.length) * 0.7);
            ctx.fillStyle = `rgba(57, 211, 83, ${intensity})`;
            ctx.shadowColor = '#39d353';
            ctx.shadowBlur = 5 * intensity;
            ctx.fillRect(x + 2, y + 2, GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);
        }
    });
    
    ctx.shadowBlur = 0; 
    if (game.commit) {
        const x = game.commit.x * GAME_CONFIG.GRID_SIZE;
        const y = game.commit.y * GAME_CONFIG.GRID_SIZE; 
        const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
        const size = (GAME_CONFIG.GRID_SIZE - 6) * pulse;
        const offset = (GAME_CONFIG.GRID_SIZE - size) / 2;
        
        ctx.fillStyle = '#39d353';
        ctx.shadowColor = '#39d353';
        ctx.shadowBlur = 10;
        ctx.fillRect(x + offset, y + offset, size, size);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0d1117';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('•', x + GAME_CONFIG.GRID_SIZE / 2, y + GAME_CONFIG.GRID_SIZE / 2 + 4);
    }
    
    if (game.specialCommit) {
        const x = game.specialCommit.x * GAME_CONFIG.GRID_SIZE;
        const y = game.specialCommit.y * GAME_CONFIG.GRID_SIZE;
        
        const time = Date.now() * 0.01;
        const pulse = Math.sin(time) * 0.15 + 1;
        const rotation = time * 0.1;
        
        ctx.save();
        ctx.translate(x + GAME_CONFIG.GRID_SIZE / 2, y + GAME_CONFIG.GRID_SIZE / 2);
        ctx.rotate(rotation);
        ctx.scale(pulse, pulse);
        
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.fillRect(-GAME_CONFIG.GRID_SIZE / 2 + 2, -GAME_CONFIG.GRID_SIZE / 2 + 2, 
                    GAME_CONFIG.GRID_SIZE - 4, GAME_CONFIG.GRID_SIZE - 4);
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0d1117';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('★', 0, 4);
        
        ctx.restore();
        
        const timerHeight = 3;
        const timerWidth = GAME_CONFIG.GRID_SIZE;
        const timerProgress = game.specialCommit.timer / 300;
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(x, y - 6, timerWidth, timerHeight);
        
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x, y - 6, timerWidth * timerProgress, timerHeight);
    }
    game.particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    });
    
    if (game.gamePaused) {
        ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#39d353';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⏸️', canvas.width / 2, canvas.height / 2 + 16);
    }
}

document.addEventListener('DOMContentLoaded', initGame);
