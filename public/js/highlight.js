function setHighlightInfo(building) {
    $('#infoTitle').html(building.building);
    $('#infoAddress').html(building.address);
    $('#infoDescription').html(building.description);
    $('#infoSecondaryInfo').html(building.secondaryInfo);
    $('#infoBrInfo').html(building.brInfo);
    $('.buildingImg img').attr('src', `style/images/buildings/${building.image}`);
    $('#info-button').hide();
    $('#highlightInfo').show();    
}

$('#info-button').on('click', () => {
    $('#info-button').hide();
    $('#highlightInfo').show();
})

$('#infoExit').on('click', () => {
    $('#info-button').show();
    $('#highlightInfo').hide();
})