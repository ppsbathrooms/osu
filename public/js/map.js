const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const img = new Image();
img.src = '/style/maps/osu.svg';

let isDragging = false;
let startX, startY;
let offsetX = 0, offsetY = 0;
let scale = 1;
let rafId = null;

let buildings = [];

fetch('buildings.json')
  .then(response => response.json())
  .then(data => {
    buildings = data;
    if (img.complete) drawImage();
  })
  .catch(error => console.error('Error loading buildings data:', error));

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

  // draw building bounding boxes
  drawBoundingBoxes();
}

function drawBoundingBoxes() {
  ctx.strokeStyle = 'red';
  for (const building of buildings) {
    const box = transformBoundingBox(building);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }
}

function transformBoundingBox(building) {
  return {
    x: building.x * scale * 4/3 + offsetX,
    y: building.y * scale * 4/3 + offsetY,
    width: building.width * scale * 4/3,
    height: building.height * scale * 4/3
  };
}

function isPointInBuilding(x, y, building) {
  const box = transformBoundingBox(building);
  return (
    x >= box.x &&
    x <= box.x + box.width &&
    y >= box.y &&
    y <= box.y + box.height
  );
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

function updateCursorStyle(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  let isOverBuilding = false;
  for (const building of buildings) {
    if (isPointInBuilding(mouseX, mouseY, building)) {
      isOverBuilding = true;
      break;
    }
  }

  canvas.style.cursor = isOverBuilding ? 'pointer' : 'default';
}

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
  } else {
    updateCursorStyle(e);
  }
});

canvas.addEventListener('mouseup', function(e) {
  stopDragging();
  updateCursorStyle(e);
});

canvas.addEventListener('mouseleave', stopDragging);

function stopDragging() {
  isDragging = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
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

canvas.addEventListener('click', function(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  for (const building of buildings) {
    if (isPointInBuilding(clickX, clickY, building)) {
      setHighlightInfo(building);
      return;
    }
  }
});

window.addEventListener('resize', function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawImage();
});