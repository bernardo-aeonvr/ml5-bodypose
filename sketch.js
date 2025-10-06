// Variáveis globais
let video;
let bodyPose;
let poses = [];
let connections;

async function setup() {
  // Cria o canvas com o tamanho da janela
  createCanvas(windowWidth, windowHeight);

  // Inicia a captura de vídeo
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide(); // Esconde o elemento de vídeo original para desenharmos no canvas

  // Carrega o modelo bodyPose do ml5.js
  bodyPose = await ml5.bodyPose();
  // Inicia a detecção de poses no vídeo e define a função de callback
  bodyPose.detectStart(video, gotPoses);

  // Obtém as conexões padrão do esqueleto para desenhar as linhas
  connections = bodyPose.getConnections();

  // Configurações de texto (não usadas no momento, mas boas para debug)
  textSize(32);
  textAlign(LEFT, TOP);
  fill(255);
}

function draw() {
  // --- INÍCIO DA CORREÇÃO PARA iOS ---

  // 1. Espelha o canvas para que a imagem funcione como um espelho
  translate(width, 0); // Move a origem (0,0) para o canto superior direito
  scale(-1, 1);       // Inverte o eixo horizontal (X)

  // 2. Desenha o frame do vídeo no canvas
  background(0); // Limpa o fundo
  image(video, 0, 0, width, height);

  // Variável para checar se o navegador está rodando em um dispositivo Apple
  // Isso é necessário por causa da forma como o iOS trata a orientação do vídeo
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 3. Itera por todas as poses detectadas
  for (let pose of poses) {
    // Desenha as linhas de conexão do esqueleto
    for (let conn of connections) {
      let a = pose.keypoints[conn[0]];
      let b = pose.keypoints[conn[1]];

      // Só desenha se a confiança nos dois pontos for alta o suficiente
      if (a.confidence > 0.1 && b.confidence > 0.1) {
        let a_x = a.x;
        let a_y = a.y;
        let b_x = b.x;
        let b_y = b.y;
        
        // Se for iOS, aplica a transformação de coordenadas para corrigir a rotação
        if (isIOS) {
          // Mapeia as coordenadas (x,y) que o modelo "vê" (deitado)
          // para as coordenadas corretas do nosso canvas (em pé).
          a_x = map(a.y, 0, video.height, 0, width);
          a_y = map(a.x, 0, video.width, height, 0);
          
          b_x = map(b.y, 0, video.height, 0, width);
          b_y = map(b.x, 0, video.width, height, 0);
        }

        // Desenha a linha
        stroke(255, 0, 0);
        strokeWeight(2);
        line(a_x, a_y, b_x, b_y);
      }
    }

    // Desenha os pontos (keypoints) do esqueleto
    for (let k of pose.keypoints) {
      if (k.confidence > 0.1) {
        let k_x = k.x;
        let k_y = k.y;

        // Aplica a mesma transformação de correção para os pontos
        if (isIOS) {
          k_x = map(k.y, 0, video.height, 0, width);
          k_y = map(k.x, 0, video.width, height, 0);
        }
        
        // Desenha o círculo
        fill(0, 255, 0);
        noStroke();
        circle(k_x, k_y, 10);
      }
    }
  }
}

// Função de callback que é chamada quando novas poses são detectadas
function gotPoses(results) {
  poses = results;
}

// Função para redimensionar o canvas e o vídeo quando a janela muda de tamanho
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}