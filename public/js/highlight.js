testData = {
    "files": "buxton-hall",
    "building": "Buxton Hall",
    "address": "310 SW Weatherford Place",
    "description": "",
    "accessibility": "ENTRIES: corner of Weatherford Place and Jefferson Street. FLOORS: A floors; elevator. FACILITIES: wheelchair accessible.",
    "brInfo": ""
}

// setHighlightInfo(testData)

function setHighlightInfo(building) {
    const imgSrc = `style/images/buildings/${building.files}.jpg`;
    const elements = {
        $img: $('.buildingImg img'),
        $title: $('#infoTitle'),
        $address: $('#infoAddress'),
        $description: $('#infoDescription'),
        $accessibility: $('#infoAccessibility'),
        $brInfo: $('#infoBrInfo'),
        $highlightInfo: $('#highlightInfo')
    };

    loadImage(imgSrc)
        .then(img => {
            elements.$img.attr('src', img.src);
            setBackgroundColor(img, elements.$highlightInfo);
            updateInfo(building, elements);
            showHighlight();
        });
}

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => setTimeout(() => resolve(img), 50);
        img.onerror = () => {
            img.src = 'style/images/buildings/no-image.jpg';
            resolve(img);
        };
        img.src = src;
    });
}

function setBackgroundColor(img, $highlightInfo) {
    const color = img.src.endsWith('no-image.jpg') ? '#333' : getDominantColor(img);
    $highlightInfo.css('background', `linear-gradient(to bottom, ${color}, #121211)`);
}

function updateInfo(building, elements) {
    elements.$title.html(building.building);
    toggleElement(elements.$address, building.address, true);
    toggleElement(elements.$description, building.description);
    toggleElement(elements.$accessibility, building.accessibility);
    toggleElement(elements.$brInfo, building.brInfo);
}

function toggleElement($element, content, isLink = false) {
    if (content) {
        $element.show();
        if (isLink) {
            $element.find('a')
                .attr('href', `https://www.google.com/maps/search/${content}, corvallis Oregon`)
                .attr('target', '_blank')
                .text(content);
        } else {
            $element.find('p').html(content);
        }
    } else {
        $element.hide();
    }
}


$('#info-button').on('click', showHighlight);
$('#infoExit').on('click', hideHighlight);
$(document).on('keydown', event => {
    if (event.key === "Escape") hideHighlight();
});

function showHighlight() {
    $('#info-button').hide();
    $('#highlightInfo').show();
}

function hideHighlight() {
    deselectBuilding();
    $('#info-button').show();
    $('#highlightInfo').hide();
}

// draws image as 1px and samples color
function getDominantColor(imageObject) {
    ctx.drawImage(imageObject, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}