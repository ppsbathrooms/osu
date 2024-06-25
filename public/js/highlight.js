function setHighlightInfo(building) {
    $('#infoTitle').html(building.building);
    $('#infoAddress').html(building.address);
    $('#infoDescription').html(building.description);
    $('#infoSecondaryInfo').html(building.secondaryInfo);
    $('#infoBrInfo').html(building.brInfo);
    $('.buildingImg img').attr('src', `style/images/buildings/${building.image}`);
    showHighlight();
}

$('#info-button').on('click', () => {
    showHighlight();
})

$('#infoExit').on('click', () => {
    deselectBuilding();
    $('#info-button').show();
    $('#highlightInfo').hide();
})

function showHighlight() {
    $('#info-button').hide();
    $('#highlightInfo').show();
}