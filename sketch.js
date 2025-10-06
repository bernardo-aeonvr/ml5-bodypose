let video;
let bodyPose;
let poses = [];
let connections;

// --- helpers de ambiente ---
const isiOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isPortrait = () => window.innerHeight >= window.innerWidth;

// Remapeia (x,y) do MoveNet para a tela quando iOS entrega 90° CCW
function fixPosePoint(x, y, w, h) {
  if (isiOS() && isPortrait()) {
    // rotaciona 90° CCW: (x, y) -> (y, w - x)
    const nx = y;
    const ny = w - x;
    return { x: nx, y: ny };
  }
  return { x, y };
}

async function setup() {
  createCanvas(windowWidth, windowHeight);

  // captura com configurações + correções iOS
  video = createCapture({
    video: {
      facingMode: 'user',
      width: { ideal: windowWidth },
      height: { ideal: windowHeight }
    },
    audio: false
  });
  // iOS fixes
  video.elt.setAttribute('playsinline', '');
  video.elt.setAttribute('muted', '');
  video.elt.muted = true;

  video.size(width, height);
  video.hide();

  bodyPose = await ml5.bodyPose();
  bodyPose.detectStart(video, gotPoses);
  connections = bodyPose.getConnections();

  textSize(32);
  textAlign(LEFT, TOP);
  fill(255);
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);

  // Desenho do esqueleto e keypoints (com correção iOS)
  for (let pose of poses) {
    for (let conn of connections) {
      let a = pose.keypoints[conn[0]];
      let b = pose.keypoints[conn[1]];
      if (a.confidence > 0.1 && b.confidence > 0.1) {
        const A = fixPosePoint(a.x, a.y, width, height);
        const B = fixPosePoint(b.x, b.y, width, height);
        stroke(255, 0, 0);
        strokeWeight(2);
        line(A.x, A.y, B.x, B.y);
      }
    }

    for (let k of pose.keypoints) {
      if (k.confidence > 0.1) {
        const P = fixPosePoint(k.x, k.y, width, height);
        fill(0, 255, 0);
        noStroke();
        circle(P.x, P.y, 10);
      }
    }
  }
}

function gotPoses(results) {
  poses = results;
}

// Responsividade ao redimensionar
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}
