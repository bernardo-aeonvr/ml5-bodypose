/*
  p5.js + ml5.js BodyPose (MoveNet) — mobile-safe
  Funciona em iOS/Android/desktop: inicia após gesto do usuário.
*/

let video;
let bodyPose;
let poses = [];
let connections = [];
let ready = false;
let started = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); // ajuda no mobile
  background(0);
  textAlign(CENTER, CENTER);
  textSize(18);
  fill(255);
  text('Tap to start (permita a câmera)', width/2, height/2);
}

async function startApp() {
  if (started) return;
  started = true;

  // 1) Captura da câmera (frontal) — só após gesto do usuário
  video = createCapture({
    video: {
      facingMode: { ideal: 'user' }, // troque por 'environment' se quiser traseira
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  }, () => {
    // callback quando a permissão é concedida
  });
  video.elt.setAttribute('playsinline', ''); // iOS
  video.elt.muted = true; // ajuda o autoplay
  video.hide();

  // Espere o vídeo ficar pronto
  await new Promise(res => video.elt.onloadedmetadata = res);

  // Ajuste o canvas ao vídeo ou à tela (aqui: preenche tela mantendo desenho)
  resizeCanvas(windowWidth, windowHeight);

  // 2) Carregar o modelo (assíncrono)
  // Se quiser especificar variante: ml5.bodyPose('MoveNet.SinglePose.Thunder')
  bodyPose = await ml5.bodyPose();

  // 3) Conexões do esqueleto (API varia entre versões)
  if (bodyPose.getConnections) {
    connections = bodyPose.getConnections();
  } else if (bodyPose.getSkeleton) {
    connections = bodyPose.getSkeleton();
  } else {
    connections = []; // fallback
  }

  // 4) Iniciar detecção
  bodyPose.detectStart(video, gotPoses);

  ready = true;
}

function draw() {
  background(0);

  if (!ready) {
    // mensagem inicial até carregar tudo
    fill(255);
    noStroke();
    text('Tap to start (permita a câmera)', width/2, height/2);
    return;
  }

  // Desenha o vídeo esticado para a tela
  image(video, 0, 0, width, height);

  // Desenha conexões do esqueleto
  stroke(255, 0, 0);
  strokeWeight(2);
  for (let p of poses) {
    for (let c of connections) {
      const a = p.keypoints[c[0]];
      const b = p.keypoints[c[1]];
      if (a && b && a.confidence > 0.1 && b.confidence > 0.1) {
        line(a.x * sx(), a.y * sy(), b.x * sx(), b.y * sy());
      }
    }
  }

  // Desenha keypoints
  noStroke();
  fill(0, 255, 0);
  for (let p of poses) {
    for (let k of p.keypoints) {
      if (k.confidence > 0.1) {
        circle(k.x * sx(), k.y * sy(), 10);
      }
    }
  }
}

// Converte coords do vídeo para o canvas (se tamanhos diferirem)
function sx() { return width / video.width; }
function sy() { return height / video.height; }

function gotPoses(results) {
  poses = results || [];
}

// Iniciar no primeiro toque/clique (necessário no iOS/Android)
function touchStarted() {
  startApp();
  return false;
}
function mousePressed() {
  startApp();
}

// Responsivo
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
