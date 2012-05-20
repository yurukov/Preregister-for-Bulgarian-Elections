var map = null;
var mc = null;
var kmlLayer = null;
var markers = null;
var posolstva = null;
var infowindow = null;

var showKmlLayer = false;
var showMarketClusterer = false;
var showPosolstva = false;
var showSekcii = false;

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
	var action = showPosolstva?map:null;
	for (i=0;i<posolstva.length;i++)
		if (!posolstva[i].samoSekciq && (showPosolstva || !posolstva[i].sekciq || !showSekcii) && posolstva[i].getMap()!=action)
				posolstva[i].setMap(action);
	$("#posolstvo-button").attr("src",showPosolstva?"img/pos_b1.png":"img/pos_b1_g.png");
}

function toggleSekcii() {
	if (posolstva==null)
		return;
	showSekcii = !showSekcii;
	var action = showSekcii?map:null;
	for (i=0;i<posolstva.length;i++)
		if (posolstva[i].sekciq && (showSekcii || posolstva[i].samoSekciq || !showPosolstva) && posolstva[i].getMap()!=action)
				posolstva[i].setMap(action);
	$("#sec-button").attr("src",showSekcii?"img/p_v1.png":"img/p_v1_g.png");
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
	} else {
		mc.clearMarkers();
	}
	$("#reg-button").attr("src",showMarketClusterer?"img/p_b1.png":"img/p_b1_g.png");
}

function loadPosolstvaData() {
	$.get("data/posolstva_iz.csv",function(data) {
		if (data) {
			infowindow = new google.maps.InfoWindow({maxWidth:450});
			google.maps.event.addListener(map, 'click', function() {
				infowindow.close();
			});

			posolstva=new Array();
			data = data.replace(/(^\s*)|(\s*$)/g, "").split("\n");
			for (var i=0;i<data.length;i++) {
				data[i]=data[i].split("\t");
				data[i][7]=data[i][7].split(",");


				izb="";
				if (data[i][3]!="")
					izb+="<br/><i>Парламентарни '09:</i> <b>"+data[i][3]+"</b>";
				if (data[i][4]!="")
					izb+="<br/><i>Европейски '09:</i> <b>"+data[i][4]+"</b>";
				if (data[i][5]!="")
					izb+="<br/><i>Президентски '11 (1ви/2ри тур):</i> <b>"+data[i][5]+"/"+data[i][6]+"</b>";
				if (izb!="") 
					izb="<br/><br/><b>Проведени избори и гласували</b>"+izb;

				var marker = new google.maps.Marker({
			  		title: data[i][2]+" в "+data[i][1],
					icon: data[i][0]=="-1"? "img/pos7.png" : (izb!="" ? "img/pos5.png" : "img/pos4.png"),
			  		position: new google.maps.LatLng(
			      			data[i][7][0].replace(/(^\s*)|(\s*$)/g, ""), data[i][7][1].replace(/(^\s*)|(\s*$)/g, "")),
			  		clickable: true,
			 		draggable: false,
			  		flat: true
				});
				
				marker.sekciq = izb!="";
				marker.samoSekciq = false;
				if (data[i][0]=="-1") {
					marker.contents = "<div class=\"infodiv\"><h3>Изборна секция в "+data[i][1]+"</a></h3><small>Секция без официално представителство. Местоположението на картата не е точно.</small>"+izb+"</div>";
					marker.samoSekciq = true;
				} else if (data[i][0]=="0")
					marker.contents = "<div class=\"infodiv\"><h3><a href=\"http://www.mfa.bg/bg/alphabetical/cr/1/\" target=\"\">"+data[i][2]+" в "+data[i][1]+"</a></h3>"+data[i][8]+izb+"</div>";
				else
					marker.contents = "<div class=\"infodiv\"><h3><a href=\"http://www.mfa.bg/bg/"+data[i][0]+"/\" target=\"\">"+data[i][2]+" в "+data[i][1]+"</a></h3>"+data[i][8]+izb+"</div>";

				google.maps.event.addListener(marker, 'click', function() {
					infowindow.setContent(this.contents);
					infowindow.open(map,this);
				});
				posolstva[posolstva.length] = marker;
			}
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

function PosolstvoControl(div,map) {
	$("<img id=\"posolstvo-button\" src=\"img/pos_b1_g.png\""+
	" alt=\"Покажи/скрий всички официални и почетни представителства\" title=\"Покажи/скрий всички официални и почетни представителства\"/>")
	.click(togglePosolstva).appendTo($(div));	
}
function SekciiControl(div,map) {
	$("<img id=\"sec-button\" src=\"img/p_v1_g.png\""+
	" alt=\"Покажи/скрий всички секции в последните избори\" title=\"Покажи/скрий всички секции в последните избори\"/>")
	.click(toggleSekcii).appendTo($(div));	
}
function RegControl(div,map) {
	$("<img id=\"reg-button\" src=\"img/p_b1.png\""+
	" alt=\"Покажи/скрий всички абонирани по света\" title=\"Покажи/скрий всички абонирани по света\"/>")
	.click(toggleMarkerClusterer).appendTo($(div));	
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
	loadPosolstvaData();

	var posControlDiv = document.createElement('div');
	var posControl = new PosolstvoControl(posControlDiv, map);
	posControlDiv.index = 1;
	var secControlDiv = document.createElement('div');
	var secControl = new SekciiControl(secControlDiv, map);
	secControlDiv.index = 2;
	var regControlDiv = document.createElement('div');
	var regControl = new RegControl(regControlDiv, map);
	regControlDiv.index = 3;

	map.controls[google.maps.ControlPosition.RIGHT_TOP].push(posControlDiv);
	map.controls[google.maps.ControlPosition.RIGHT_TOP].push(secControlDiv);
	map.controls[google.maps.ControlPosition.RIGHT_TOP].push(regControlDiv);

	setTimeout(function() { $("img[id$='-button']").tipsy({gravity: 'e',fade: true, html:true}); },1000);
}

$(window).load(initialize);
