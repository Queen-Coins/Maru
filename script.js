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
const rouletteWheelWrapper = document.querySelector('.roulette-wheel-wrapper');

const modal = document.getElementById('resultModal');
const modalGameText = document.getElementById('modalGameText');
const modalGameImg = document.getElementById('modalGameImg');
const closeModalBtn = document.getElementById('closeModalBtn');

const numSegments = games.length;
const arcSize = (2 * Math.PI) / numSegments;
let currentAngle = 0;
let isSpinning = false;

// ! <=====( CARGA DE IMÁGENES )=====>
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
        drawRoulette();
    }
}

// ! <=====( RENDERIZADO DEL CANVAS )=====>
function drawRoulette() {
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const angle = currentAngle + i * arcSize;
        const isBordaux = i % 2 === 0;
        const img = loadedImages[i];

        ctx.save();
        
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, angle, angle + arcSize);
        ctx.lineTo(radius, radius);
        ctx.closePath();

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.save();
            ctx.clip();

            ctx.translate(radius, radius);
            ctx.rotate(angle + arcSize / 2);
            
            const imgSize = radius * 1.2;
            ctx.drawImage(img, 0, -imgSize / 2, radius, imgSize);
            
            ctx.restore();
        } else {
            ctx.fillStyle = isBordaux ? '#991323' : '#f7d070';
            ctx.fill();
        }

        ctx.strokeStyle = '#ff66c4';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }
}

// Función auxiliar para obtener el ángulo actual de la animación CSS sin saltos
function getCurrentRotation(element) {
    const st = window.getComputedStyle(element);
    const tr = st.getPropertyValue("transform") || st.getPropertyValue("-webkit-transform");
    if (tr && tr !== "none") {
        const values = tr.split('(')[1].split(')')[0].split(',');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        let angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        if (angle < 0) angle += 360;
        return angle * (Math.PI / 180);
    }
    return 0;
}

// ! <=====( FÍSICA Y ANIMACIÓN DEL GIRO )=====>
function spin() {
    if (isSpinning) return;
    
    // Sincronizamos el ángulo exacto en el que iba el giro CSS para evitar saltos
    currentAngle = getCurrentRotation(rouletteWheelWrapper);

    // Quitamos la clase de reposo y reseteamos el transform en línea
    rouletteWheelWrapper.classList.remove('idle-spinning');
    rouletteWheelWrapper.style.transform = 'none';
    drawRoulette();

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
    rouletteWheelWrapper.style.transform = 'none';
    rouletteWheelWrapper.classList.add('idle-spinning');
});

// Activar animación de reposo automática al cargar la página
window.addEventListener('load', () => {
    rouletteWheelWrapper.classList.add('idle-spinning');
});