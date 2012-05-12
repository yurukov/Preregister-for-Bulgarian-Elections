Preregister-for-Bulgarian-Elections
===================================

This is a website that allows people to register for updates for the Bulgarian elections, group and organize for initiating new voting sections outside of Bulgaria. You can view it on http://vote.yurukov.net/. I am sharing it so that people can use it to quickly build Google forms based applications. A php script connects to the Google spreadsheet that collects the data from you form, geocodes it and saves it into a json format. The javascript website on the other hand loads the data and clusters it on a map. 

Here are some important things to be aware of:
- this site is in Bulgarian and contains several pages - map, form and about page
- you won't need to publish your spreadsheet. Just make a dummy Google account and share the spreadsheet with it. Then enter the details in config.php - credentials, sheet names and address column name
- the code includes pack.php, which gzips all of the static elements - html, css, js, etc. Check the code on how to use it. I've included my .htaccess, but you may want to change it. The json data is packed with gz by default. If you want to disable it, just swap the lines of code that allow for simple file writing.
- the proxy.php script requires the Zend Gdata libraries
- the proxy.php script is best used with a cron job like this:
0,30 * * * * cd /home/yurukov1/public_html/vote; /usr/local/php5/bin/php proxy.php

This code uses the Google_Spreadsheet class by Dimas Begunoff, http://www.farinspace.com/, as well as the Zind GData libraries. It is not intended to work out of the box and will require additional changes. It is provided as it is with no data protection and code guarantees.
