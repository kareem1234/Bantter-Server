
var db = require("../database/db.js");
var crypto = require("crypto");
var bucket = "bantter-uploads";
var credentials = require('../config.json');
var awsKey = credentials.accessKeyId;
var secret = credentials.secretAccessKey;

function errCallback(res){
	//console.log("error found");
	var func = function(err){
		if(err)
			console.log(err);
		if(res && !res.headersSent)
			res.send(404);
	};
	return func;
}
exports.insertUser = function(req,res){
	var user = req.body;
	console.log("printing user: "+ JSON.stringify(user));
	convertPropsToNum(user);
	var err = errCallback(res);
	console.log("printing modified user: "+ JSON.stringify(user));
	var callback2 = function(){res.end();};
	var callback1 = function(){db.insertUser(user,callback2,err);};
	db.insertIdPair(user.FbId,user.Id,callback1,err);
}
exports.insertLike = function(req,res){
	convertPropsToNum(req.body);
	checkPermision(req.body.Id,req.body.FbId,res,function(){
		db.insertLike(req.body.Like,function(){
			res.end();
		},errCallback(res));
	});
}
exports.findUsers = function(req,res){
	convertPropsToNum(req.query);
	var query = db.getUserQuery(req.query.Age,req.query.Gender);
	var callback = function(docs){
		for(var i=0; i<docs.length; i++)
				delete docs[i].Id;
		res.json(docs);
	}
	console.log("printing returned matches: "+JSON..stringify)
	db.findUsers(query,req.query,req.query.Range,req.query.Time,callback,errCallback(res));
}
exports.findWhoLikedMe= function(req, res){
	convertPropsToNum(req.query);
	var query = db.getUserQuery(req.query.Age,req.query.Gender);
	var callback = function(docs){
		for(var i=0; i<docs.length; i++)
				delete docs[i].Id;		
		res.json(docs);
	};
	checkPermision(req.query.Id,req.query.FbId,res,function(){
		db.findWhoLikedMe(query,req.query.FbId,callback,errCallback(res));
	});
}
exports.findInboxUsers = function(req,res){
	var query = db.getUserQuery(req.query.Age,req.query.Gender);
	convertPropsToNum(req.query);
	var callback = function(docs){
		res.json(docs);
	};
	checkPermision(req.query.Id,req.query.FbId,res,function(){
		db.findInboxUsers(query,req.query.FbId,callback,errCallback(res));
	});
}
exports.findWhoILike = function(req, res){
	var query = db.getUserQuery(req.query.Age,req.query.Gender);
	convertPropsToNum(req.query);
	var callback = function(docs){
		for(var i=0; i<docs.length; i++)
				delete docs[i].Id;
		res.json(docs);
	};
	checkPermision(req.query.Id,req.query.FbId,res,function(){
		db.findWhoILike(query,req.query.FbId,callback,errCallback(res));
	});
}

exports.getVideoRefs = function(req,res){
	var type = req.query.Type;
	convertPropsToNum(req.query);
	db.findVidRefs(req.query.FromFbId,function(docs){;
		res.json({Type:type,Refs:docs});
	},errCallback(res));
}
exports.getInboxRefs = function(req,res){
	convertPropsToNum(req.query);
	var callback = function(docs){
		res.json(docs);
	};
	checkPermision(req.query.Id,req.query.FbId,res,function(){
		db.findInboxRefs(req.query.FbId,callback,errCallback(res));
	});
}
returnSignedPolicy = function(vidRef, res){
	var fileName = vidRef.Url;
	var expiration = new Date(new Date().getTime() + 1000 * 60 * 5).toISOString();
	 var policy =
    { "expiration": expiration,
        "conditions": [
            {"bucket": bucket},
            {"key": fileName},
            {"acl": 'public-read'},
            ["starts-with", "$Content-Type", ""],
            ["content-length-range", 0, 10000000]
        ]};
    var policyBase64 = new Buffer(JSON.stringify(policy), 'utf8').toString('base64');
    console.log("print policy");
	console.log("Policy Base64:"+ policyBase64);
 	var signature = crypto.createHmac('sha1', secret).update(policyBase64).digest('base64');
    res.json({bucket: bucket, awsKey: awsKey, policy: policyBase64, signature: signature});
 
}
exports.getPolicy = function(req,res){
	convertPropsToNum(req.body);
	returnSignedPolicy(req.body.VidRef,res);
}
convertPropsToNum = function(user){
	user.Lat = Number(user.Lat);
	user.Lgt = Number(user.Lgt);
	user.Age = Number(user.Age);
	user.TimeStamp = Number(user.TimeStamp);
	if(user.Range)
		user.Range = Number(user.Range);
	if(user.Time)
		user.Time = Number(user.Time);
	if(user.Like){
		for(var i =0;i<user.Like.length; i++){
			user.Like[i].From = Number(user.Like[i].From);
			user.Like[i].To = Number(user.Like[i].To);
		}
	}

}
checkPermision = function(userId, fbId,res, callback){
	db.getIdPair(userId,function(docs){
		if(docs.length == 0){
				var er = errCallback(res);
				er("bad permission request no documents found");
			}
		else if(docs[0].FbId === fbId  && docs[0].UserId === userId){
				callback(true);
			}
		else {
			var er = errCallback(res);
			er("bad permission request not matching documents found");
		}
	},errCallback(res));
}