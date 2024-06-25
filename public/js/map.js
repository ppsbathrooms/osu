const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const baseMap = new Image();
baseMap.src = '/style/maps/osu/osu-base.svg';

const buildings = {};
var selectedBuilding = null;

let isDragging = false;
let startX, startY;
let offsetX = 0, offsetY = 0;
let scale = 1;
let rafId = null;
let hoveringBuilding = null;

baseMap.onload = function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  offsetX = (canvas.width - baseMap.width) / 2;
  offsetY = (canvas.height - baseMap.height) / 2;
  
  loadBuildingsFromJSON();
};

function loadBuildingsFromJSON() {
  fetch('buildings.json')
    .then(response => response.json())
    .then(data => {
      data.forEach(buildingData => {
        const building = {
          image: new Image(),
          hitCanvas: document.createElement('canvas'),
          hoverCanvas: document.createElement('canvas'),
          selectedCanvas: document.createElement('canvas'),
          data: buildingData,
          isSelected: false
        };
        building.image.src = `/style/maps/osu/buildings/${buildingData.svg}.svg`;
        building.image.onload = function() {
          const hitCtx = building.hitCanvas.getContext('2d', { willReadFrequently: true });
          const hoverCtx = building.hoverCanvas.getContext('2d');
          const selectedCtx = building.selectedCanvas.getContext('2d');

          building.hitCanvas.width = building.hoverCanvas.width = building.selectedCanvas.width = this.width;
          building.hitCanvas.height = building.hoverCanvas.height = building.selectedCanvas.height = this.height;

          hitCtx.drawImage(this, 0, 0);
          hoverCtx.drawImage(this, 0, 0);
          selectedCtx.drawImage(this, 0, 0);

          hoverCtx.globalCompositeOperation = 'source-atop';
          hoverCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          hoverCtx.fillRect(0, 0, this.width, this.height);
          hoverCtx.globalCompositeOperation = 'source-over';

          selectedCtx.globalCompositeOperation = 'source-atop';
          selectedCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          selectedCtx.fillRect(0, 0, this.width, this.height);
          selectedCtx.globalCompositeOperation = 'source-over';

          drawImage();
        };
        buildings[buildingData.svg] = building;
      });
    })
    .catch(error => console.error('Error loading buildings:', error));
}

function drawImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.drawImage(baseMap, 0, 0);
  
  for (const name in buildings) {
    const building = buildings[name];
    if (name === selectedBuilding) {
      ctx.drawImage(building.selectedCanvas, 0, 0);
    } else if (name === hoveringBuilding) {
      ctx.drawImage(building.hoverCanvas, 0, 0);
    } else {
      ctx.drawImage(building.image, 0, 0);
    }
  }
  
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

function stopDragging() {
  isDragging = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function isPointOnBuilding(x, y) {
  for (const name in buildings) {
    const building = buildings[name];
    if (x >= 0 && x < building.image.width && y >= 0 && y < building.image.height) {
      const hitCtx = building.hitCanvas.getContext('2d');
      const pixelData = hitCtx.getImageData(x, y, 1, 1).data;
      if (pixelData[3] > 0) {
        return name;
      }
    }
  }
  return null;
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
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - offsetX) / scale;
    const mouseY = (e.clientY - rect.top - offsetY) / scale;

    const hovering = isPointOnBuilding(mouseX, mouseY);
    if (hovering !== hoveringBuilding) {
      hoveringBuilding = hovering;
      drawImage();
    }

    canvas.style.cursor = hovering ? 'pointer' : 'default';
  }
});

canvas.addEventListener('mouseup', function(e) {
  stopDragging();
  canvas.style.cursor = hoveringBuilding ? 'pointer' : 'default';
});

canvas.addEventListener('mouseleave', function() {
  stopDragging();
  hoveringBuilding = null;
  canvas.style.cursor = 'default';
  drawImage();
});

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

canvas.addEventListener('click', function(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left - offsetX) / scale;
  const clickY = (e.clientY - rect.top - offsetY) / scale;

  const clickedBuilding = isPointOnBuilding(clickX, clickY);
  if (clickedBuilding) {
    setSelectedBuilding(clickedBuilding);
    setHighlightInfo(buildings[clickedBuilding].data);
    console.log(`Clicked on ${buildings[clickedBuilding].data.building}`);
  } else {
    setSelectedBuilding(null);
  }
});

function setSelectedBuilding(building) {
  if(building == null) {
    return;
  }
  if (selectedBuilding) {
    buildings[selectedBuilding].isSelected = false;
  }
  selectedBuilding = building;
  if (selectedBuilding) {
    buildings[selectedBuilding].isSelected = true;
  }
  drawImage();
}

function deselectBuilding() {
  if (selectedBuilding) {
      buildings[selectedBuilding].isSelected = false;
      selectedBuilding = null;
      drawImage();
  }
}