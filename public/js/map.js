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

// svg filters for hover and selection
const svgFilters = `
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none;">
    <filter id="hover-filter">
      <feColorMatrix type="matrix" values="
        0.7 0 0 0 0
        0 0.7 0 0 0
        0 0 0.7 0 0
        0 0 0 1 0
      "/>
    </filter>
    <filter id="selected-filter">
      <feColorMatrix type="matrix" values="
        1 0 0 0 0.5
        0 0.5 0 0 0
        0 0 0.5 0 0
        0 0 0 1 0
      "/>
    </filter>
  </svg>
`;

document.body.insertAdjacentHTML('afterbegin', svgFilters);

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
          data: buildingData,
          isSelected: false
        };
        building.image.src = `/style/maps/osu/buildings/${buildingData.svg}.svg`;
        building.image.onload = function() {
          const hitCtx = building.hitCanvas.getContext('2d', { willReadFrequently: true });
          building.hitCanvas.width = this.width;
          building.hitCanvas.height = this.height;
          hitCtx.drawImage(this, 0, 0);
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
    ctx.save();
    if (name === selectedBuilding) {
      ctx.filter = 'url(#selected-filter)';
    } else if (name === hoveringBuilding) {
      ctx.filter = 'url(#hover-filter)';
    }
    ctx.drawImage(building.image, 0, 0);
    ctx.restore();
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
