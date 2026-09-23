// ! <=====( CONFIGURACIÓN Y CATÁLOGO DE JUEGOS )=====>
const games = [
    { name: "5 Lions Gold", image: "img/5-Lions-Gold.jpg" },
    { name: "Big Bass Bonanza", image: "img/Big-Bass-Bonanza.jpg" },
    { name: "Coin Volcano", image: "img/Coin-Volcano.jpg" },
    { name: "Congo Cash", image: "img/Congo-Cash.jpg" },
    { name: "Diamond Strike", image: "img/Diamond-Strike.jpg" },
    { name: "Egyptian Fortunes", image: "img/Egyptian-Fortunes.jpg" },
    { name: "Fire Portals", image: "img/Fire-Portals.jpg" },
    { name: "Gates Of Olympus", image: "img/Gates-Of-Olympus.jpg" },
    { name: "Gold Party", image: "img/Gold-Party.jpg" },
    { name: "Great Rhino", image: "img/Great-Rhino.jpg" },
    { name: "Joker's Jewels", image: "img/Joker-Jewels.jpg" },
    { name: "Mayan Cache", image: "img/Mayan-Cache.jpg" },
    { name: "Medusas Stones", image: "img/Medusas-Stones.jpg" },
    { name: "Mustang Gold", image: "img/Mustang-Gold.jpg" },
    { name: "Rush Fever 7s", image: "img/Rush-Fever-7s.jpg" },
    { name: "Shake Shake Money Tree", image: "img/Shake-Shake-Money-Tree.jpg" },
    { name: "Sugar Rush", image: "img/Sugar-Rush.jpg" },
    { name: "Sweet Bonanza 1000", image: "img/Sweet-Bonanza-1000.jpg" },
    { name: "Super Hot Chilli", image: "img/Super-Hot-Chilli.jpg" },
    { name: "Tree Of Riches", image: "img/Tree-Of-Riches.jpg" },
];

// ! <=====( REFERENCIAS AL DOM Y VARIABLES ESTADO )=====>
const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');

const modal = document.getElementById('resultModal');
const modalGameText = document.getElementById('modalGameText');
const modalGameImg = document.getElementById('modalGameImg');
const closeModalBtn = document.getElementById('closeModalBtn');

const numSegments = games.length;
const arcSize = (2 * Math.PI) / numSegments;
let currentAngle = 0;
let isSpinning = false;
let idleAnimationId = null;

// ! <=====( CARGA DE IMÁGENES Y CONTROL DE IDLE )=====>
const loadedImages = [];
let imagesLoadedCount = 0;

games.forEach((game, index) => {
    const img = new Image();
    img.src = game.image;
    img.onload = () => handleImageLoad();
    img.onerror = () => handleImageLoad();
    loadedImages[index] = img;
});

function handleImageLoad() {
    imagesLoadedCount++;
    if (imagesLoadedCount === numSegments) {
        startIdleSpin();
    }
}

function startIdleSpin() {
    if (isSpinning) return;
    currentAngle += 0.003;
    drawRoulette();
    idleAnimationId = requestAnimationFrame(startIdleSpin);
}

// ! <=====( RENDERIZADO DEL CANVAS CON IMAGEN DE FONDO EN CADA GAJO )=====>
function drawRoulette() {
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const angle = currentAngle + i * arcSize;
        const isBordaux = i % 2 === 0;
        const img = loadedImages[i];

        ctx.save();
        
        // 1. Trazar la trayectoria del sector (gajo triangular)
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, angle, angle + arcSize);
        ctx.lineTo(radius, radius);
        ctx.closePath();

        // 2. Si la imagen está disponible, usarla como fondo abarcando todo el bloque
        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.save();
            ctx.clip(); // Aplicar máscara con la forma del gajo

            // Posicionar la imagen para que cubra completamente el gajo desde el centro
            ctx.translate(radius, radius);
            ctx.rotate(angle + arcSize / 2);
            
            // Dibujamos la imagen ocupando el radio completo
            const imgSize = radius * 1.2;
            ctx.drawImage(img, 0, -imgSize / 2, radius, imgSize);
            
            ctx.restore();
        } else {
            // Fondo plano de reserva en caso de fallo de carga de imagen
            ctx.fillStyle = isBordaux ? '#991323' : '#f7d070';
            ctx.fill();
        }

        // 3. Dibujar las líneas divisorias de cada sector para separarlos
        ctx.strokeStyle = '#ff66c4';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }
}

// ! <=====( FÍSICA Y ANIMACIÓN DEL GIRO )=====>
function spin() {
    if (isSpinning) return;
    
    if (idleAnimationId) {
        cancelAnimationFrame(idleAnimationId);
        idleAnimationId = null;
    }
    
    isSpinning = true;

    const startAngle = currentAngle;
    const windUpDistance = 0.25;
    const windUpDuration = 600;

    const spinRounds = 4 + Math.floor(Math.random() * 3);
    const randomOffset = Math.random() * 2 * Math.PI;
    const mainSpinDistance = spinRounds * 2 * Math.PI + randomOffset;
    const mainSpinDuration = 5500;

    let startTime = null;

    function animateWindUp(now) {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / windUpDuration, 1);
        
        const easeWindUp = Math.sin((progress * Math.PI) / 2);
        currentAngle = startAngle - (windUpDistance * easeWindUp);
        
        drawRoulette();

        if (progress < 1) {
            requestAnimationFrame(animateWindUp);
        } else {
            startTime = null;
            requestAnimationFrame(animateMainSpin);
        }
    }

    function animateMainSpin(now) {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / mainSpinDuration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentAngle = (startAngle - windUpDistance) + (mainSpinDistance + windUpDistance) * easeOut;
        
        drawRoulette();

        if (progress < 1) {
            requestAnimationFrame(animateMainSpin);
        } else {
            isSpinning = false;
            calculateResult();
        }
    }

    requestAnimationFrame(animateWindUp);
}

// ! <=====( CÁLCULO DEL GANADOR Y MODAL )=====>
function calculateResult() {
    const pointerAngle = (3 * Math.PI) / 2;
    const normalizedAngle = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    
    let relativeAngle = (pointerAngle - normalizedAngle) % (2 * Math.PI);
    if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

    const selectedIndex = Math.floor(relativeAngle / arcSize) % numSegments;
    const selectedGame = games[selectedIndex];

    modalGameText.textContent = selectedGame.name;
    modalGameImg.src = selectedGame.image;
    modalGameImg.alt = selectedGame.name;
    modal.classList.add('active');
}

// ! <=====( EVENT LISTENERS )=====>
spinBtn.addEventListener('click', spin);

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    startIdleSpin();
});