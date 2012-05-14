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

$datafile = "data/data.json.gz";

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
for ($i=0;$i<count($rows);$i++)
	$data[]=array($rows[$i]["timestamp"], trim(str_replace("\"\"","'",$rows[$i][$address_column])));

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
			if (count($olditems)<4 && !isset($_GET["recheck"]))
				$badaddesses[]=implode(",",$olddata[$i]);
			if (count($olditems)==4 || !isset($_GET["recheck"])) {
				$newlines[]=$olditems;
				continue;
			}
		}
	}
	// geocode the location
	$geo=getLocation($items[1]);
	// list the addresses that can't be found
	if (!$geo) {
		$badaddessesnew=true;
		$badaddesses[]=implode(",",$items);
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
	echo "Проблеми адреси:\n";
	echo implode("\n",$badaddesses);
}

	
// This function geocodes an address. The location picked for each point is randomly shifted a bit
// to break up the clustering of many addresses piling up in exactly the same coordinates of a city
function getLocation($address) {
	set_time_limit(60);
	$address = urlencode($address);
	$geo = json_decode(file_get_contents("http://maps.googleapis.com/maps/api/geocode/json?address=$address&sensor=false"));
	if ($geo && count($geo->results)>0 && $geo->results[0]->geometry) {
		$geom=$geo->results[0]->geometry;
		$lat_span=0.1;
		$lng_span=0.1;
		if ($geom->bounds) {
			$lat_span=abs(doubleval($geom->bounds->northeast->lat)-doubleval($geom->bounds->southwest->lat));
			$lng_span=abs(doubleval($geom->bounds->northeast->lng)-doubleval($geom->bounds->southwest->lng));
			if ($lat_span>0.1)
				$lat_span=0.1;
			if ($lng_span>0.1)
				$lng_span=0.1;
		}
		if ($geom->location)
			return array(doubleval($geom->location->lat)+(rand()/getrandmax()-0.5)*$lat_span, doubleval($geom->location->lng)+(rand()/getrandmax()-0.5)*$lng_span);
	} 

	return false;
}
	
?>
