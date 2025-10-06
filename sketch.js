// Variáveis globais para o vídeo, modelo e dados da pose
let video;
let bodyPose;
let poses = [];
let connections;

async function setup() {
  // Cria o canvas para ocupar a tela inteira
  createCanvas(windowWidth, windowHeight);

  // Inicia a captura da câmera de vídeo
  video = createCapture(VIDEO);
  video.size(width, height);
  // Esconde o elemento HTML do vídeo, pois vamos desenhá-lo manualmente no canvas
  video.hide();

  // Carrega o modelo bodyPose da biblioteca ml5.js
  bodyPose = await ml5.bodyPose();
  
  // Inicia a detecção de poses no vídeo. A cada nova detecção, a função 'gotPoses' será chamada.
  bodyPose.detectStart(video, gotPoses);

  // Obtém o array de conexões padrão do esqueleto para saber quais pontos ligar
  connections = bodyPose.getConnections();
}

function draw() {
  // 1. ESPELHAMENTO DO CANVAS
  // Move a origem para o canto superior direito e inverte o eixo X.
  // Isso faz com que a imagem se comporte como um espelho.
  translate(width, 0);
  scale(-1, 1);

  // Limpa o fundo a cada frame e desenha a imagem do vídeo (agora espelhada)
  background(0);
  image(video, 0, 0, width, height);

  // 2. CORREÇÃO ESPECÍFICA PARA iOS
  // Detecta se o código está rodando em um dispositivo Apple (iPhone, iPad).
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Itera por todas as poses que foram detectadas no frame atual
  for (let pose of poses) {
    
    // Itera por todas as conexões do esqueleto
    for (let conn of connections) {
      let a = pose.keypoints[conn[0]];
      let b = pose.keypoints[conn[1]];

      // Apenas desenha a linha se o modelo tiver uma boa confiança em ambos os pontos
      if (a.confidence > 0.1 && b.confidence > 0.1) {
        let a_x = a.x, a_y = a.y;
        let b_x = b.x, b_y = b.y;
        
        // Se for iOS, aplica a transformação completa de coordenadas
        if (isIOS) {
          // <<-- AQUI ESTÁ A CORREÇÃO FINAL! Invertemos o eixo horizontal de '0, width' para 'width, 0'
          a_x = map(a.y, 0, video.height, width, 0);
          a_y = map(a.x, 0, video.width, 0, height);
          
          b_x = map(b.y, 0, video.height, width, 0);
          b_y = map(b.x, 0, video.width, 0, height);
        }

        // Desenha a linha da conexão
        stroke(255, 0, 0);
        strokeWeight(4);
        line(a_x, a_y, b_x, b_y);
      }
    }

    // Itera por todos os pontos (keypoints) do esqueleto
    for (let k of pose.keypoints) {
      if (k.confidence > 0.1) {
        let k_x = k.x, k_y = k.y;

        // Aplica a mesma transformação de correção para os pontos
        if (isIOS) {
          k_x = map(k.y, 0, video.height, width, 0);
          k_y = map(k.x, 0, video.width, 0, height);
        }
        
        // Desenha o círculo do ponto
        fill(0, 255, 0);
        noStroke();
        circle(k_x, k_y, 16);
      }
    }
  }
}

// Função de callback - é executada sempre que o ml5.js detecta novas poses
function gotPoses(results) {
  // Armazena os resultados na variável global 'poses'
  poses = results;
}

// Garante que o canvas e o vídeo se ajustem se o usuário redimensionar a janela
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}