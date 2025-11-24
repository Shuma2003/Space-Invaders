// Получаем ссылку на элемент canvas
const canvas = document.getElementById('gameCanvas');
// Получаем 2D-контекст для рисования
const ctx = canvas.getContext('2d');

// Состояния игры
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    LEVEL_COMPLETE: 'level_complete'
};

let gameState = GameState.MENU;
let currentLevel = 1;
let score = 0;
let gameRunning = true;

// Создаем объект игрока
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 40,
    width: 40,
    height: 20,
    speed: 5,
    lives: 3
};

// Массив для хранения активных снарядов
const bullets = [];

// Массив для хранения врагов
const enemies = [];

// Массив для хранения снарядов врагов
const enemyBullets = [];

// Объект для отслеживания нажатых клавиш
const keys = {};

// Переменные для управления движением врагов
let enemyDirection = 1;
let enemySpeed = 1;
let enemyShootTimer = 0;
let enemyShootInterval = 120;

// Функция для начала нового уровня
function startNewLevel() {
    currentLevel++;
    enemySpeed = 1 + (currentLevel * 0.3);
    enemyShootInterval = Math.max(40, 120 - (currentLevel * 10));
    bullets.length = 0;
    enemyBullets.length = 0;
    createEnemies();
    gameState = GameState.PLAYING;
}

// Функция для создания врагов с разными типами
function createEnemies() {
    const rows = 5;
    const cols = 10;
    const enemyWidth = 30;
    const enemyHeight = 20;
    const horizontalSpacing = 10;
    const verticalSpacing = 10;
    const startX = 50;
    const startY = 50;
    
    enemies.length = 0;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let type = 'normal';
            let health = 1;
            let points = 10;
            let color = '#00FF00';
            
            // Хардкорные враги в зависимости от уровня и позиции
            if (currentLevel >= 2 && row === 0) {
                type = 'elite';
                health = 2;
                points = 25;
                color = '#FF00FF';
            }
            
            if (currentLevel >= 3 && row <= 1) {
                type = 'tank';
                health = 3;
                points = 50;
                color = '#FF4500';
            }
            
            if (currentLevel >= 4 && col % 3 === 0) {
                type = 'boss';
                health = 4;
                points = 100;
                color = '#FF0000';
            }
            
            const enemy = {
                x: startX + col * (enemyWidth + horizontalSpacing),
                y: startY + row * (enemyHeight + verticalSpacing),
                width: enemyWidth,
                height: enemyHeight,
                alive: true,
                type: type,
                health: health,
                maxHealth: health,
                points: points,
                color: color,
                originalColor: color
            };
            enemies.push(enemy);
        }
    }
}

// Функция для стрельбы врагов
function updateEnemyShooting() {
    enemyShootTimer++;
    
    if (enemyShootTimer >= enemyShootInterval && enemies.length > 0) {
        const livingEnemies = enemies.filter(enemy => enemy.alive);
        if (livingEnemies.length > 0) {
            const shooter = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
            createEnemyBullet(shooter);
            
            // Несколько выстрелов на высоких уровнях
            if (currentLevel >= 3 && Math.random() < 0.3) {
                setTimeout(() => {
                    if (gameState === GameState.PLAYING) {
                        createEnemyBullet(shooter);
                    }
                }, 300);
            }
        }
        enemyShootTimer = 0;
    }
}

// Функция для создания снаряда врага
function createEnemyBullet(enemy) {
    const bullet = {
        x: enemy.x + enemy.width / 2 - 2.5,
        y: enemy.y + enemy.height,
        width: 4,
        height: 8,
        speed: 3 + (currentLevel * 0.5)
    };
    enemyBullets.push(bullet);
}

// Функция для обновления снарядов врагов
function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
        
        // Проверяем столкновение с игроком
        const bullet = enemyBullets[i];
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            
            player.lives--;
            enemyBullets.splice(i, 1);
            
            if (player.lives <= 0) {
                gameOver();
            }
        }
    }
}

// Функция для отрисовки снарядов врагов
function drawEnemyBullets() {
    ctx.fillStyle = '#FF4444';
    for (let i = 0; i < enemyBullets.length; i++) {
        const bullet = enemyBullets[i];
        ctx.beginPath();
        ctx.ellipse(
            bullet.x + bullet.width / 2,
            bullet.y + bullet.height / 2,
            bullet.width / 2,
            bullet.height / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }
}

// Функция для обновления врагов
function updateEnemies() {
    let shouldChangeDirection = false;
    let shouldMoveDown = false;
    let allEnemiesDead = true;
    
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        if (enemy.alive) {
            allEnemiesDead = false;
            
            // Двигаем врага
            enemy.x += enemySpeed * enemyDirection;
            
            // Проверяем, достиг ли враг края экрана
            if (enemyDirection === 1 && enemy.x + enemy.width > canvas.width - 10) {
                shouldChangeDirection = true;
                shouldMoveDown = true;
            } else if (enemyDirection === -1 && enemy.x < 10) {
                shouldChangeDirection = true;
                shouldMoveDown = true;
            }
            
            // Проверяем условие проигрыша
            if (enemy.y + enemy.height >= player.y) {
                gameOver();
                return;
            }
        }
    }
    
    // Если все враги мертвы - завершаем уровень
    if (allEnemiesDead) {
        levelComplete();
        return;
    }
    
    // Если нужно изменить направление и опуститься
    if (shouldChangeDirection) {
        enemyDirection *= -1;
        
        if (shouldMoveDown) {
            for (let i = 0; i < enemies.length; i++) {
                if (enemies[i].alive) {
                    enemies[i].y += 15 + (currentLevel * 2);
                }
            }
        }
    }
}

// Функция завершения уровня
function levelComplete() {
    gameState = GameState.LEVEL_COMPLETE;
    score += currentLevel * 100;
}

// Функция завершения игры
function gameOver() {
    gameState = GameState.GAME_OVER;
    gameRunning = false;
}

// Функция возврата в главное меню
function returnToMenu() {
    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    score = 0;
    currentLevel = 1;
    enemyDirection = 1;
    enemySpeed = 1;
    player.lives = 3;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 40;
    gameRunning = true;
    gameState = GameState.MENU;
}

// Функция начала новой игры
function startNewGame() {
    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    score = 0;
    currentLevel = 1;
    enemyDirection = 1;
    enemySpeed = 1;
    player.lives = 3;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 40;
    gameRunning = true;
    gameState = GameState.PLAYING;
    
    createEnemies();
}

// Функция для отрисовки счета и информации
function drawUI() {
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Счет: ${score}`, 10, 25);
    ctx.fillText(`Уровень: ${currentLevel}`, 10, 50);
    ctx.fillText(`Жизни: ${player.lives}`, canvas.width - 100, 25);
    
    // Рисуем жизни в виде сердечек
    for (let i = 0; i < player.lives; i++) {
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(canvas.width - 80 + i * 20, 40, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Функция для отрисовки главного меню
function drawMenu() {
    // Фон с звездами
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Звезды
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
    }
    
    // Заголовок
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE INVADERS', canvas.width / 2, canvas.height / 2 - 80);
    
    // Инструкции
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Управление:', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText('← → - Движение', canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('ПРОБЕЛ - Стрельба', canvas.width / 2, canvas.height / 2 + 40);
    
    // Кнопка старта
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 80, 200, 50);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('НАЧАТЬ ИГРУ', canvas.width / 2, canvas.height / 2 + 110);
    
    // Типы врагов
    ctx.font = '16px Arial';
    ctx.fillStyle = '#00FF00';
    ctx.fillText('● Обычный - 10 очков', canvas.width / 2, canvas.height / 2 + 160);
    ctx.fillStyle = '#FF00FF';
    ctx.fillText('● Элитный - 25 очков (2 удара)', canvas.width / 2, canvas.height / 2 + 185);
    ctx.fillStyle = '#FF4500';
    ctx.fillText('● Танк - 50 очков (3 удара)', canvas.width / 2, canvas.height / 2 + 210);
    ctx.fillStyle = '#FF0000';
    ctx.fillText('● Босс - 100 очков (4 удара)', canvas.width / 2, canvas.height / 2 + 235);
    
    ctx.textAlign = 'left';
}

// Функция для отрисовки экрана завершения уровня
function drawLevelComplete() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00FF00';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`УРОВЕНЬ ${currentLevel - 1} ПРОЙДЕН!`, canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Бонус: +${(currentLevel - 1) * 100} очков`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Нажми ПРОБЕЛ для продолжения', canvas.width / 2, canvas.height / 2 + 50);
    
    ctx.textAlign = 'left';
}

// Функция для отрисовки экрана Game Over
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'red';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Финальный счет: ${score}`, canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`Достигнут уровень: ${currentLevel}`, canvas.width / 2, canvas.height / 2);
    
    // Кнопка возврата в меню
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(canvas.width / 2 - 120, canvas.height / 2 + 40, 240, 50);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('ВЕРНУТЬСЯ В МЕНЮ', canvas.width / 2, canvas.height / 2 + 70);
    
    ctx.textAlign = 'left';
}

// Функция для проверки столкновений
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        let bulletHit = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (enemy.alive && 
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                enemy.health--;
                enemy.color = '#FFFFFF';
                setTimeout(() => {
                    if (enemy.alive) enemy.color = enemy.originalColor;
                }, 50);
                
                if (enemy.health <= 0) {
                    enemy.alive = false;
                    score += enemy.points;
                }
                
                bulletHit = true;
                bullets.splice(i, 1);
                break;
            }
        }
    }
}

// Улучшенная функция для отрисовки врагов
function drawEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        if (enemy.alive) {
            // Рисуем тело врага
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Полоска здоровья для хардкорных врагов
            if (enemy.maxHealth > 1) {
                const healthWidth = (enemy.width * enemy.health) / enemy.maxHealth;
                ctx.fillStyle = enemy.health > enemy.maxHealth * 0.5 ? '#00FF00' : 
                               enemy.health > enemy.maxHealth * 0.25 ? '#FFFF00' : '#FF0000';
                ctx.fillRect(enemy.x, enemy.y - 8, healthWidth, 3);
                ctx.strokeStyle = '#333';
                ctx.strokeRect(enemy.x, enemy.y - 8, enemy.width, 3);
            }
            
            // Рисуем глаза в зависимости от типа
            ctx.fillStyle = enemy.type === 'boss' ? '#FFFF00' : 'white';
            const eyeSize = enemy.type === 'boss' ? 4 : 3;
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 3, enemy.y + enemy.height / 3, eyeSize, 0, Math.PI * 2);
            ctx.arc(enemy.x + enemy.width * 2 / 3, enemy.y + enemy.height / 3, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Рот для боссов
            if (enemy.type === 'boss') {
                ctx.fillStyle = '#FF4444';
                ctx.fillRect(enemy.x + enemy.width / 3, enemy.y + enemy.height * 2/3, enemy.width / 3, 2);
            }
        }
    }
}

// Функция для создания снаряда игрока
function createBullet() {
    if (gameState !== GameState.PLAYING) return;
    
    const bullet = {
        x: player.x + player.width / 2 - 2.5,
        y: player.y - 10,
        width: 5,
        height: 10,
        speed: -7
    };
    bullets.push(bullet);
}

// Функция для обновления снарядов игрока
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y += bullets[i].speed;
        
        if (bullets[i].y + bullets[i].height < 0) {
            bullets.splice(i, 1);
        }
    }
}

// Функция для отрисовки снарядов игрока
function drawBullets() {
    ctx.fillStyle = 'yellow';
    for (let i = 0; i < bullets.length; i++) {
        // Создаем эффект свечения
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'yellow';
        ctx.beginPath();
        ctx.ellipse(
            bullets[i].x + bullets[i].width / 2,
            bullets[i].y + bullets[i].height / 2,
            bullets[i].width / 2,
            bullets[i].height / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Улучшенная функция для рисования игрока
function drawPlayer() {
    // Создаем эффект свечения для игрока
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#4169E1';
    
    // Рисуем основу пушки
    ctx.fillStyle = '#4169E1';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x + player.width * 0.6, player.y);
    ctx.lineTo(player.x + player.width * 0.4, player.y);
    ctx.closePath();
    ctx.fill();
    
    // Рисуем дуло
    ctx.fillStyle = '#FF4500';
    ctx.shadowColor = '#FF4500';
    ctx.fillRect(player.x + player.width / 2 - 3, player.y - 15, 6, 15);
    
    ctx.shadowBlur = 0;
}

// Функция для обновления позиции игрока
function updatePlayer() {
    if (gameState !== GameState.PLAYING) return;
    
    if (keys[37]) {
        player.x -= player.speed;
        if (player.x < 0) {
            player.x = 0;
        }
    }
    
    if (keys[39]) {
        player.x += player.speed;
        if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
        }
    }
}

// Обработчики событий клавиатуры
document.addEventListener('keydown', function(event) {
    keys[event.keyCode] = true;
    
    if (event.keyCode === 32) { // Пробел
        if (gameState === GameState.MENU) {
            startNewGame();
        } else if (gameState === GameState.LEVEL_COMPLETE) {
            startNewLevel();
        } else if (gameState === GameState.PLAYING) {
            createBullet();
        } else if (gameState === GameState.GAME_OVER) {
            returnToMenu();
        }
    }
    
    // Enter также возвращает в меню
    if (event.keyCode === 13 && gameState === GameState.GAME_OVER) {
        returnToMenu();
    }
});

document.addEventListener('keyup', function(event) {
    keys[event.keyCode] = false;
});

// Обработчик клика для меню и Game Over
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (gameState === GameState.MENU) {
        // Проверяем клик по кнопке "Начать игру"
        if (x >= canvas.width / 2 - 100 && x <= canvas.width / 2 + 100 &&
            y >= canvas.height / 2 + 80 && y <= canvas.height / 2 + 130) {
            startNewGame();
        }
    } else if (gameState === GameState.GAME_OVER) {
        // Проверяем клик по кнопке "Вернуться в меню"
        if (x >= canvas.width / 2 - 120 && x <= canvas.width / 2 + 120 &&
            y >= canvas.height / 2 + 40 && y <= canvas.height / 2 + 90) {
            returnToMenu();
        }
    }
});

// Игровой цикл
function gameLoop() {
    // Очищаем весь холст
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    switch (gameState) {
        case GameState.MENU:
            drawMenu();
            break;
            
        case GameState.PLAYING:
            updatePlayer();
            updateBullets();
            updateEnemyBullets();
            updateEnemies();
            updateEnemyShooting();
            checkCollisions();
            
            drawPlayer();
            drawBullets();
            drawEnemyBullets();
            drawEnemies();
            drawUI();
            break;
            
        case GameState.LEVEL_COMPLETE:
            drawLevelComplete();
            break;
            
        case GameState.GAME_OVER:
            drawGameOver();
            break;
    }
    
    requestAnimationFrame(gameLoop);
}

// Запускаем игровой цикл
gameLoop();

// Добавляем эффект мерцания звезд в меню
let starTwinkle = 0;
setInterval(() => {
    if (gameState === GameState.MENU) {
        starTwinkle = (starTwinkle + 1) % 60;
    }
}, 100);