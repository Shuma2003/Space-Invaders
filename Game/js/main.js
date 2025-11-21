// Получаем ссылку на элемент canvas
const canvas = document.getElementById('gameCanvas');
// Получаем 2D-контекст для рисования
const ctx = canvas.getContext('2d');

// Создаем объект игрока
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 40,
    width: 40,
    height: 20,
    speed: 5
};

// Массив для хранения активных снарядов
const bullets = [];

// Массив для хранения врагов
const enemies = [];

// Объект для отслеживания нажатых клавиш
const keys = {};

// Переменные для управления движением врагов
let enemyDirection = 1; // 1 - вправо, -1 - влево
let enemySpeed = 1;

// Переменная для счета
let score = 0;

// Переменная для отслеживания состояния игры
let gameRunning = true;

// Функция для обновления врагов
function updateEnemies() {
    // Если все враги убиты, начинаем новый раунд
    if (enemies.length === 0 || !enemies.some(enemy => enemy.alive)) {
        createEnemies();
        // Увеличиваем скорость врагов с каждым раундом
        enemySpeed += 0.5;
        return;
    }
    
    let shouldChangeDirection = false;
    let shouldMoveDown = false;
    
    // Обновляем позиции всех живых врагов
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        if (enemy.alive) {
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
    
    // Если нужно изменить направление и опуститься
    if (shouldChangeDirection) {
        enemyDirection *= -1;
        
        if (shouldMoveDown) {
            for (let i = 0; i < enemies.length; i++) {
                if (enemies[i].alive) {
                    enemies[i].y += 20; // Опускаем врагов вниз
                }
            }
        }
    }
}

// Функция завершения игры
function gameOver() {
    gameRunning = false;
    console.log('GAME OVER');
}

// Функция перезапуска игры
function restartGame() {
    // Сбрасываем состояние игры
    bullets.length = 0;
    enemies.length = 0;
    score = 0;
    enemyDirection = 1;
    enemySpeed = 1;
    gameRunning = true;
    
    // Сбрасываем позицию игрока
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 40;
    
    // Создаем новых врагов
    createEnemies();
    
    // Перезапускаем игровой цикл
    gameLoop();
}

// Функция для отрисовки счета
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Счет: ${score}`, 10, 30);
}

// Функция для отрисовки экрана Game Over
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'red';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Финальный счет: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Нажми ПРОБЕЛ для перезапуска', canvas.width / 2, canvas.height / 2 + 50);
    
    ctx.textAlign = 'left'; // Возвращаем выравнивание по умолчанию
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
                
                enemy.alive = false;
                bulletHit = true;
                score += 10; // Увеличиваем счет на 10 очков
                break;
            }
        }
        
        if (bulletHit) {
            bullets.splice(i, 1);
        }
    }
}

// Функция для создания врагов
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
            const enemy = {
                x: startX + col * (enemyWidth + horizontalSpacing),
                y: startY + row * (enemyHeight + verticalSpacing),
                width: enemyWidth,
                height: enemyHeight,
                alive: true
            };
            enemies.push(enemy);
        }
    }
}

// Улучшенная функция для отрисовки врагов
function drawEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        if (enemy.alive) {
            // Рисуем тело врага (инопланетянина)
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Рисуем глаза
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 3, enemy.y + enemy.height / 3, 3, 0, Math.PI * 2);
            ctx.arc(enemy.x + enemy.width * 2 / 3, enemy.y + enemy.height / 3, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Функция для создания снаряда
function createBullet() {
    if (!gameRunning) return;
    
    const bullet = {
        x: player.x + player.width / 2 - 2.5,
        y: player.y - 10,
        width: 5,
        height: 10,
        speed: -7
    };
    bullets.push(bullet);
}

// Функция для обновления снарядов
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y += bullets[i].speed;
        
        if (bullets[i].y + bullets[i].height < 0) {
            bullets.splice(i, 1);
        }
    }
}

// Функция для отрисовки снарядов
function drawBullets() {
    ctx.fillStyle = 'yellow';
    for (let i = 0; i < bullets.length; i++) {
        // Рисуем снаряд как вытянутый эллипс
        ctx.beginPath();
        ctx.ellipse(
            bullets[i].x + bullets[i].width / 2,
            bullets[i].y + bullets[i].height / 2,
            bullets[i].width / 2,
            bullets[i].height / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }
}

// Улучшенная функция для рисования игрока
function drawPlayer() {
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
    ctx.fillRect(player.x + player.width / 2 - 3, player.y - 15, 6, 15);
}

// Функция для обновления позиции игрока
function updatePlayer() {
    if (!gameRunning) return;
    
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
        if (!gameRunning) {
            restartGame();
        } else {
            createBullet();
        }
    }
});

document.addEventListener('keyup', function(event) {
    keys[event.keyCode] = false;
});

// Игровой цикл
function gameLoop() {
    // Очищаем весь холст
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameRunning) {
        // Обновляем игровое состояние
        updatePlayer();
        updateBullets();
        updateEnemies();
        checkCollisions();
        
        // Отрисовываем игровые объекты
        drawPlayer();
        drawBullets();
        drawEnemies();
        drawScore();
        
        // Запускаем следующий кадр
        requestAnimationFrame(gameLoop);
    } else {
        // Рисуем экран Game Over
        drawGameOver();
    }
}

// Создаем врагов при старте игры
createEnemies();

// Запускаем игровой цикл
gameLoop();