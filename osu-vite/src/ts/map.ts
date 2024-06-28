import { setHighlightInfo } from "./highlight";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

if (!canvas) throw new Error("Canvas not found!");

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

export function getCtx() {
    return ctx;
}

if (!ctx) throw new Error("ctx not found!");

const baseMap = new Image();
baseMap.src = "/style/maps/osu/osu-base.svg";

const buildings = new Map();
let selectedBuilding: Building | undefined = undefined;
let buildingsLoaded = false;

let isDragging = false;
let lastX: number, lastY: number;
let offsetX = 0,
    offsetY = 0;
let scale = 1;
let hoveringBuilding: Building | undefined = undefined;

export type BuildingData = {
    files: string;
    building: string;
    address: string;
    info: string;
    accessibility: string;
    brInfo: string;
};

export type Building = {
    image: HTMLImageElement;
    hitCanvas: HTMLCanvasElement;
    hitCtx?: CanvasRenderingContext2D;
    data: BuildingData;
    isSelected: false;
};

// svg filters for hover and select
const svgFilters = `
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none;">
    <filter id="hover-filter">
      <feColorMatrix type="matrix" values="1.25 0 0 0 0 0 1.25 0 0 0 0 0 1.25 0 0 0 0 0 1 0"/>
    </filter>
    <filter id="selected-filter">
      <feColorMatrix type="matrix" values="1.5 0 0 0 0 0 1.5 0 0 0 0 0 2 0 0 0 0 0 1 0"/>
    </filter>
  </svg>
`;

document.body.insertAdjacentHTML("afterbegin", svgFilters);

baseMap.onload = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    offsetX = (canvas.width - baseMap.width) / 2;
    offsetY = (canvas.height - baseMap.height) / 2;

    loadBuildingsFromJSON();
};

function loadBuildingsFromJSON() {
    fetch("buildings.json")
        .then((response) => response.json())
        .then((data) => {
            return Promise.all(
                data.map((buildingData: BuildingData) => {
                    const building: Building = {
                        image: new Image(),
                        hitCanvas: document.createElement<"canvas">("canvas"),
                        hitCtx: undefined,
                        data: buildingData,
                        isSelected: false,
                    };
                    return new Promise((resolve) => {
                        building.image.onload = function () {
                            building.hitCanvas.width = building.image.width;
                            building.hitCanvas.height = building.image.height;

                            const hitCtx = building.hitCanvas.getContext("2d", {
                                willReadFrequently: true,
                            });
                            if (hitCtx == undefined)
                                throw new Error("hitCtx not found!");
                            else {
                                building.hitCtx = hitCtx;
                                building.hitCtx.drawImage(
                                    building.hitCanvas,
                                    0,
                                    0
                                );
                            }

                            resolve(building);
                        };
                        building.image.src = `/style/maps/osu/buildings/${buildingData.files}.svg`;
                    });
                })
            );
        })
        .then((loadedBuildings) => {
            loadedBuildings.forEach((building) => {
                buildings.set(building.data.files, building);
            });
            buildingsLoaded = true;
            drawImage();
        })
        .catch((error) => console.error("Error loading buildings:", error));
}

function drawImage() {
    if (!buildingsLoaded) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.drawImage(baseMap, 0, 0);

    buildings.forEach((building, name) => {
        ctx.save();
        if (name === selectedBuilding) {
            ctx.filter = "url(#selected-filter)";
        } else if (name === hoveringBuilding) {
            ctx.filter = "url(#hover-filter)";
        }
        ctx.drawImage(building.image, 0, 0);
        ctx.restore();
    });

    ctx.restore();
}

function startDragging(e: MouseEvent) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = "grabbing";
}

function drag(e: MouseEvent) {
    if (!isDragging) return;

    offsetX += e.clientX - lastX;
    offsetY += e.clientY - lastY;

    lastX = e.clientX;
    lastY = e.clientY;

    requestAnimationFrame(drawImage);
}

function stopDragging() {
    isDragging = false;
    canvas.style.cursor = hoveringBuilding ? "pointer" : "default";
}

function isPointOnBuilding(x: number, y: number) {
    for (const [name, building] of buildings) {
        if (
            x >= 0 &&
            x < building.image.width &&
            y >= 0 &&
            y < building.image.height
        ) {
            const pixelData = building.hitCtx.getImageData(x, y, 1, 1).data;
            if (pixelData[3] > 0) {
                return name;
            }
        }
    }
    return undefined;
}

canvas.addEventListener("mousedown", startDragging);
canvas.addEventListener("mousemove", (e) => {
    drag(e);
    if (!isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - offsetX) / scale;
        const mouseY = (e.clientY - rect.top - offsetY) / scale;

        const hovering = isPointOnBuilding(mouseX, mouseY);
        if (hovering !== hoveringBuilding) {
            hoveringBuilding = hovering;
            requestAnimationFrame(drawImage);
        }

        canvas.style.cursor = hoveringBuilding ? "pointer" : "default";
    }
});
canvas.addEventListener("mouseup", stopDragging);
canvas.addEventListener("mouseleave", stopDragging);

canvas.addEventListener("wheel", function (e) {
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

        requestAnimationFrame(drawImage);
    }
});

const debounce = (func: (...args: any[]) => void, delay: number) => {
    let debounceTimer: number;
    return function (this: any, ...funcArgs: any[]) {
        const context = this;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, funcArgs), delay);
    };
};

window.addEventListener(
    "resize",
    debounce(function () {
        if (canvas != undefined) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        requestAnimationFrame(drawImage);
    }, 100)
);

canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - offsetX) / scale;
    const clickY = (e.clientY - rect.top - offsetY) / scale;

    const clickedBuilding = isPointOnBuilding(clickX, clickY);
    if (clickedBuilding) {
        setSelectedBuilding(clickedBuilding);
        setHighlightInfo(buildings.get(clickedBuilding).data);
    } else {
        setSelectedBuilding(undefined);
    }
    requestAnimationFrame(drawImage);
});

function setSelectedBuilding(building?: Building) {
    if (building == undefined) {
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

export function deselectBuilding() {
    if (selectedBuilding) {
        buildings.get(selectedBuilding).isSelected = false;
        selectedBuilding = undefined;
        requestAnimationFrame(drawImage);
    }
}
