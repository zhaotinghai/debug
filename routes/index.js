var express = require('express');
var router = express.Router();
var http = require('http');
var https = require('https');
var dns = require('dns'); 
var dnscache = {
	'device': ['202.108.5.219']
};

// req.to
router.use('/', function(req, res, next) {
	console.log('[DEBUG] ' + req.method + ' ' + req.protocol + '://' + req.hostname +req.url);
	console.log(JSON.stringify(req.headers));
	// options to request real server
	var bHttp = 'http' == req.protocol;
	req.to = {
		hostname:req.hostname,
		port:req.port||(bHttp?80:443),
		path:req.url,
		headers: JSON.parse(JSON.stringify(req.headers)), //req.headers,
		//agent : false,
		//rejectUnauthorized:false,
		method:req.method,
		http:bHttp?http:https
	};
	next();
});
// dns modify req.to
router.use('/', function(req, res, next) {
	//console.log('dnscache: ' + JSON.stringify(dnscache));
	var hostname = req.to.hostname;
	var addresses = dnscache[hostname];
	if(addresses){
		req.to.hostname = addresses[0];
		next();
	}
	else{
		dns.resolve4(hostname, function (err, addresses) {
			if (err) throw err; 
			dnscache[hostname] = addresses;
			req.to.hostname = addresses[0];
			console.log('addresses: ' + JSON.stringify(addresses));
			// addresses.forEach(function (a) {
			// 	dns.reverse(a, function (err, domains) {
			// 		if (err) { console.log('reverse for ' + a + ' failed: ' + err.message); } 
			// 		else { console.log('reverse for ' + a + ': ' + JSON.stringify(domains)); } 
			// 	}); 
			// }); 
		next();
	});
	}
});

// send req.to by req.to.http
router.use('/', function(req, res, next) {
	console.log('req.to.headers:' + JSON.stringify(req.to.headers));
	var req1 = req.to.http.request(req.to, function(res1){
		//res1.headers['Content-Type'] = 'application/json';
		//res1.headers['connection'] = 'close';
		//console.log(JSON.stringify(res1.headers));
		res.writeHead(res1.statusCode ,res1.headers);
		res1.pipe(res);
	}).on('error' , function(e){
		try{res.end('error happend :' + req.url + " " + e.message + " " + e.LineNumber);}catch(e){};
	});

	if(req.rawBody){ //('POST' == req.method){
		console.log('req.rawBody:' + req.rawBody)
		req1.write(req.rawBody);
	}
	req1.end();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
