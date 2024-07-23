const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.speed = 10;
    this.dx = 0;
    this.dy = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x += this.dx;
    this.y += this.dy;

    // Restrict movement to X and Y axis only
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;

    if (this.dx !== 0) this.x += this.dx;
    if (this.dy !== 0) this.y += this.dy;

    // Prevent player from going off screen
    if (this.x - this.radius < 0) this.x = this.radius;
    if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;
    if (this.y - this.radius < 0) this.y = this.radius;
    if (this.y + this.radius > canvas.height) this.y = canvas.height - this.radius;
  }

  move(direction) {
    switch (direction) {
      case 'ArrowUp':
        this.dy = -this.speed;
        break;
      case 'ArrowDown':
        this.dy = this.speed;
        break;
      case 'ArrowLeft':
        this.dx = -this.speed;
        break;
      case 'ArrowRight':
        this.dx = this.speed;
        break;
    }
  }

  stop(direction) {
    switch (direction) {
      case 'ArrowUp':
      case 'ArrowDown':
        this.dy = 0;
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        this.dx = 0;
        break;
    }
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, imageSrc, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.image = new Image();
    this.image.src = imageSrc;
    this.velocity = velocity;
  }

  draw() {
    ctx.drawImage(this.image, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
  }

  update(playerX, playerY) {
    this.draw();
    const angle = Math.atan2(playerY - this.y, playerX - this.x);
    this.velocity = {
      x: Math.cos(angle) * 2,
      y: Math.sin(angle) * 2
    };
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

const player = new Player(canvas.width / 2, canvas.height / 2, 30, 'white');
const projectiles = [];
const enemies = [];
let score = 0;

function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (30 - 10) + 10;
    let x, y;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const imageSrc = 'enemy.png'; // 적 이미지 경로
    const velocity = {
      x: 0,
      y: 0
    };

    enemies.push(new Enemy(x, y, radius, imageSrc, velocity));
  }, 1000);
}

function resetGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  projectiles.length = 0;
  enemies.length = 0;
  score = 0;
  updateScore();
  animate();
}

function updateScore() {
  scoreElement.innerText = `Score: ${score}`;
}

let animationId;
function animate() {
  animationId = requestAnimationFrame(animate);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  player.update();
  projectiles.forEach((projectile, index) => {
    projectile.update();

    // Remove projectiles that go off screen
    if (projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height) {
      setTimeout(() => {
        projectiles.splice(index, 1);
      }, 0);
    }
  });

  enemies.forEach((enemy, index) => {
    enemy.update(player.x, player.y);

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    // End game and reset
    if (dist - enemy.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
      alert(`Game Over! Your score: ${score}`);
      resetGame();
    }

    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // Remove enemies and projectiles that collide and increase score
      if (dist - enemy.radius - projectile.radius < 1) {
        setTimeout(() => {
          enemies.splice(index, 1);
          projectiles.splice(projectileIndex, 1);
          score += 10;
          updateScore();
          console.log(`Score: ${score}`);
        }, 0);
      }
    });
  });
}

window.addEventListener('keydown', (event) => {
  player.move(event.key);
});

window.addEventListener('keyup', (event) => {
  player.stop(event.key);
});

window.addEventListener('click', (event) => {
  const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
  const velocity = {
    x: Math.cos(angle) * 50,  // 총알 속도를 10배로 증가
    y: Math.sin(angle) * 50   // 총알 속도를 10배로 증가
  }
  projectiles.push(new Projectile(player.x, player.y, 5, 'red', velocity));
});

spawnEnemies();
animate();
