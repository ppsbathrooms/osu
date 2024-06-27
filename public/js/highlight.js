const imageCache = new Map();

function highlightDebounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function preloadImage(src) {
    if (!imageCache.has(src)) {
        const img = new Image();
        img.src = src;
        const cacheEntry = { img, color: null, loadFailed: false };
        imageCache.set(src, cacheEntry);
        
        img.onerror = () => {
            cacheEntry.loadFailed = true;
        };
    }
    return imageCache.get(src);
}

const setHighlightInfo = highlightDebounce((building) => {
    const imgSrc = `style/images/buildings/${building.files}.jpg`;
    const elements = {
        $img: $('.buildingImg img'),
        $title: $('#infoTitle'),
        $address: $('#infoAddress'),
        $info: $('#infoInfo'),
        $accessibility: $('#infoAccessibility'),
        $brInfo: $('#infoBrInfo'),
        $highlightInfo: $('#highlightInfo')
    };

    updateInfo(building, elements);
    showHighlight();

    const cachedData = preloadImage(imgSrc);
    if (cachedData.loadFailed) {
        setDefaultBackground(elements.$highlightInfo);
        elements.$img.attr('src', 'style/images/buildings/no-image.jpg');
    } else if (cachedData.img.complete) {
        updateImageAndBackground(cachedData, elements);
    } else {
        cachedData.img.onload = () => updateImageAndBackground(cachedData, elements);
        cachedData.img.onerror = () => {
            cachedData.loadFailed = true;
            setDefaultBackground(elements.$highlightInfo);
            elements.$img.attr('src', 'style/images/buildings/no-image.jpg');
        };
    }
}, 100);

async function updateImageAndBackground(cachedData, elements) {
    elements.$img.attr('src', cachedData.img.src);
    try {
        const color = cachedData.color || await getVibrantColor(cachedData.img);
        cachedData.color = color;
        setGradientBackground(elements.$highlightInfo, color);
    } catch {
        setDefaultBackground(elements.$highlightInfo);
    }
}

function setGradientBackground($element, color) {
    $element.css('background', `linear-gradient(to bottom, ${color}, #121211)`);
}

function setDefaultBackground($element) {
    setGradientBackground($element, '#333333');
}

function updateInfo(building, elements) {
    elements.$title.text(building.building);
    ['address', 'info', 'accessibility', 'brInfo'].forEach(key => {
        toggleElement(elements[`$${key}`], building[key], key === 'address');
    });
}

function toggleElement($element, content, isLink = false) {
    if (content) {
        $element.show();
        const $target = isLink ? $element.find('a') : $element.find('p');
        if (isLink) {
            $target.attr({
                href: `https://www.google.com/maps/search/${content}, corvallis Oregon`,
                target: '_blank'
            }).text(content);
        } else {
            $target.text(content);
        }
    } else {
        $element.hide();
    }
}

function showHighlight() {
    $('#info-button').hide();
    $('#highlightInfo').show();
}

function hideHighlight() {
    deselectBuilding();
    $('#info-button').show();
    $('#highlightInfo').hide();
}

function getVibrantColor(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.min(img.width, 100);
    canvas.height = Math.min(img.height, 100);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorCounts = {};
    const saturationThreshold = 0.3;
    const brightnessThreshold = 0.3;

    for (let i = 0; i < imageData.length; i += 16) {
        const [r, g, b] = imageData.slice(i, i + 3);
        const [, s, v] = rgbToHsv(r, g, b);

        if (s > saturationThreshold && v > brightnessThreshold) {
            const key = `${Math.round(r / 10) * 10},${Math.round(g / 10) * 10},${Math.round(b / 10) * 10}`;
            colorCounts[key] = (colorCounts[key] || 0) + 1;
        }
    }

    const vibrantColor = Object.entries(colorCounts).reduce((max, [color, count]) => 
        count > max[1] ? [color, count] : max, ['', 0])[0];

    return vibrantColor ? 
        Promise.resolve(`rgb(${vibrantColor})`) : 
        Promise.reject(new Error("No vibrant color found"));
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const v = max;
    const s = max === 0 ? 0 : diff / max;
    let h = 0;

    if (max !== min) {
        h = max === r ? (g - b) / diff + (g < b ? 6 : 0) :
            max === g ? (b - r) / diff + 2 :
                        (r - g) / diff + 4;
        h /= 6;
    }

    return [h, s, v];
}

$('#infoExit').on('click', hideHighlight);
$(document).on('keydown', event => {
    if (event.key === "Escape") hideHighlight();
});
