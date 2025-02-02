const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nitroButton = document.getElementById('nitroButton');
const startbutton = document.getElementById('startButton');

let gameStarted = false;

let player = {
  x: canvas.width / 2 - 120,
  y: canvas.height, // start outside the canvas
  width: 70,
  height: 130,
  step: 2,
  lineSpeed: 5,
  laneWidth: canvas.width / 4,
  lane: 1,
  targetY: canvas.height - 240, // target position
  start: true,
  nitroActive: false,
};

let keys = {
  ArrowLeft: false,
  ArrowRight: false,
};

// roadlines
let roadLines = [];
const lineSpacing = 50;
const lineHeight = 100;
const lineWidth = 10;

// random cars
let randomCars = [];
const randomWidth = 70;
const randomHeight = 130;
const randomBaseSpeed = 4;
const randomCarImages = [
  new Image(),
  new Image(),
  new Image(),
  new Image(),
];

randomCarImages[0].src = 'image/car-2.png';
randomCarImages[1].src = 'image/car-3.png';
randomCarImages[2].src = 'image/car-4.png';
randomCarImages[3].src = 'image/car-5.png';

// coins
let coins = [];
let coinScore = 0;
const coinWidth = 50;
const coinHeight = 50;
let coinSprites = [];
let currentCoinFrame = 0;
const coinFrameUpdateRate = 10;
let frameCount = 0;

// grass
let grassOffset = 0;
let grassSpeed = 5;

// explosion here
let explosionSprites = [];
let explosionAnimation = {
  active: false,
  x: 0,
  y: 0,
  width: 200,
  height: 200,
  currentFrame: 0,
  frameUpdateRate: 10,
  frameCount: 0
};

function loadCoinSprites() {
  const spritesheetPath = 'image/coins/spritesheet.png';
  const cols = 6;
  const rows = 1;
  const totalSprites = cols;

  coinSprites = Array.from({ length: totalSprites }, () => new Image());

  const spritesheet = new Image();
  spritesheet.src = spritesheetPath;

  spritesheet.addEventListener("load", () => {
    const spritesheetWidth = spritesheet.width;
    const singleSpriteWidth = Math.floor(spritesheetWidth / cols);
    const singleSpriteHeight = spritesheet.height;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = singleSpriteWidth;
    tempCanvas.height = singleSpriteHeight;

    // coins spritesheet
    for (let col = 0; col < cols; col++) {
      tempCtx.clearRect(0, 0, singleSpriteWidth, singleSpriteHeight);
      tempCtx.drawImage(
        spritesheet,
        col * singleSpriteWidth, // x position in spritesheet
        0,                        // y position, always 0
        singleSpriteWidth,
        singleSpriteHeight,
        0,
        0,
        singleSpriteWidth,
        singleSpriteHeight
      );

      coinSprites[col].src = tempCanvas.toDataURL();
    }
  });
}

//explosion here
function loadExplosionSprites() {
  const spritesheetPath = 'image/explosion/spritesheet.png';
  const cols = 5;
  const rows = 1;
  const totalSprites = cols * rows;
  // Calculate the number of rows and columns

  explosionSprites = Array.from({ length: totalSprites }, () => new Image());

  // Load the spritesheet
  const spritesheet = new Image();
  spritesheet.src = spritesheetPath;

  // Add a "load" event listener to the spritesheet
  spritesheet.addEventListener("load", () => {
    const spritesheetWidth = spritesheet.width;
    const singleSpriteWidth = Math.floor(spritesheetWidth / cols);
    const singleSpriteHeight = Math.floor(spritesheet.height / rows);

    // Create a temporary canvas to extract sprites from the spritesheet
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = singleSpriteWidth;
    tempCanvas.height = singleSpriteHeight;

    // Loop through each sprite's row and column position
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {

        // Clear the temporary canvas and draw the specific sprite region from the spritesheet
        tempCtx.clearRect(0, 0, singleSpriteWidth, singleSpriteHeight);
        tempCtx.drawImage(
          spritesheet,
          col * singleSpriteWidth, //x position
          //row * singleSpriteHeight,
          0,                        //y position
          singleSpriteWidth,
          singleSpriteHeight,
          0,
          0,
          singleSpriteWidth,
          singleSpriteHeight
        );

        // assign it to the corresponding Image object
        const index = row * cols + col;
        explosionSprites[index].src = tempCanvas.toDataURL();
      }
    }
  });
}

function drawRandomCar() {
  let currentSpeed = randomBaseSpeed;
  if (player.nitroActive === true) {
    currentSpeed = randomBaseSpeed * 2;
  }
  const randomLane = Math.floor(Math.random() * 4);
  const newRandomCar = {
    x: randomLane * player.laneWidth + (player.laneWidth - randomWidth) / 2,
    y: -randomHeight,
    width: randomWidth,
    height: randomHeight,
    image: randomCarImages[Math.floor(Math.random() * randomCarImages.length)],
    //speed: player.nitroActive === true ? randomBaseSpeed / 2 : randomBaseSpeed,
    speed: currentSpeed
  };
  randomCars.push(newRandomCar);
}

// roadlines spaced so they always fill canvas height
for (let i = 0; i < Math.ceil(canvas.height / (lineHeight + lineSpacing)) + 1; i++) {
  roadLines.push({
    x: canvas.width / 2 - lineWidth / 2,
    y: i * (lineHeight + lineSpacing),
    width: lineWidth,
    height: lineHeight,
  });
  roadLines.push({
    x: canvas.width * 0.25 - lineWidth / 2,
    y: i * (lineHeight + lineSpacing),
    width: lineWidth,
    height: lineHeight,
  });
  roadLines.push({
    x: canvas.width * 0.75 - lineWidth / 2,
    y: i * (lineHeight + lineSpacing),
    width: lineWidth,
    height: lineHeight,
  });
}

document.addEventListener('keydown', function (event) {
  keys[event.key] = true;
  updateLane(event.key);
  
  if (event.key === 'n') {
    activateNitro();
  }
});

document.addEventListener('keyup', function (event) {
  keys[event.key] = false;
});

function updateLane(key) {
  if ((key === 'ArrowLeft' || key === 'a') && player.lane > 0) {
    player.lane--;
  }
  if ((key === 'ArrowRight' || key === 'd') && player.lane < 3) {
    player.lane++;
  }
}

function activateNitro() {
  if (!player.nitroActive) {
    player.nitroActive = true;
    player.lineSpeed *= 2; //double speed
    grassSpeed *= 2;
    randomCars.forEach((car) => (car.speed *= 2));
    coins.forEach((coin) => (coin.speed *= 2));
    setTimeout(() => {
      player.lineSpeed /= 2;
      grassSpeed /= 2;
      randomCars.forEach((car) => (car.speed /= 2));
      coins.forEach((coin) => (coin.speed /= 2));
      player.nitroActive = false;
    }, 4000);
  }
}

nitroButton.addEventListener('click', activateNitro);

function gameLoop() {
  if (player.start) {
    updateGameState();
    drawGame();
    animateGrass();
    requestAnimationFrame(gameLoop);
  }
}

function updateGameState() {

  if (player.y > player.targetY) {
    player.y -= player.step;
    if (player.y < player.targetY) {
      player.y = player.targetY;
    }
  }

  // Update roadlines with consistent spacing
  roadLines.forEach((line) => {
    line.y += player.lineSpeed;

    // Reset the line to the top when it moves out of bounds
    if (line.y > canvas.height) {
      const minY = Math.min(
        ...roadLines.filter((l) => l.x === line.x).map((l) => l.y)
      );
      line.y = minY - (lineHeight + lineSpacing);
    }
  });

  randomCars.forEach((car, index) => {
    car.y += car.speed;

    if (checkCollision(player, car)) {
      gameOver();
    }

    if (car.y > canvas.height) {
      randomCars.splice(index, 1);
    }
  });

  let targetX = player.lane * player.laneWidth + (player.laneWidth - player.width) / 2;
  //player.x = player.lane * player.laneWidth + (player.laneWidth - player.width) / 2;
  player.x = interpolateXPosition(player.x, targetX, 0.2);

  // update coins
  coins.forEach((coin, index) => {
    coin.y += coin.speed;

    // collision
    if (checkCollision(player, coin)) {
      coins.splice(index, 1);  // remove the coin
      coinScore++;
    }

    // remove coins that go off screen
    if (coin.y > canvas.height) {
      coins.splice(index, 1);
    }
  });
}

function interpolateXPosition(startX, goalX, t) {
  return startX + (goalX - startX) * t;
}

const carImage = new Image();
carImage.src = 'image/car.png';

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  roadLines.forEach((line) => {
    ctx.fillRect(line.x, line.y, line.width, line.height);
  });

  randomCars.forEach((car) => {
    ctx.drawImage(car.image, car.x, car.y, car.width, car.height);
  });

  if (player.start) {
    ctx.drawImage(carImage, player.x, player.y, player.width, player.height);
  }

  // draw coins
  ctx.fillStyle = 'gold';
  coins.forEach(coin => {
    ctx.drawImage(coinSprites[currentCoinFrame], coin.x, coin.y, coinWidth, coinHeight);
  });

  // coin animation
  frameCount++;
  if (frameCount >= coinFrameUpdateRate) {
    currentCoinFrame = (currentCoinFrame + 1) % coinSprites.length;
    frameCount = 0;
  }

  ctx.drawImage(coinSprites[currentCoinFrame], 20, 10, 30, 30); 
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(`${coinScore}`, 60, 30);
  
  

  console.log("active: " + explosionAnimation.active + " - length: " + explosionSprites.length)
  // explosion here
  if (explosionAnimation.active) {
    console.log("Drawing explosion frame: " + explosionAnimation.currentFrame + " frameCount: " + explosionAnimation.frameCount);
    explosionAnimation.frameCount++;
    if (explosionAnimation.frameCount >= explosionAnimation.frameUpdateRate) {
      explosionAnimation.currentFrame++;
      explosionAnimation.frameCount = 0;

      if (explosionAnimation.currentFrame >= explosionSprites.length) {
        explosionAnimation.active = false;
        console.log("Explosion animation complete");
      }
    }

    if (explosionAnimation.active && explosionSprites[explosionAnimation.currentFrame]) {
      ctx.drawImage(
        explosionSprites[explosionAnimation.currentFrame],
        explosionAnimation.x,
        explosionAnimation.y,
        explosionAnimation.width,
        explosionAnimation.height
      );
    }
  }
}

function animateGrass() {
  grassOffset += grassSpeed;
  if (grassOffset >= 600) {
    grassOffset = 0;
  }

  const grassLeft1 = document.getElementById('grassLeft1');
  const grassLeft2 = document.getElementById('grassLeft2');
  const grassRight1 = document.getElementById('grassRight1');
  const grassRight2 = document.getElementById('grassRight2');

  // intial image position
  grassLeft1.style.transform = `translateY(${grassOffset}px)`;
  grassRight1.style.transform = `translateY(${grassOffset}px)`;

  // make the same image appear again right after the first one
  grassLeft2.style.transform = `translateY(${grassOffset - 600}px)`;
  grassRight2.style.transform = `translateY(${grassOffset - 600}px)`;
}

function startGame() {
  if (!gameStarted) {
    nitroButton.hidden = false;
    document.getElementById('startScreen').style.display = 'none';
    gameStarted = true;

    loadCoinSprites();
    loadExplosionSprites(); //explosion here
    setInterval(drawRandomCar, 2000);
    setInterval(createCoin, 1500);
    requestAnimationFrame(gameLoop);
  }
}

startbutton.addEventListener('click', startGame);

function createCoin() {
  let currentSpeed = randomBaseSpeed;
  if (player.nitroActive === true) {
    currentSpeed = randomBaseSpeed * 2;
  }
  const randomLane = Math.floor(Math.random() * 4);
  const newCoin = {
    x: randomLane * player.laneWidth + (player.laneWidth - coinWidth) / 2,
    y: -coinHeight,
    width: coinWidth,
    height: coinHeight,
    speed: currentSpeed
  };

  // don't place coins over random cars
  const hasOverlap = randomCars.some(car => {
    const bufferZone = 100;
    const extendedCar = {
      ...car,
      y: car.y - bufferZone,
      height: car.height + bufferZone * 2
    };
    return checkCollision(newCoin, extendedCar);
  });

  if (!hasOverlap) {
    coins.push(newCoin);
  }
}

//collison detection func
function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y;
}

function gameOver() {
  console.log("Game Over triggered");
  player.start = false;
  
  const collidingCar = randomCars.find(car => checkCollision(player, car));
  
  // collision point
  explosionAnimation.x = (player.x + collidingCar.x) / 2 - explosionAnimation.width / 2 + 2;
  explosionAnimation.y = (player.y + collidingCar.y) / 2 - explosionAnimation.height / 2 + 2;
  
  explosionAnimation.active = true;
  explosionAnimation.currentFrame = 0;
  explosionAnimation.frameCount = 0;
  
  function explosionLoop() {
    if (explosionAnimation.active) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawGame();
      
      if (explosionSprites[explosionAnimation.currentFrame]) {
        ctx.drawImage(
          explosionSprites[explosionAnimation.currentFrame],
          explosionAnimation.x,
          explosionAnimation.y,
          explosionAnimation.width,
          explosionAnimation.height
        );
      }
      // Update frame counter
      explosionAnimation.frameCount++;
      if (explosionAnimation.frameCount <= explosionAnimation.frameUpdateRate) {
        explosionAnimation.currentFrame++;
        explosionAnimation.frameCount = 0;
        
        console.log("Current frame:", explosionAnimation.currentFrame);
        console.log("Total frames:", explosionSprites.length);
        
        if (explosionAnimation.currentFrame >= explosionSprites.length) {
          console.log("Animation complete, game over screen");
          explosionAnimation.active = false;
          randomCars = []; 
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawGame();
          
          showGameOverScreen();
          return; 
        }
      }
      
      requestAnimationFrame(explosionLoop);
    }
  }
  
  explosionLoop();
}

function showGameOverScreen() {
  // Get the current best score from localStorage, default to 0 if not set
  let bestScore = localStorage.getItem('bestScore') || 0;
  
  // Update best score if current score is higher
  if (coinScore > bestScore) {
    bestScore = coinScore;
    localStorage.setItem('bestScore', bestScore);
  }

  console.log("Game over screen");
  const gameOverScreen = document.createElement('div');
  gameOverScreen.id = 'gameOverScreen';
  gameOverScreen.innerHTML = `
    <h1>Game Over!</h1>
    <p><b>Collected: ${coinScore} coins</b></p>
    <p>Best Score: ${bestScore} coins</p>
    <button onclick="location.reload()">Play Again</button>
  `;
  document.body.appendChild(gameOverScreen);
}