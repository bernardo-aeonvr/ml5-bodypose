let video;
let bodyPose;
let poses = [];
let connections;

// --- removidos: balls/coin/score/frameCounter e helpers relacionados ---

async function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  bodyPose = await ml5.bodyPose();
  bodyPose.detectStart(video, gotPoses);
  connections = bodyPose.getConnections();

  // Mantidos (não interferem no funcionamento sem pontuação/bolas)
  textSize(32);
  textAlign(LEFT, TOP);
  fill(255);
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);

  // --- removido: texto de pontuação e render/atualização de bolas ---

  // Desenho do esqueleto e keypoints (inalterado)
  for (let pose of poses) {
    for (let conn of connections) {
      let a = pose.keypoints[conn[0]];
      let b = pose.keypoints[conn[1]];
      if (a.confidence > 0.1 && b.confidence > 0.1) {
        stroke(255, 0, 0);
        strokeWeight(2);
        line(a.x, a.y, b.x, b.y);
      }
    }

    for (let k of pose.keypoints) {
      if (k.confidence > 0.1) {
        fill(0, 255, 0);
        noStroke();
        circle(k.x, k.y, 10);
      }
    }
  }
}

function gotPoses(results) {
  poses = results;
}

// Responsividade ao redimensionar a janela
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}

// --- removidos: loadImageAsync, createBall, resetBall, distToSegment ---
