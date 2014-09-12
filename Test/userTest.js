var request = require("request");
for(var i =0; i< 100; i++){
	var options = {
		url:"http://localhost:3000/insertUser",
		json:true,
		body:{
			Name: makeid(),
			FbId: Math.floor(Math.random() * 1000000000),
			Id: Math.floor(Math.random() * 1000000000),
			Age: getRandomInt(17,30),
			City: "Ottawa",
			Lat: getRandomInt(40,50),
			Lgt: getRandomInt(80,90),
			Gender: "Female",
			TimeStamp: 0
		}
	};
	request.post(options,callback);
}
setTimeout(function() {
  console.log('This will still run.');
}, 500);

var callback = function(err,res,body){
	if(err)
		console.log(err);
	else
		console.log("completed request");
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

request.post(options,callback);