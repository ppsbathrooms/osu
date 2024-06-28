import $ from "jquery";
import { BuildingData, deselectBuilding, getCtx } from "./map";

type ImageCacheEntry = {
    image: HTMLImageElement;
    color: string | undefined;
    loadFailed: boolean;
};

type Elements = {
    $img: JQuery<HTMLImageElement>;
    $title?: JQuery<HTMLElement>;
    $address?: JQuery<HTMLElement>;
    $info?: JQuery<HTMLElement>;
    $accessibility?: JQuery<HTMLElement>;
    $brInfo?: JQuery<HTMLElement>;
    $highlightInfo: JQuery<HTMLElement>;
};

const imageCache = new Map<string, ImageCacheEntry>();

function highlightDebounce(func: (...args: any[]) => void, wait: number) {
    let timeout: number;
    return function (this: any, ...funcArgs: any[]) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, funcArgs), wait);
    };
}

function preloadImage(src: string) {
    if (!imageCache.has(src)) {
        const img = new Image();
        img.src = src;
        const cacheEntry: ImageCacheEntry = {
            image: img,
            color: undefined,
            loadFailed: false,
        };
        imageCache.set(src, cacheEntry);

        img.onerror = () => {
            cacheEntry.loadFailed = true;
        };
    }
    return imageCache.get(src);
}

export const setHighlightInfo = highlightDebounce((building) => {
    const imgSrc = `style/images/buildings/${building.files}.jpg`;
    const elements: Elements = {
        $img: $(".buildingImg /* img"),
        $title: $("#infoTitle"),
        $address: $("#infoAddress"),
        $info: $("#infoInfo"),
        $accessibility: $("#infoAccessibility"),
        $brInfo: $("#infoBrInfo"),
        $highlightInfo: $("#highlightInfo"),
    };

    updateInfo(building, elements);
    showHighlight();

    const cachedData = preloadImage(imgSrc);
    if (!cachedData) throw new Error("Failed o load cachedData");

    if (cachedData.loadFailed) {
        setDefaultBackground(elements.$highlightInfo);
        elements.$img.attr("src", "style/images/buildings/no-image.jpg");
    } else if (cachedData.image.complete) {
        updateImageAndBackground(cachedData, elements);
    } else {
        cachedData.image.onload = () =>
            updateImageAndBackground(cachedData, elements);
        cachedData.image.onerror = () => {
            cachedData.loadFailed = true;
            setDefaultBackground(elements.$highlightInfo);
            elements.$img.attr("src", "style/images/buildings/no-image.jpg");
        };
    }
}, 100);

async function updateImageAndBackground(
    cachedData: ImageCacheEntry,
    elements: Elements
) {
    elements.$img.attr("src", cachedData.image.src);
    try {
        const color =
            cachedData.color || (await getVibrantColor(cachedData.image));
        cachedData.color = color;
        setGradientBackground(elements.$highlightInfo, color);
    } catch {
        setDefaultBackground(elements.$highlightInfo);
    }
}

function setGradientBackground($element: JQuery<HTMLElement>, color: string) {
    $element.css("background", `linear-gradient(to bottom, ${color}, #121211)`);
}

function setDefaultBackground($element: JQuery<HTMLElement>) {
    setGradientBackground($element, "#333333");
}

function updateInfo(building: BuildingData, elements: Elements) {
    elements.$title!.text(building.building);
    (["address", "info", "accessibility", "brInfo"] as const).forEach((key) => {
        toggleElement(
            elements[`$${key}` as keyof Elements],
            building[key],
            key === "address"
        );
    });
}

function toggleElement(
    $element: JQuery<HTMLElement> | undefined,
    content: string,
    isLink = false
) {
    if (!$element) throw new Error("Element not found");

    if (content) {
        $element.show();
        const $target = isLink ? $element.find("a") : $element.find("p");
        if (isLink) {
            $target
                .attr({
                    href: `https://www.google.com/maps/search/${content}, corvallis Oregon`,
                    target: "_blank",
                })
                .text(content);
        } else {
            $target.text(content);
        }
    } else {
        $element.hide();
    }
}

function showHighlight() {
    $("#info-button").hide();
    $("#highlightInfo").show();
}

function hideHighlight() {
    deselectBuilding();
    $("#info-button").show();
    $("#highlightInfo").hide();
}

function getVibrantColor(img: HTMLImageElement) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(img.width, 100);
    canvas.height = Math.min(img.height, 100);
    getCtx().drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = getCtx().getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    ).data;
    const colorCounts: Map<string, number> = new Map();
    const saturationThreshold = 0.3;
    const brightnessThreshold = 0.3;

    for (let i = 0; i < imageData.length; i += 16) {
        const [r, g, b] = imageData.slice(i, i + 3);
        const [, s, v] = rgbToHsv(r, g, b);

        if (s > saturationThreshold && v > brightnessThreshold) {
            const key = `${Math.round(r / 10) * 10},${
                Math.round(g / 10) * 10
            },${Math.round(b / 10) * 10}`;
            colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        }
    }

    const vibrantColor = Object.entries(colorCounts).reduce(
        (max, [color, count]) => (count > max[1] ? [color, count] : max),
        ["", 0]
    )[0];

    return vibrantColor
        ? Promise.resolve(`rgb(${vibrantColor})`)
        : Promise.reject(new Error("No vibrant color found"));
}

function rgbToHsv(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const v = max;
    const s = max === 0 ? 0 : diff / max;
    let h = 0;

    if (max !== min) {
        h =
            max === r
                ? (g - b) / diff + (g < b ? 6 : 0)
                : max === g
                ? (b - r) / diff + 2
                : (r - g) / diff + 4;
        h /= 6;
    }

    return [h, s, v];
}

$("#infoExit").on("click", hideHighlight);
$(document).on("keydown", (event) => {
    if (event.key === "Escape") hideHighlight();
});
