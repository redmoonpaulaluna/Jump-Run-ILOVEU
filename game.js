const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

let distance = 0;
let coins = 0;
let speed = 4;
let gameOver = false;
let frameCount = 0;

const player = {
  x: 50,
  y: HEIGHT - 60,
  width: 40,
  height: 50,
  vy: 0,
  gravity: 0.8,
  jumpPower: -14,
  isOnGround: true,
  slide: false,
  normalHeight: 50,
  slideHeight: 30,
};

const obstacles = [];
const coinsArr = [];

// Hilfsfunktion zum Zeichnen der Pikachu-ähnlichen Figur (ganz simpel 2D)
function drawPlayer() {
  let p = player;

  ctx.fillStyle = '#FFCC00'; // gelb
  ctx.strokeStyle = '#331100'; // dunkelbraun
  ctx.lineWidth = 2;

  // Körper
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + p.height);
  ctx.lineTo(p.x, p.y + 15);
  ctx.bezierCurveTo(p.x, p.y, p.x + p.width/2, p.y - 10, p.x + p.width, p.y + 15);
  ctx.lineTo(p.x + p.width, p.y + p.height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ohren
  ctx.fillStyle = '#331100';
  ctx.beginPath();
  ctx.moveTo(p.x + 10, p.y + 5);
  ctx.lineTo(p.x + 15, p.y - 20);
  ctx.lineTo(p.x + 20, p.y + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(p.x + p.width - 20, p.y + 5);
  ctx.lineTo(p.x + p.width - 15, p.y - 20);
  ctx.lineTo(p.x + p.width - 10, p.y + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wangen rot
  ctx.fillStyle = '#FF6666';
  ctx.beginPath();
  ctx.arc(p.x + 10, p.y + 30, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x + p.width - 10, p.y + 30, 7, 0, Math.PI * 2);
  ctx.fill();

  // Augen
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(p.x + 16, p.y + 20, 3, 0, Math.PI * 2);
  ctx.arc(p.x + p.width - 16, p.y + 20, 3, 0, Math.PI * 2);
  ctx.fill();

  // Nase
  ctx.fillStyle = '#331100';
  ctx.beginPath();
  ctx.moveTo(p.x + p.width/2 - 3, p.y + 33);
  ctx.lineTo(p.x + p.width/2 + 3, p.y + 33);
  ctx.lineTo(p.x + p.width/2, p.y + 38);
  ctx.closePath();
  ctx.fill();

  // Mund
  ctx.strokeStyle = '#331100';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x + p.width/2 - 5, p.y + 42);
  ctx.quadraticCurveTo(p.x + p.width/2, p.y + 48, p.x + p.width/2 + 5, p.y + 42);
  ctx.stroke();
}

// Hindernisse: zwei Arten (hoch & niedrig)
class Obstacle {
  constructor(type) {
    this.type = type;
    this.width = type === 0 ? 30 : 50;
    this.height = type === 0 ? 60 : 30;
    this.x = WIDTH + 20;
    this.y = HEIGHT - this.height - 10;
    this.color = type === 0 ? '#4B0082' : '#8B0000';
  }

  update() {
    this.x -= speed;
  }

  draw() {
    ctx.fillStyle = this.color;
    if (this.type === 0) {
      // hohes Hindernis: Dreieck
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width/2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    } else {
      // niedriges Hindernis: Rechteck mit rotem Balken
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
    }
  }

  isColliding(px, py, pw, ph) {
    return !(px + pw < this.x || px > this.x + this.width || py + ph < this.y || py > this.y + this.height);
  }
}

// Münzen
class Coin {
  constructor() {
    this.radius = 10;
    this.x = WIDTH + 20;
    this.y = HEIGHT - 70 - Math.random() * 50;
  }

  update() {
    this.x -= speed;
  }

  draw() {
    let grad = ctx.createRadialGradient(this.x - 3, this.y - 3, 2, this.x, this.y, this.radius);
    grad.addColorStop(0, '#FFFFA0');
    grad.addColorStop(1, '#FFD700');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#B8860B';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', this.x, this.y);
  }

  isColliding(px, py, pw, ph) {
    let distX = Math.abs(this.x - (px + pw/2));
    let distY = Math.abs(this.y - (py + ph/2));
    if (distX > pw/2 + this.radius) return false;
    if (distY > ph/2 + this.radius) return false;
    if (distX <= pw/2) return true;
    if (distY <= ph/2) return true;
    let dx = distX - pw/2;
    let dy = distY - ph/2;
    return (dx*dx + dy*dy <= this.radius*this.radius);
  }
}

function resetGame() {
  distance = 0;
  coins = 0;
  speed = 4;
  gameOver = false;
  frameCount = 0;
  obstacles.length = 0;
  coinsArr.length = 0;
  player.y = HEIGHT - player.height - 10;
  player.vy = 0;
  player.isOnGround = true;
  gameOverEl.classList.add('hidden');
  loop();
}

function showGameOver() {
  finalScoreEl.textContent = `You reached ${Math.floor(distance)}m and collected ${coins} coins!`;
  gameOverEl.classList.remove('hidden');
}

// Steuerung
document.addEventListener('keydown', e => {
  if (gameOver) return;
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') jump();
  if (e.code === 'ArrowDown' || e.code === 'KeyS') slide(true);
});

document.addEventListener('keyup', e => {
  if (e.code === 'ArrowDown' || e.code === 'KeyS') slide(false);
});

// Touch Steuerung für Mobile
let touchStartY = null;
let touchEndY = null;
canvas.addEventListener('touchstart', e => {
  touchStartY = e.changedTouches[0].clientY;
});
canvas.addEventListener('touchend', e => {
  touchEndY = e.changedTouches[0].clientY;
  if (!touchStartY || !touchEndY) return;
  const diff = touchStartY - touchEndY;
  if (Math.abs(diff) > 30) {
    if (diff > 0) jump();
    else {
      slide(true);
      setTimeout(() => slide(false), 600);
    }
  }
  touchStartY = null;
  touchEndY = null;
});

function jump() {
  if (player.isOnGround && !player.slide) {
    player.vy = player.jumpPower;
    player.isOnGround = false;
  }
}

function slide(enable) {
  player.slide = enable;
  player.height = enable ? player.slideHeight : player.normalHeight;
  player.y = HEIGHT - player.height - 10;
}

function update() {
  if (gameOver) return;

  frameCount++;
  distance += speed * 0.1;
  scoreEl.textContent = `Distance: ${Math.floor(distance)}`;
  coinsEl.textContent = `Coins: ${coins}`;

  // Geschwindigkeit erhöhen alle 300 Frames
  if (frameCount % 300 === 0) speed += 0.3;

  // Spieler Physik
  player.vy += player.gravity;
  player.y += player.vy;
  if (player.y + player.height >= HEIGHT - 10) {
    player.y = HEIGHT - player.height - 10;
    player.vy = 0;
    player.isOnGround = true;
  }

  // Hindernisse erzeugen
  if (frameCount % 120 === 0) {
    const type = Math.random() < 0.5 ? 0 : 1;
    obstacles.push(new Obstacle(type));
  }

  // Münzen erzeugen
  if (frameCount % 100 === 0) {
    coinsArr.push(new Coin());
  }

  // Hindernisse updaten + Kollision prüfen
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();

    if (obstacles[i].isColliding(player.x, player.y, player.width, player.height)) {
      gameOver = true;
      showGameOver();
    }

    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // Münzen updaten + Kollision prüfen
  for (let i = coinsArr.length - 1; i >= 0; i--) {
    coinsArr[i].update();

    if (coinsArr[i].isColliding(player.x, player.y, player.width, player.height)) {
      coins++;
      coinsArr.splice(i, 1);
    } else if (coinsArr[i].x + coinsArr[i].radius < 0) {
      coinsArr.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Boden
  ctx.fillStyle = '#228B22'; // dunkelgrün
  ctx.fillRect(0, HEIGHT
