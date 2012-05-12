var map = null;
var mc = null;
var kmlLayer = null;
var markers = null;

var showKmlLayer = false;
var showMarketClusterer = false;

function toggleKmlLayer() {
	if (!kmlLayer) {
		var kmlUrl = window.location.href.substring(0, 1 + window.location.href.lastIndexOf('/')) + 'markers.kml';
		kmlLayer = new google.maps.KmlLayer(kmlUrl, {
			preserveViewport: true,
			suppressInfoWindows: false
		});
	}
	showKmlLayer = !showKmlLayer;
	if (showKmlLayer)
		kmlLayer.setMap(map);
	else
		kmlLayer.setMap(null);
}

function toggleMarkerClusterer() {
	if (markers==null)
		return;
	showMarketClusterer = !showMarketClusterer;
	if (showMarketClusterer) {
		if (mc)
			mc.addMarkers(markers);
		else
			mc = new MarkerClusterer(map, markers, {maxZoom: 19});
	} else
		mc.clearMarkers();
}

function loadData() {
	$.getJSON("data/data.json",function(data) {
		if (data) {
			markers=new Array();
			for (var i=0;i<data.length;i++) {
				if (data[i].length>2)
					markers[markers.length] = new google.maps.Marker({
				  		title: data[i][1],
				  		position: new google.maps.LatLng(
				      			data[i][2], data[i][3]),
				  		clickable: false,
				 		draggable: false,
				  		flat: true
					});
			}
			toggleMarkerClusterer();
		}
	});
}

function initialize() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: new google.maps.LatLng(38, 15),
		zoom: 2,
		mapTypeId: 'terrain',
		streetViewControl: false,
		mapTypeControlOptions: { mapTypeIds: [google.maps.MapTypeId.TERRAIN,google.maps.MapTypeId.HYBRID] } 
	});
	loadData();
}

google.maps.event.addDomListener(window, 'load', initialize);
