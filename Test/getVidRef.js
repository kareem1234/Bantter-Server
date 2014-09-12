var request = require("request");
var qs  = require("querystring");
var body = {
	    	"Name": "wmasD",
    	"FbId": 432341086,
    	"Id": 648042764,
    	"Age": 25,
    	"City": "Ottawa",
    	"Lat": 49,
    	"Lgt": 80,
    	"Gender": "Male",
    	"TimeStamp": 0,
        "FromFbId" :432341086
		};
var options = {
		url:"http://localhost:3000/getVideoRefs?" + qs.stringify(body),
		json:true,
};
var callback = function(err,res,body){
	if(err)
		console.log(err);
	else{
		console.log("completed request");
		console.dir(body);
	}
};
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function makeid(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

request.get(options,callback);