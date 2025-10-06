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
    // 1. Espelhar o canvas inteiro
    translate(width, 0); // Move a origem para o canto superior direito
    scale(-1, 1);       // Inverte o eixo X

    // 2. Desenhar a imagem de vídeo (que agora aparecerá espelhada)
    background(0);
    image(video, 0, 0, width, height);

    // 3. Reverter o espelhamento para desenhar o texto corretamente (opcional)
    // Se você for desenhar texto, como um placar, vai precisar dessa parte
    // para que ele não fique espelhado. Por enquanto, vamos deixar comentado.
    // push();
    // scale(-1, 1);
    // translate(-width, 0);
    // // ... seu código para desenhar texto aqui ...
    // pop();


    // Variável para checar se é um dispositivo Apple (iOS/iPadOS)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // 4. Desenhar o esqueleto com as coordenadas corrigidas
    for (let pose of poses) {
        for (let conn of connections) {
            let a = pose.keypoints[conn[0]];
            let b = pose.keypoints[conn[1]];

            if (a.confidence > 0.1 && b.confidence > 0.1) {
                let a_x = a.x;
                let a_y = a.y;
                let b_x = b.x;
                let b_y = b.y;
                
                // Se for iOS, aplica a transformação de coordenadas
                if (isIOS) {
                    // Transforma a coordenada (x, y) da paisagem para retrato
                    // Isso é o equivalente a uma rotação de -90 graus e um ajuste de escala
                    a_x = map(a.y, 0, video.height, 0, width);
                    a_y = map(a.x, 0, video.width, height, 0);
                    
                    b_x = map(b.y, 0, video.height, 0, width);
                    b_y = map(b.x, 0, video.width, height, 0);
                }

                stroke(255, 0, 0);
                strokeWeight(2);
                line(a_x, a_y, b_x, b_y);
            }
        }

        for (let k of pose.keypoints) {
            if (k.confidence > 0.1) {
                let k_x = k.x;
                let k_y = k.y;

                // Aplica a mesma transformação para os círculos
                if (isIOS) {
                    k_x = map(k.y, 0, video.height, 0, width);
                    k_y = map(k.x, 0, video.width, height, 0);
                }

                fill(0, 255, 0);
                noStroke();
                circle(k_x, k_y, 10);
            }
        }
    }
}
