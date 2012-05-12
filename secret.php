<?php

$secret="secret";

if (!isset($_GET[$secret]) && !isset($argv)) {
	echo "<img src='http://upload.wikimedia.org/wikipedia/en/thumb/7/78/Trollface.svg/365px-Trollface.svg.png'/>";
	exit;
}
	

?>
