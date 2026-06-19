const elements = {
  canvas: document.getElementById("myCanvas"),
  overlay: document.getElementById("gameOverlay"),
  resultText: document.getElementById("gameResult"),
  scoreText: document.getElementById("gameScore"),
  restartButton: document.getElementById("restartButton"),
};

const ctx = elements.canvas.getContext("2d");

const COLORS = {
  ball: "#ff0000",
  primary: "#0095dd",
};

const BALL = {
  radius: 10,
  speedX: 1.4,
  speedY: -1.4,
};

const PADDLE = {
  width: 75,
  height: 10,
  speed: 7,
};

const BRICKS = {
  rows: 3,
  columns: 5,
  width: 75,
  height: 20,
  padding: 10,
  offsetTop: 30,
  offsetLeft: 30,
};

const totalBrickCount = BRICKS.rows * BRICKS.columns;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createInitialState() {
  return {
    ballX: elements.canvas.width / 2,
    ballY: elements.canvas.height - 30,
    ballDx: BALL.speedX,
    ballDy: BALL.speedY,
    paddleX: (elements.canvas.width - PADDLE.width) / 2,
    isRightPressed: false,
    isLeftPressed: false,
    score: 0,
    isGameRunning: true,
  };
}

function createBricks() {
  const createdBricks = [];

  for (let column = 0; column < BRICKS.columns; column++) {
    createdBricks[column] = [];

    for (let row = 0; row < BRICKS.rows; row++) {
      createdBricks[column][row] = {
        x: column * (BRICKS.width + BRICKS.padding) + BRICKS.offsetLeft,
        y: row * (BRICKS.height + BRICKS.padding) + BRICKS.offsetTop,
        isVisible: true,
      };
    }
  }

  return createdBricks;
}

let state = createInitialState();
let bricks = createBricks();
let interval = null;

function endGame(result) {
  state.isGameRunning = false;
  stopGameLoop();
  showEndOverlay(result);
}

function showEndOverlay(result) {
  elements.resultText.textContent = result;
  elements.scoreText.textContent = `Score: ${state.score}`;
  elements.overlay.hidden = false;
  elements.restartButton.focus();
}

function hideEndOverlay() {
  elements.overlay.hidden = true;
}

function resetGame() {
  stopGameLoop();
  state = createInitialState();
  bricks = createBricks();
  hideEndOverlay();
  startGameLoop();
}

function startGameLoop() {
  stopGameLoop();
  interval = setInterval(draw, 10);
}

function stopGameLoop() {
  clearInterval(interval);
  interval = null;
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(state.ballX, state.ballY, BALL.radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ball;
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(
    state.paddleX,
    elements.canvas.height - PADDLE.height,
    PADDLE.width,
    PADDLE.height,
  );
  ctx.fillStyle = COLORS.primary;
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (const column of bricks) {
    for (const brick of column) {
      if (brick.isVisible) {
        ctx.beginPath();
        ctx.rect(brick.x, brick.y, BRICKS.width, BRICKS.height);
        ctx.fillStyle = COLORS.primary;
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function collisionDetection() {
  for (const column of bricks) {
    for (const brick of column) {
      if (isBallTouchingBrick(brick)) {
        state.ballDy = -state.ballDy;
        brick.isVisible = false;
        state.score++;

        if (state.score === totalBrickCount) {
          endGame("YOU WIN");
        }
      }
    }
  }
}

function isBallTouchingBrick(brick) {
  return (
    brick.isVisible &&
    state.ballX > brick.x &&
    state.ballX < brick.x + BRICKS.width &&
    state.ballY > brick.y &&
    state.ballY < brick.y + BRICKS.height
  );
}

function drawScore() {
  ctx.font = "16px Arial";
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(`Score: ${state.score}`, 8, 20);
}

function updatePaddlePosition() {
  if (state.isRightPressed) {
    state.paddleX = clamp(
      state.paddleX + PADDLE.speed,
      0,
      elements.canvas.width - PADDLE.width,
    );
  } else if (state.isLeftPressed) {
    state.paddleX = clamp(
      state.paddleX - PADDLE.speed,
      0,
      elements.canvas.width - PADDLE.width,
    );
  }
}

function updateBallPosition() {
  if (
    state.ballX + state.ballDx > elements.canvas.width - BALL.radius ||
    state.ballX + state.ballDx < BALL.radius
  ) {
    state.ballDx = -state.ballDx;
  }

  if (state.ballY + state.ballDy < BALL.radius) {
    state.ballDy = -state.ballDy;
  } else if (
    state.ballY + state.ballDy >
    elements.canvas.height - BALL.radius
  ) {
    if (isBallTouchingPaddle()) {
      state.ballDy = -state.ballDy;
    } else {
      endGame("GAME OVER");
      return;
    }
  }

  state.ballX += state.ballDx;
  state.ballY += state.ballDy;
}

function isBallTouchingPaddle() {
  return (
    state.ballX > state.paddleX &&
    state.ballX < state.paddleX + PADDLE.width
  );
}

function draw() {
  if (!state.isGameRunning) {
    return;
  }

  ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
  drawBall();
  drawPaddle();
  drawScore();
  collisionDetection();

  if (!state.isGameRunning) {
    return;
  }

  drawBricks();
  updateBallPosition();
  updatePaddlePosition();
}

function keyDownHandler(e) {
  if (!state.isGameRunning && e.key === "Enter") {
    resetGame();
    return;
  }

  setArrowKeyState(e.key, true);
}

function keyUpHandler(e) {
  setArrowKeyState(e.key, false);
}

function setArrowKeyState(key, isPressed) {
  if (key === "Right" || key === "ArrowRight") {
    state.isRightPressed = isPressed;
  } else if (key === "Left" || key === "ArrowLeft") {
    state.isLeftPressed = isPressed;
  }
}

function touchMoveHandler(e) {
  const touchX = e.touches[0].clientX;
  const canvasRect = elements.canvas.getBoundingClientRect();
  const scaleX = elements.canvas.width / canvasRect.width;
  const nextPaddleX = (touchX - canvasRect.left) * scaleX - PADDLE.width / 2;

  state.paddleX = clamp(
    nextPaddleX,
    0,
    elements.canvas.width - PADDLE.width,
  );
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
elements.canvas.addEventListener("touchmove", touchMoveHandler, false);
elements.restartButton.addEventListener("click", resetGame, false);

startGameLoop();
