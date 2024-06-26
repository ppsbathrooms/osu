testData = {
    "files": "buxton-hall",
    "building": "Buxton Hall",
    "address": "310 SW Weatherford Place",
    "description": "",
    "accessibility": "ENTRIES: corner of Weatherford Place and Jefferson Street. FLOORS: A floors; elevator. FACILITIES: wheelchair accessible.",
    "brInfo": ""
}

setHighlightInfo(testData)

function setHighlightInfo(building) {
    $('#infoTitle').html(building.building);
    
    if (building.address) {
        $('#infoAddress').show();
        $('#infoAddress a').attr('href', `https://www.google.com/maps/search/${building.address}, corvallis Oregon`).attr('target', '_blank').text(building.address);
    } else {
        $('#infoAddress').hide();
    }

    if (building.description) {
        $('#infoDescription').show();
        $('#infoDescription p').html(building.description);
    } else {
        $('#infoDescription').hide();
    }

    if (building.accessibility) {
        $('#infoAccessibility').show();
        $('#infoAccessibility p').html(building.accessibility);
    } else {
        $('#infoAccessibility').hide();
    }

    if (building.brInfo) {
        $('#infoBrInfo').show();
        $('#infoBrInfo p').html(building.brInfo);
    } else {
        $('#infoBrInfo').hide();
    }

    const imgSrc = `style/images/buildings/${building.files}.jpg`;
    $('.buildingImg img').attr('src', imgSrc).on('error', function() {
        $(this).attr('src', 'style/images/buildings/no-image.jpg');
    });
    showHighlight();
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