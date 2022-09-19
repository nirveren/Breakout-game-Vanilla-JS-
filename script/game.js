const canvas = document.getElementById('breakout');
canvas.width = innerWidth;
canvas.height = innerHeight;
const ctx = canvas.getContext('2d');

document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler)

let game = {
    requestId: null,
    timeoutId: null,
    leftKey: false,
    rightKey: false,
    on: false,
    music: true,
    sfx: true
}
let paddle = {
    height: 30,
    width: 150,
    get y() { return canvas.height - this.height; }
    
}
let ball = {
    radius: 10
};
let brick = {
    rows: 6,
    cols: 9,
    get width() { return canvas.width / this.cols; },
    height: 30
}
let images = {
    background: new Image(),
    ball: new Image(),
    paddle: new Image()
}

 let scoreHigh = []; 

function onImageLoad(e) {
    resetGame();
    initBricks();
    resetPaddle();
    paint();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'lime';
    ctx.fillText('PRESS START', canvas.width / 2 - 120, canvas.height / 2);
};
images.background.addEventListener('load', onImageLoad);
images.background.src = './img/7e2d7bea4ac21388c4a96e1371f375c4ce00094b.jpeg';
images.ball.src = './img/ball.webp';
images.paddle.src = './img/paddle.webp';

const sounds = {
    ballLost: new Audio('./sounds/sounds_ball-lost.mp3'),
    breakout: new Audio('./sounds/sounds_breakout.mp3'),
    brick: new Audio('./sounds/sounds_brick.mp3'),
    gameOver: new Audio('./sounds/sounds_game-over.mp3'),
    levelCompleted: new Audio('./sounds/sounds_level-completed.mp3'),
    music: new Audio('./sounds/sounds__music.mp3'),
    paddle: new Audio('./sounds/sounds_paddle.mp3')
}

let brickField = [];

function play() {
    cancelAnimationFrame(game.requestId);
    clearTimeout(game.timeoutId);
    game.on = true;

    resetGame();
    resetBall();
    resetPaddle();
    initBricks();
    game.sfx && sounds.breakout.play();
    // Музло поехало
    setTimeout(() => game.music && sounds.music.play(), );

    animate();
}

function resetGame() {
    // game.speed = 9;
    game.score = 0;
    game.level = 1;
    game.lives = 3;
    game.time = { start: performance.now(), elapsed: 0, refreshRate: 16 };
    const url = new URL(window.location.href)
    const easyCategory = url.searchParams.get('Easy');
    const normCategory = url.searchParams.get('Normal');
    const hardCategory = url.searchParams.get('Hard');
    if (normCategory) {
        game.speed = 10
    } if (easyCategory) {
        game.speed = 8
    } if (hardCategory) {
        game.speed = 12
    }
}



function initSounds() {
    sounds.music.loop = true;
    for (const [key] of Object.entries(sounds)) {
        sounds[key].volume = 0.5;
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - paddle.height - 2 * ball.radius;
    ball.dx = game.speed * (Math.random() * 2 - 1);  // Рандомная траектория
    ball.dy = -game.speed; 
}

function resetPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.dx = game.speed + 20;
}

function initBricks() {
    brickField = [];
    const topMargin = 30;
    const colors = ['red', 'red', 'blue', 'green', 'white'];

    for (let row = 0; row < brick.rows; row++) {
        for (let col = 0; col < brick.cols; col++) {
            brickField.push({
                x: col * brick.width,
                y: row * brick.height + topMargin,
                height: brick.height,
                width: brick.width,
                color: colors[row],
                points: (6 - row) * 2,
                hitsLeft: row === 1 ? 2 : 1
            });
        }
    }
}

function animate(now = 0) {
    game.time.elapsed = now - game.time.start;
    if (game.time.elapsed > game.time.refreshRate) {
        game.time.start = now;

        paint();
        update();
        detectCollision();
        detectBrickCollision();
        if (isLevelCompleted() || isGameOver()) return;
    }

    game.requestId = requestAnimationFrame(animate);
}

function paint() {
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(images.ball, ball.x, ball.y, 2 * ball.radius, 2 * ball.radius);
    ctx.drawImage(images.paddle, paddle.x, paddle.y, paddle.width, paddle.height);
    drawBricks();
    drawScore();
    drawLives();
}

function update() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (game.rightKey) {
        paddle.x += paddle.dx;
        if (paddle.x + paddle.width > canvas.width) {
            paddle.x = canvas.width - paddle.width;
        }
    }
    if (game.leftKey) {
        paddle.x -= paddle.dx;
        if (paddle.x < 0) {
            paddle.x = 0;
        }
    }
}

function drawBricks() {
    brickField.forEach((brick) => {
        if (brick.hitsLeft) {
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }
    });
}

function drawScore() {
    ctx.font = '24px ArcadeClassic';
    ctx.fillStyle = 'white';
    const { level, score } = game;
    ctx.fillText(`Level: ${level}`, 5, 23);
    ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, 23);
    
}

function drawLives() {
    if (game.lives > 2) { ctx.drawImage(images.paddle, canvas.width - 150, 9, 40, 13); }
    if (game.lives > 1) { ctx.drawImage(images.paddle, canvas.width - 100, 9, 40, 13); }
    if (game.lives > 0) { ctx.drawImage(images.paddle, canvas.width - 50, 9, 40, 13); }
}

function detectCollision() {
    const hitTop = () => ball.y < 0;
    const hitLeftWall = () => ball.x < 0;
    const hitRightWall = () => ball.x + ball.radius * 2 > canvas.width;
    const hitPaddle = () =>
        ball.y + 2 * ball.radius > canvas.height - paddle.height &&
        ball.y + ball.radius < canvas.height &&
        ball.x + ball.radius > paddle.x &&
        ball.x + ball.radius < paddle.x + paddle.width;

    if (hitLeftWall()) {
        ball.dx = -ball.dx;
        ball.x = 0;
    }
    if (hitRightWall()) {
        ball.dx = -ball.dx;
        ball.x = canvas.width - 2 * ball.radius;
    }
    if (hitTop()) {
        ball.dy = -ball.dy;
        ball.y = 0;
    }
    if (hitPaddle()) {
        ball.dy = -ball.dy;
        ball.y = canvas.height - paddle.height - 2 * ball.radius;
        game.sfx && sounds.paddle.play();
        const drawingConst = 5
        const paddleMiddle = 2;
        const algo = (((ball.x - paddle.x) / paddle.width) * drawingConst);
        ball.dx = ball.dx + algo - paddleMiddle;
    }
}

function detectBrickCollision() {
    let directionChanged = false;
    const isBallInsideBrick = (brick) =>
        ball.x + 2 * ball.radius > brick.x &&
        ball.x < brick.x + brick.width &&
        ball.y + 2 * ball.radius > brick.y &&
        ball.y < brick.y + brick.height;
    brickField.forEach((brick) => {
        if (brick.hitsLeft && isBallInsideBrick(brick)) {
            sounds.brick.currentTime = 0;
            game.sfx && sounds.brick.play();
            brick.hitsLeft--;
            if (brick.hitsLeft === 1) {
                brick.color = 'darkgray';
            }
             game.score = game.score + brick.points;
            if (!directionChanged) {
                directionChanged = true;
                detectCollisionDirection(brick);
            }
            if (game.score > scoreHigh) {
                scoreHigh = game.score;
                localStorage.setItem("KEY_SCORE", scoreHigh);
            }
        }
        
    });
}



function detectCollisionDirection(brick) {
    const hitFromLeft = () => ball.x + 2 * ball.radius - ball.dx <= brick.x;
    const hitFromRight = () => ball.x - ball.dx >= brick.x + brick.width;

    if (hitFromLeft() || hitFromRight()) {
        ball.dx = -ball.dx;
    } else { 
        ball.dy = -ball.dy;
    }
}

function keyDownHandler(e) {
    if (!game.on && e.key === ' ') {
        play();
    }
    if (game.on && (e.key === 'm' || e.key === 'M')) {
        game.music = !game.music;
        game.music ? sounds.music.play() : sounds.music.pause();
    }
    if (game.on && (e.key === 's' || e.key === 'S')) {
        game.sfx = !game.sfx;
    }
    if (e.key === 'ArrowUp') {
        volumeUp();
    }
    if (e.key === 'ArrowDown') {
        volumeDown();
    }
    if (e.key === 'ArrowRight') {
        game.rightKey = true;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'ArrowRight') {
        game.rightKey = false;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = false;
    }
}

function mouseMoveHandler(e) {
    const mouseX = e.clientX - canvas.offsetLeft;
    const isInsideCourt = () => mouseX > 0 && mouseX < canvas.width;

    if (isInsideCourt()) {
        paddle.x = mouseX - paddle.width / 2;
    }
}

function isLevelCompleted() {
    const levelComplete = brickField.every((b) => b.hitsLeft === 0);

    if (levelComplete) {
        initNextLevel();
        resetBall();
        resetPaddle();
        initBricks();
        game.timeoutId = setTimeout(() => {
            animate();
            sounds.music.play();
        }, 3000);

        return true;
    }
    return false;
}

function initNextLevel() {
    game.level++;
    game.speed++;
    sounds.music.pause();
    game.sfx && sounds.levelCompleted.play();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'yellow';
    ctx.fillText(`LEVEL ${game.level}!`, canvas.width / 2 - 80, canvas.height / 2);
}

function isGameOver() {
    const isBallLost = () => ball.y - ball.radius > canvas.height;

    if (isBallLost()) {
        game.lives -= 1;
        game.sfx && sounds.ballLost.play();
        if (game.lives === 0) {
            gameOver();
            return true;
        }
        resetBall();
        resetPaddle();
    }
    return false;
}

function gameOver() {
    game.on = false;
    sounds.music.pause();
    sounds.currentTime = 0;
    game.sfx && sounds.gameOver.play();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'red';
    ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2);
    ctx.fillText('RESTART(Click Space)', canvas.width / 2 - 170, canvas.height /1.7)
}

function volumeDown() {
    if (sounds.music.volume >= 0.1) {
        for (const [key] of Object.entries(sounds)) {
            sounds[key].volume -= 0.1;
        }
    }
}


function volumeUp() {
    if (sounds.music.volume <= 0.9) {
        for (const [key] of Object.entries(sounds)) {
            sounds[key].volume += 0.1;
        }
    }
}

initSounds();
