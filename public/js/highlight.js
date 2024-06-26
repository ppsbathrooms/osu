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
    const $imgElement = $('.buildingImg img');
    const $infoTitle = $('#infoTitle');
    const $infoAddress = $('#infoAddress');
    const $infoDescription = $('#infoDescription');
    const $infoAccessibility = $('#infoAccessibility');
    const $infoBrInfo = $('#infoBrInfo');
    const $highlightInfo = $('#highlightInfo');

    $imgElement.attr('src', imgSrc).on('error', function() {
        $(this).attr('src', 'style/images/buildings/no-image.jpg');
    });

    $imgElement.on('load', function() {
        if ($imgElement.attr('src') === 'style/images/buildings/no-image.jpg') {
            $highlightInfo.css('background-color', '#333');
        } else {
            const color = getDominantColor(this);
            $highlightInfo.css('background', `linear-gradient(to bottom, ${color}, ${'#121211'})`);
        }

        $infoTitle.html(building.building);

        function toggleElement($element, content, isLink = false) {
            if (content) {
                $element.show();
                if (isLink) {
                    $element.find('a').attr('href', `https://www.google.com/maps/search/${content}, corvallis Oregon`).attr('target', '_blank').text(content);
                } else {
                    $element.find('p').html(content);
                }
            } else {
                $element.hide();
            }
        }

        toggleElement($infoAddress, building.address, true);
        toggleElement($infoDescription, building.description);
        toggleElement($infoAccessibility, building.accessibility);
        toggleElement($infoBrInfo, building.brInfo);

        showHighlight();
    });
}
$('#info-button').on('click', () => {
    showHighlight();
})

$('#infoExit').on('click', () => {
    hideHighlight();
})

function showHighlight() {
    $('#info-button').hide();
    $('#highlightInfo').show();
}

function hideHighlight() {
    deselectBuilding();
    $('#info-button').show();
    $('#highlightInfo').hide();
}

$(document).on('keydown', function(event) {
    if (event.key == "Escape") {
        hideHighlight();
    }
});

// draws image as 1px and samples color
function getDominantColor(imageObject) {
    ctx.drawImage(imageObject, 0, 0, 1, 1);
    const i = ctx.getImageData(0, 0, 1, 1).data;
    // return `rgba(${i[0]},${i[1]},${i[2]},${i[3]})`;
    return "#" + ((1 << 24) + (i[0] << 16) + (i[1] << 8) + i[2]).toString(16).slice(1);
}