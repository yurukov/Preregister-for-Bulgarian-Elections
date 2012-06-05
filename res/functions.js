L.Control.Button=L.Class.extend({
	initialize: function(options){
		this._options=options;
	},
	onAdd: function(map){
		this._map=map;
		var container=$("<img id='" + this._options.id + "' src='" + this._options.icon + "'"+
		" alt='" + this._options.title + "' title='" + this._options.title + "'/>")
		.click(this._options.action)
		.mouseover(function() { $(this).css("left","10px") })
		.mouseout(function() { $(this).css("left","25px") });
		this._container=container.get(0);
	},
	
	getContainer: function(){
		return this._container;
	},
	getPosition: function(){
		return L.Control.Position.TOP_RIGHT;
	}
});

L.Icon.RegIcon = L.Icon.extend({
	shadowUrl: null,
	iconSize: new L.Point(32, 32),
	iconAnchor: new L.Point(16, 16),
	popupAnchor: new L.Point(16, -3)
});
L.Icon.SecIcon = L.Icon.extend({
	shadowUrl: null,
	iconSize: new L.Point(14, 14),
	iconAnchor: new L.Point(7, 7),
	popupAnchor: new L.Point(0, -7)
});

var map = null;
var mc = null;
var markers = null;
var posolstva = null;

var showMarketClusterer = false;
var showPosolstva = false;
var showSekcii = false;

function togglePosolstva() {
	if (posolstva==null)
		return;
	showPosolstva = !showPosolstva;
	var action = showPosolstva?map:null;
	for (i=0;i<posolstva.length;i++)
		if (!posolstva[i].samoSekciq && (showPosolstva || !posolstva[i].sekciq || !showSekcii) && posolstva[i]._map!=action) {
			if (action==map)
				map.addLayer(posolstva[i]);
			else
				map.removeLayer(posolstva[i]);
		}
	$("#posolstvo-button").attr("src",showPosolstva?"img/menu_pos.png":"img/menu_pos_g.png");
}

function toggleSekcii() {
	if (posolstva==null)
		return;
	showSekcii = !showSekcii;
	var action = showSekcii?map:null;
	for (i=0;i<posolstva.length;i++)
		if (posolstva[i].sekciq && (showSekcii || posolstva[i].samoSekciq || !showPosolstva) && posolstva[i]._map!=action) {
			if (action==map)
				map.addLayer(posolstva[i]);
			else
				map.removeLayer(posolstva[i]);
		}
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
			mc = new LeafClusterer(map, markers, {maxZoom: 19, gridSize: 50});
	} else {
		mc.clearMarkers();
	}
	$("#reg-button").attr("src",showMarketClusterer?"img/menu_reg.png":"img/menu_reg_g.png");
}

function loadPosolstvaData() {
	$.get("data/posolstva_iz.csv",function(data) {
		if (data) {
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

				var marker = new L.Marker(new L.LatLng(data[i][7][0].replace(/(^\s*)|(\s*$)/g, ""), data[i][7][1].replace(/(^\s*)|(\s*$)/g, "")),{
				  		title: data[i][2]+" в "+data[i][1],
						icon: new L.Icon.SecIcon(izb!=""? "img/sec_active.png?a" : "img/sec_inactive.png?a"),
						clickable: true,
				 		draggable: false,
					});
				
				marker.sekciq = izb!="";
				marker.samoSekciq = false;
				var contents ="";
				if (data[i][0]=="-1") {
					contents = "<div class=\"infodiv\"><h3>Изборна секция в "+data[i][1]+"</a></h3><small>Секция без официално представителство. Местоположението на картата не е точно.</small>"+izb+"</div>";
					marker.samoSekciq = true;
				} else if (data[i][0]=="0")
					contents = "<div class=\"infodiv\"><h3><a href=\"http://www.mfa.bg/bg/alphabetical/cr/1/\" target=\"\">"+data[i][2]+" в "+data[i][1]+"</a></h3>"+data[i][8]+izb+"</div>";
				else
					contents = "<div class=\"infodiv\"><h3><a href=\"http://www.mfa.bg/bg/"+data[i][0]+"/\" target=\"\">"+data[i][2]+" в "+data[i][1]+"</a></h3>"+data[i][8]+izb+"</div>";

				marker.bindPopup(contents, { maxWidth:450 });
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

					markers[markers.length] = new L.Marker(new L.LatLng(data[i][3], data[i][4]),{
				  		title: (data[i][2]==2 ? "Би помагал в организиране на секция" : data[i][2]==1 ? "Ще разпространява информация" : "Иска да гласува") + " в " + data[i][1],
						icon: new L.Icon.RegIcon("img/p_or.png"),
						clickable: true,
				 		draggable: false,
					});

			}
			toggleMarkerClusterer();
		}
	});
}


function initialize() {
	map = new L.Map('map');

	var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/1cd6c4f25e5a4c1d9622ca5599a486c3/64473/256/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
	    maxZoom: 14
	});
	map.setView(new L.LatLng(24.52, 10.19), 2).addLayer(cloudmade);

	loadData();
	loadPosolstvaData();

	map.addControl(new L.Control.Button({id:"posolstvo-button", icon:"img/menu_pos_g.png", title:"Покажи/скрий всички официални и почетни представителства", action:togglePosolstva}));
	map.addControl(new L.Control.Button({id:"sec-button", icon:"img/menu_vote_g.png", title:"Покажи/скрий всички секции в последните избори", action:toggleSekcii}));
	map.addControl(new L.Control.Button({id:"reg-button", icon:"img/menu_reg.png", title:"Покажи/скрий всички абонирани по света", action:toggleMarkerClusterer}));
	
	$("img[id$='-button']").tipsy({gravity: 'e',fade: true, html:true}); 
}

$(window).load(initialize);
