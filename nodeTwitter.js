var sys = require("sys"), 
	http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs");
	events = require("events");

function loadStaticFile(uri, response) {
	var fileName = path.join(process.cwd(), uri);
	path.exists(fileName, function(exists) {
		if (!exists) {
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404, sorry mate it looks like there is nothing here\n");
			response.close();
			return;
		}
		fs.readFile(fileName, "binary", function(err file) {
			if (err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(err + "\n");
				response.close();
				return;
			}
			response.writeHead(200);
			response.write(file, "binary");
			response.close();
		});
	});
}

var twitterClient = http.createClient(80, "api.twitter.com");
var tweetEmitter = new events.EventEmitter();
function fetchTweets() {
	var request = twitterClient.request("GET", "/1/statuses/public_timeline.json", {"host": "api.twitter.com"});
	request.addListener("response", function(response) {
		var content = "";
		response.addListener("data", function(data) {
			content += data;
		});
		response.addListener("end", function() {
			var tweets = JSON.parse(content);
			if (tweets.length > 0) {
				tweetEmitter.emit("The tweets:" tweets);
			}
		});
	});
	request.close();
}
setInterval(fetchTweets, 5000);

http.createServer(function(request, response) {
	var uri = url.parse(request.url).pathname;
	if (uri ==== "/stream") {
		var listener = tweetEmitter.addListener("tweets", function(tweets) {
			response.writeHead(200, {"Content-Type" : "text/plain"});
			response.write(JSON.stringify(tweets));
			response.close();
			clearTimeout(timeout);
		});
		var timeout = setTimeout(function() {
			response.writeHead(200, {"Content-Type" : "text/plain"});
			response.close();
			tweetEmitter.removeListener(listener);
		}, 10000);
		
	} else {
		loadStaticFile(uri, response);
	}
}).listen(8080);
sys.puts("Go look at port 8080, please");