var map = null;
var mc = null;
var kmlLayer = null;
var markers = null;
var posolstva = null;
var infowindow = null;

var oldZoom = false;
var bigIconsFromZoom = 6;

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
	$("#posolstvo-button").attr("src",showPosolstva?"img/menu_pos.png":"img/menu_pos_g.png");
}

function toggleSekcii() {
	if (posolstva==null)
		return;
	showSekcii = !showSekcii;
	var action = showSekcii?map:null;
	for (i=0;i<posolstva.length;i++)
		if (posolstva[i].sekciq && (showSekcii || posolstva[i].samoSekciq || !showPosolstva) && posolstva[i].getMap()!=action)
				posolstva[i].setMap(action);
	$("#sec-button").attr("src",showSekcii?"img/menu_vote.png":"img/menu_vote_g.png");
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
	$("#reg-button").attr("src",showMarketClusterer?"img/menu_reg.png":"img/menu_reg_g.png");
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
					icon: getPosIcon(izb!="", data[i][0]=="-1"),
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
				  		title: (data[i][2]==2 ? "Би помагал в организиране на секция" : data[i][2]==1 ? "Ще разпространява информация" : "Иска да гласува") + " в " + data[i][1],
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
	$("<img id=\"posolstvo-button\" src=\"img/menu_pos_g.png\""+
	" alt=\"Покажи/скрий всички официални и почетни представителства\" title=\"Покажи/скрий всички официални и почетни представителства\"/>")
	.click(togglePosolstva).appendTo($(div))
	.mouseover(function() { $(this).css("left","10px")})
	.mouseout(function() { $(this).css("left","25px")});
}
function SekciiControl(div,map) {
	$("<img id=\"sec-button\" src=\"img/menu_vote_g.png\""+
	" alt=\"Покажи/скрий всички секции в последните избори\" title=\"Покажи/скрий всички секции в последните избори\"/>")
	.click(toggleSekcii).appendTo($(div))
	.mouseover(function() { $(this).css("left","10px")})
	.mouseout(function() { $(this).css("left","25px")});
}
function RegControl(div,map) {
	$("<img id=\"reg-button\" src=\"img/menu_reg.png\""+
	" alt=\"Покажи/скрий всички абонирани по света\" title=\"Покажи/скрий всички абонирани по света\"/>")
	.click(toggleMarkerClusterer).appendTo($(div))
	.mouseover(function() { $(this).css("left","10px")})
	.mouseout(function() { $(this).css("left","25px")});
}

function changedZoop() {
	if (oldZoom==map.getZoom())
		return;
	if ((oldZoom<bigIconsFromZoom && map.getZoom()>=bigIconsFromZoom) ||
		(oldZoom>=bigIconsFromZoom && map.getZoom()<bigIconsFromZoom)) {
		for (i=0;i<posolstva.length;i++)
			posolstva[i].setIcon(getPosIcon(posolstva[i].sekciq,posolstva[i].samoSekciq));
	}
	oldZoom=map.getZoom();
}

function getPosIcon(sekciq, samoSekciq) {
	return map.getZoom()<bigIconsFromZoom ? (sekciq ? (samoSekciq ? "img/pos_small_v1.png" : "img/pos_small_pv1.png") : "img/pos_small_p1.png") :
						 (sekciq ? (samoSekciq ? "img/pos7.png" : "img/pos5.png") : "img/pos4.png");
}


function initialize() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: new google.maps.LatLng(38, 15),
		zoom: 2,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		streetViewControl: false,
		mapTypeControl: false
	});
	loadData();
	loadPosolstvaData();

	oldZoom=map.getZoom();
	google.maps.event.addListener(map, 'zoom_changed', changedZoop);

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


//MarkerClustererMod

ClusterIcon.prototype.onAdd = function() {
  this.div_ = document.createElement('DIV');
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);
    this.div_.innerHTML = this.sums_.text;
    this.div_.title = "В този регион има "+this.sums_.text+" записали се. Кликнете, за да видите всички.";
  }

  var panes = this.getPanes();
  panes.overlayMouseTarget.appendChild(this.div_);

  var that = this;
  google.maps.event.addDomListener(this.div_, 'click', function() {
    that.triggerClusterClick();
  });
};

ClusterIcon.prototype['onAdd'] = ClusterIcon.prototype.onAdd;

