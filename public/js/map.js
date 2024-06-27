const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const baseMap = new Image();
baseMap.src = '/style/maps/osu/osu-base.svg';

const buildings = new Map();
let selectedBuilding = null;

let isDragging = false;
let lastX, lastY;
let offsetX = 0, offsetY = 0;
let scale = 1;
let hoveringBuilding = null;

// svg filters for hover and select
const svgFilters = `
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none;">
    <filter id="hover-filter">
      <feColorMatrix type="matrix" values="
        1.25 0 0 0 0
        0 1.25 0 0 0
        0 0 1.25 0 0
        0 0 0 1 0
      "/>
    </filter>
    <filter id="selected-filter">
      <feColorMatrix type="matrix" values="
        1.5 0 0 0 0
        0 1.5 0 0 0
        0 0 2 0 0
        0 0 0 1 0
      "/>
    </filter>
  </svg>
`;

document.body.insertAdjacentHTML('afterbegin', svgFilters);

// canvas to window size and center
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
          hitCtx: null,
          data: buildingData,
          isSelected: false
        };
        building.image.src = `/style/maps/osu/buildings/${buildingData.files}.svg`;
        building.image.onload = function() {
          building.hitCanvas.width = this.width;
          building.hitCanvas.height = this.height;
          // hit detection for each canvas
          building.hitCtx = building.hitCanvas.getContext('2d', { willReadFrequently: true });
          building.hitCtx.drawImage(this, 0, 0);
          drawImage();
        };
        buildings.set(buildingData.files, building);
      });
    })
    .catch(error => console.error('Error loading buildings:', error));
}

function drawImage() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    // draw base map
    ctx.drawImage(baseMap, 0, 0);
    
    // draw buildings
    buildings.forEach((building, name) => {
        ctx.save();
        if (name === selectedBuilding) {
            ctx.filter = 'url(#selected-filter)';
        } else if (name === hoveringBuilding) {
            ctx.filter = 'url(#hover-filter)';
        }
        ctx.drawImage(building.image, 0, 0);
        ctx.restore();
    });
    
    ctx.restore();
}

function update() {
    drawImage();
    requestAnimationFrame(update);
}

function startDragging(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;
    
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    
    offsetX += dx;
    offsetY += dy;
    
    lastX = e.clientX;
    lastY = e.clientY;
}

function stopDragging() {
    isDragging = false;
    canvas.style.cursor = hoveringBuilding ? 'pointer' : 'default';
}

// calc if x y is on building
function isPointOnBuilding(x, y) {
  for (const [name, building] of buildings) {
    if (x >= 0 && x < building.image.width && y >= 0 && y < building.image.height) {
      if (building.hitCtx) {
        const pixelData = building.hitCtx.getImageData(x, y, 1, 1).data;
        if (pixelData[3] > 0) {
          return name;
        }
      }
    }
  }
  return null;
}

canvas.addEventListener('mousedown', startDragging);
canvas.addEventListener('mousemove', drag);
canvas.addEventListener('mouseup', stopDragging);
canvas.addEventListener('mouseleave', stopDragging);

canvas.addEventListener('mousemove', function(e) {
    if (!isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - offsetX) / scale;
        const mouseY = (e.clientY - rect.top - offsetY) / scale;

        const hovering = isPointOnBuilding(mouseX, mouseY);
        if (hovering !== hoveringBuilding) {
            hoveringBuilding = hovering;
        }

        canvas.style.cursor = hoveringBuilding ? 'pointer' : 'default';
    }
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
  }
});

// limit refresh when resizing
const debounce = (func, delay) => {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  }
}

window.addEventListener('resize', debounce(function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}, 100));

canvas.addEventListener('click', function(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left - offsetX) / scale;
  const clickY = (e.clientY - rect.top - offsetY) / scale;

  const clickedBuilding = isPointOnBuilding(clickX, clickY);
  if (clickedBuilding) {
    setSelectedBuilding(clickedBuilding);
    setHighlightInfo(buildings.get(clickedBuilding).data);
  } else {
    setSelectedBuilding(null);
  }
});

// set selection for building
function setSelectedBuilding(building) {
  if(building == null) {
    return;
  }
  if (selectedBuilding) {
    buildings.get(selectedBuilding).isSelected = false;
  }
  selectedBuilding = building;
  if (selectedBuilding) {
    buildings.get(selectedBuilding).isSelected = true;
  }
}

function deselectBuilding() {
  if (selectedBuilding) {
    buildings.get(selectedBuilding).isSelected = false;
    selectedBuilding = null;
  }
}

requestAnimationFrame(update);