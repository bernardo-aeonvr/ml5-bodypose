let cap, videoEl, bodyPose, poses = [];
let videoW = 0, videoH = 0;     // dimensões nativas do stream
let drawW = 0, drawH = 0;       // quanto vamos desenhar no canvas
let theta = 0;                  // rotação (0, PI/2, -PI/2)
let mirror = true;              // camera frontal costuma ser espelhada
let scaleX = 1, scaleY = 1;     // mapa de vídeo -> desenho

function gotPoses(results) {
  poses = results;
}

function chooseOrientation() {
  // Se o vídeo vier "deitado" (width < height no landscape, etc),
  // ajustamos theta. Heurística simples e robusta:
  // Use 0 se videoW >= videoH (paisagem), PI/2 se retrato "deitado".
  theta = (videoW >= videoH) ? 0 : HALF_PI;
}

function fitVideoIntoCanvas() {
  // Mantém proporção do vídeo e ocupa a maior área possível do canvas
  const cw = width, ch = height;
  const aspectV = videoW / videoH;

  let tw = cw, th = cw / aspectV;
  if (th > ch) { th = ch; tw = ch * aspectV; }

  drawW = tw;
  drawH = th;

  // Fatores para levar coordenadas do vídeo nativo -> desenho
  scaleX = drawW / videoW;
  scaleY = drawH / videoH;
}

async function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); // evita offsets bizarros com DPR alto

  cap = createCapture(VIDEO);
  cap.size(640, 480);      // um alvo "seguro"; ajustaremos após metadata
  cap.elt.setAttribute('playsinline', '');
  cap.elt.setAttribute('muted', '');
  cap.hide();
  videoEl = cap.elt;

  videoEl.addEventListener('loadedmetadata', async () => {
    videoW = videoEl.videoWidth;
    videoH = videoEl.videoHeight;

    chooseOrientation();
    fitVideoIntoCanvas();

    bodyPose = await ml5.bodyPose();
    bodyPose.detectStart(cap, gotPoses);
  });

  // Recalcular layout quando girar/resize
  window.addEventListener('orientationchange', () => {
    // iOS às vezes entrega nova rotação sem trocar videoW/H;
    // ainda assim refazemos o fit para manter alinhado.
    chooseOrientation();
    fitVideoIntoCanvas();
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  fitVideoIntoCanvas();
}

function draw() {
  background(0);
  if (!videoW || !videoH) return;

  push();
  // Centraliza
  translate(width/2, height/2);

  // Aplica rotação detectada
  rotate(theta);

  // Aplica espelho da frontal (se quiser desativar: mirror=false)
  scale(mirror ? -1 : 1, 1);

  // Escala do vídeo nativo para o tamanho de desenho
  scale(scaleX, scaleY);

  // Desenha o vídeo centrado no "espaço do vídeo"
  image(cap, -videoW/2, -videoH/2, videoW, videoH);

  // === Desenho do esqueleto no MESMO espaço (vídeo nativo) ===
  noFill();
  stroke(255);
  strokeWeight(2 / max(scaleX, scaleY)); // mantém espessura visual

  // 1) Keypoints
  for (const p of poses) {
    for (const k of p.keypoints) {
      const x = k.x - videoW/2;
      const y = k.y - videoH/2;
      circle(x, y, 6 / max(scaleX, scaleY));
    }

    // 2) Conexões (skeleton)
    const conns = bodyPose.getConnections ? bodyPose.getConnections()
                                          : bodyPose.getSkeleton?.();
    if (conns) {
      for (const [i, j] of conns) {
        const a = p.keypoints[i], b = p.keypoints[j];
        line(a.x - videoW/2, a.y - videoH/2, b.x - videoW/2, b.y - videoH/2);
      }
    }
  }
  pop();
}
