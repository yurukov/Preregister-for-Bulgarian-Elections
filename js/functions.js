var map = null;
var mc = null;
var kmlLayer = null;
var markers = null;
var posolstva = null;

var showKmlLayer = false;
var showMarketClusterer = false;
var showPosolstva = false;

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

function togglePosolstva() {
	if (posolstva==null)
		return;
	showPosolstva = !showPosolstva;
	for (i=0;i<posolstva.length;i++)
		posolstva[i].setMap(showPosolstva?map:null);
}


function toggleMarkerClusterer() {
	if (markers==null)
		return;
	showMarketClusterer = !showMarketClusterer;
	if (showMarketClusterer) {
		if (mc)
			mc.addMarkers(markers);
		else
			mc = new MarkerClusterer(map, markers, {maxZoom: 19, gridSize: 50});
	} else
		mc.clearMarkers();
}

function loadPosolstvaData() {
	$.get("data/posolstva.csv",function(data) {
		if (data) {
			posolstva=new Array();
			data = data.replace(/(^\s*)|(\s*$)/g, "").split("\n");
			for (var i=0;i<data.length;i++) {
				data[i]=data[i].split("\t");
				if (!data[i][3]) {
					alert(i);
					return;
}
				data[i][3]=data[i][3].split(",");
				posolstva[posolstva.length] = new google.maps.Marker({
			  		title: data[i][2]+" в "+data[i][1],
					icon: "img/pos2.png",
			  		position: new google.maps.LatLng(
			      			data[i][3][0].replace(/(^\s*)|(\s*$)/g, ""), data[i][3][1].replace(/(^\s*)|(\s*$)/g, "")),
			  		clickable: true,
			 		draggable: false,
			  		flat: true
				});
			}
			togglePosolstva();
		}
	});
}

function loadData() {
	$.getJSON("data/data.json?v1",function(data) {
		if (data) {
			markers=new Array();
			for (var i=0;i<data.length;i++) {
				if (data[i].length>3)
					markers[markers.length] = new google.maps.Marker({
				  		title: data[i][2]==2 ? "Би помагал в организиране на секция" : data[i][2]==1 ? "Ще разпространява информация" : "Иска да гласува",
//						icon: data[i][2]==2 ? "img/p_or.png" : data[i][2]==1 ? "img/p_s.png" : "img/p_wait.png",
						icon: "img/p_or.png",
				  		position: new google.maps.LatLng(
				      			data[i][3], data[i][4]),
				  		clickable: true,
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
