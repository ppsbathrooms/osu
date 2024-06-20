const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const img = new Image();
img.src = '/style/maps/osu.svg';

let isDragging = false;
let startX, startY;
let offsetX = 0, offsetY = 0;
let scale = 1;
let rafId = null;

img.onload = function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  offsetX = (canvas.width - img.width) / 2;
  offsetY = (canvas.height - img.height) / 2;
  
  drawImage();
};

function drawImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function updatePosition(e) {
  offsetX = e.clientX - startX;
  offsetY = e.clientY - startY;
}

function animateFrame() {
  drawImage();
  if (isDragging) {
    rafId = requestAnimationFrame(animateFrame);
  }
}

canvas.style.cursor = 'default';

canvas.addEventListener('mousedown', function(e) {
  isDragging = true;
  startX = e.clientX - offsetX;
  startY = e.clientY - offsetY;
  rafId = requestAnimationFrame(animateFrame);
  canvas.style.cursor = 'move';
});

canvas.addEventListener('mousemove', function(e) {
  if (isDragging) {
    updatePosition(e);
  }
});

canvas.addEventListener('mouseup', stopDragging);
canvas.addEventListener('mouseleave', stopDragging);

function stopDragging() {
  isDragging = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  canvas.style.cursor = 'default';
}

canvas.addEventListener('wheel', function(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = scale * zoomFactor;

  if (newScale > 0.1 && newScale < 10) {
    const imgX = (mouseX - offsetX) / scale;
    const imgY = (mouseY - offsetY) / scale;

    scale = newScale;

    offsetX = mouseX - imgX * scale;
    offsetY = mouseY - imgY * scale;

    drawImage();
  }
});

window.addEventListener('resize', function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawImage();
});