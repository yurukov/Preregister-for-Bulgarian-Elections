<?php

/*********************************************************

(CC) Boyan Yurukov http://yurukov.net/blog

Usage in web: 
   http://...../proxy.php?secret
List addresses in error explicitly: 
   http://...../proxy.php?secret&list
Recheck addresses in error: 
   http://...../proxy.php?secret&recheck
Forse re-geotaging of all addresses: 
   http://...../proxy.php?secret&force


This code is using the Google_Spreadsheet class by Dimas Begunoff, http://www.farinspace.com/, 
as well as the Zind GData libraries

This class is best used with a cronjob like this:
0,30 * * * * cd /home/yurukov1/public_html/vote; /usr/local/php5/bin/php proxy.php
If an email is configured for the cronjob, then all addresses in error will be printed out only once.

*********************************************************/

mb_internal_encoding("UTF-8");

$datafile = "data/.data.json.gz";


//the path yo your ZEND libs
set_include_path("/home/yurukov1/libs/");
include_once("Google_Spreadsheet.php");
include("secret.php");
include_once("config.php");

//access settings should be defined in config.php 
$ss = new Google_Spreadsheet($u,$p);
$ss->useSpreadsheet($spreadsh);
$ss->useWorksheet($sheet);
 
// get the data from the spreadsheet
$rows = $ss->getRows();
if (!$rows) exit;
$data=array();
for ($i=0;$i<count($rows);$i++) {
	$type=$rows[$i]["искателидапомогнете"];
	if ($type=="Ще разпостранявам информация сред познати")
		$type=1;
	else
	if ($type=="Бих се заел с организиране на секция извън консулствата")
		$type=2;
	else
		$type=0;
	$data[]=array($rows[$i]["timestamp"], trim(str_replace("\"\"","'",$rows[$i][$address_column])),$type);
}

//check and load the old data
if (file_exists($datafile)) {
	// Swap the lines in case you don't want gziped data 
	//$olddata = json_decode(file_get_contents("data/data.json"));
	$olddata = json_decode(implode("",gzfile($datafile)));
} else
	$olddata = array();

// init updated data and addesses that can't be found
$newlines = array();
$badaddesses = array();
$badaddessesnew=false;

// walk the data
for ($i=0;$i<count($data);$i++) {
	$items=$data[$i];
	// Check if this line is contained in the old data, so that
	// we won't have to geocode it again and thus save google calls.
	// This also takes into account updated addresses in case you
	// need fix one that can't be found.
	if (count($olddata)>$i && !isset($_GET["force"])) {
		$olditems = $olddata[$i];
		if ($items[0]==$olditems[0] && $items[1]==$olditems[1]) {
			if (count($olditems)<5 && !isset($_GET["recheck"]))
				$badaddesses[]=implode(",",$olddata[$i]);
			if (count($olditems)==5 || !isset($_GET["recheck"])) {
				$newlines[]=$olditems;
				continue;
			}
		}
	}
	// geocode the location
	$geo=getLocation($items[1]);
	// list the addresses that can't be found
	if ($geo==0 || $geo==-1) {
		$badaddessesnew=true;
		$badaddesses[]=implode(",",$items) . ($geo==-1? " - адресът е в България": "");
	} else
		$items=array_merge($items,$geo);
	$newlines[] = $items;
}

// update the data on the server in case of changes
if (json_encode($olddata)!=json_encode($newlines)) {
	// Swap the lines in case you don't want gziped data 
	//file_put_contents("data/data.json",json_encode($newlines));
	$f = fopen ( $datafile, 'w' );
	fwrite ( $f,  gzencode ( json_encode($newlines) , 9 ));
	fclose ( $f );
}

// Print out bad addesses. Useful for cron jobs and mailing
if (count($badaddesses)>0 && ($badaddessesnew || isset($_GET["list"]))) {
	echo "Проблемни адреси:\n";
	echo implode("\n",$badaddesses);
}

	
// This function geocodes an address. The location picked for each point is randomly shifted a bit
// to break up the clustering of many addresses piling up in exactly the same coordinates of a city
function getLocation($address) {
	set_time_limit(60);
	$address = urlencode($address);
	//wait 1/2 second so that Google won't throttle
	usleep(500000);
	//geotag the location
	$geo = json_decode(file_get_contents("http://maps.googleapis.com/maps/api/geocode/json?address=$address&sensor=false"));
	//check the first result as it's the one with highest probability
	if ($geo && count($geo->results)>0) {

		//check if the addess is in Bulgaria
		if ($geo->results[0]->address_components)
			for ($i=0;$i<count($geo->results[0]->address_components);$i++) 
				if ($geo->results[0]->address_components[$i]->long_name=="Bulgaria")
					return -1;

		//calculate the marker position
		if ($geo->results[0]->geometry) {
			$geom=$geo->results[0]->geometry;
			$span=1;
			
			//get the city bounds, divide them by half and limit it to one unit
			if ($geom->bounds) {
				$lat_span=abs(doubleval($geom->bounds->northeast->lat)-doubleval($geom->bounds->southwest->lat));
				$lng_span=abs(doubleval($geom->bounds->northeast->lng)-doubleval($geom->bounds->southwest->lng));
				$span = ($lat_span+$lng_span)/4;
				if ($span>1)
					$span=1;
			}

			//get the center of the city and distribute the markers in radial pattern with random distance and degrees
			if ($geom->location) {
				$lat = doubleval($geom->location->lat)+rand()/getrandmax()*rand()/getrandmax()*$span*sin(rand()/getrandmax()*2*pi());
				$lng = doubleval($geom->location->lng)+rand()/getrandmax()*rand()/getrandmax()*$span*cos(rand()/getrandmax()*2*pi());
				return array($lat,$lng);
			}
		}
	} 

	return 0;
}
	
?>
