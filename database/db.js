/**
Connection config variables and requires
*/
var mongo  = require('mongodb');
var dbConfig = require("../dbConfig.json");
var mongoUri = "mongodb://"+dbConfig.user+":"+dbConfig.pwd+"@ds053419.mongolab.com:53419/bantterdb";
var db;
/*
	user collection
*/
var people;
/*
miscallaneous collections
*/
var vidRefs, likes;
/* 
config variables
*/
var dateString ='date';
var notSeenString = 'notSeen';
var seenString = 'seen';
var maxReturn = 10;

/*
		EXPORTED FUNCTIONS
*/

// attach database collection to variables
initCollections = function (){
	people 		= db.collection("people");
	vidRefs		= db.collection('vidRefs');
	likes 		= db.collection('likes');
	idPairs		= db.collection("idPairs");

	console.log("database collections initialized");

}
// insertUser into specified collection
exports.insertUser = function (user,callback, errcallback){
	people.insert(user,function(err){
		if(err) errcallback();
		else callback();
	});
}
// updateUser with specified collection
exports.updateUser = function(user,callback,errcallback){
	var date = new Date().getTime();
	people.update({FbId:user.FbId},{$set: {TimeStamp: date}},function(err,result){
		if(err) errcallback(err);
		else callback();
	})
}
// insert a like object into like collection
exports.insertLike = function(like,callback,errcallback){
	likes.insert(like,function(err){
		if(err) errcallback(err);
		else callback();
	});
}
// insert a userId/fbId matching into idpairs collection
exports.insertIdPair = function(fbId, userId,callback,errcallback){
	idPairs.insert({FbId:fbId,UserId:userId},function(err,result){
		if(err) errcallback(err);
		else callback();
	});
}
// find a userId/fbId matching from idpairs collection
exports.getIdPair = function(userId, callback,errcallback){
	idPairs.find({UserId: userId}).toArray(function(err,docs){
		if(err)errcallback(err);
		else callback(docs);
	});
}
// find users from specified collection within a certain latitude and longitude range
// limit to 500
exports.findUsers = function(query,User,Range,Time,callback,errcallback){
	var options={ Lat: {$lte: (Number(User.Lat) + Number(Range)),$gte: (Number(User.Lat) - Number(Range))},
				  Lgt: {$lte: (Number(User.Lgt) + Number(Range)),$gte: (Number(User.Lgt) - Number(Range))},
				  TimeStamp: {$gte: Number(Time) }
				};
	for(var attr in query){ options[attr] = query[attr];}
	people.find(options).limit(50).toArray(function(err,docs){
		if(err){console.log(err); errcallback(err);}
		else{
			docs.sort(function(a,b){
				var num1 = Math.abs(a.Lat-Number(User.Lat)) + Math.abs(a.Lgt-Number(User.Lgt));
				var num2 = Math.abs(b.Lat-Number(User.Lat)) + Math.abs(b.Lgt-Number(User.Lgt));
				return a-b;
			});
			callback(docs);
		}
	});
}
//  insert a videoRefence into collection
exports.insertVidRef = function(vRef,callback,errcallback){
	vidRefs.insert(vRef,function(err){
		if(err)errcallback(err);
		else callback();
	});
}
// find videoReferences//selfies belonging to specified facebook id
exports.findVidRefs = function(fbId,callback,errcallback){
	vidRefs.find({FbId: fbId, To:"ALL"}).toArray(function(err,refs){
		if(err) errcallback(err);
		else{ 
			callback(refs);
		}
	});
}
// find all videoReferences sent to a specific FbId
exports.findInboxRefs = function(FbId,callback,errcallback){
	vidRefs.find({To: FbId}).toArray(function(err,docs){
		if(err) errcallback(err);
		else{console.dir(docs); callback(docs);}
	});
}
// return users who were liked by the specified fbid
exports.findWhoILike = function(query,FbId,callback,errcallback){
	likes.find({From: FbId}).toArray(function(err,likesArray){
		if(err){
			errcallback(err);
			return;
		}
		var tempArr = new Array();
		for(var i =0; i< likesArray.length; i++)
			tempArr.push(likesArray[i].To);
		var returnFunc = function(err, users){
			if(err)
				errcallback(err);
			else
				callback(users);
		};
		query.FbId= { $in : tempArr} ;
		people.find(query).toArray(returnFunc);
	});
}
// return the users who sent messages to the specified fbid
exports.findInboxUsers = function(query,FbId,callback,errcallback){
	console.log(typeof(FbId));
	vidRefs.find({To: FbId}).toArray(function(err,refArray){
		console.log("printing ref array");
		console.dir(refArray);
		for(var i = 0; i< refArray.length; i++)
			refArray[i] = refArray[i].FbId;
		var returnFunc = function(err,users){
		if(err)
			errcallback(err);
		else{
			console.log("printing inbox users");
			console.dir(users);
			callback(users);
		}
		};
		query.FbId= { $in : refArray};
		people.find(query).toArray(returnFunc);
		
	});
}
// return users who liked the specified fbid
exports.findWhoLikedMe = function(query,FbId,callback,errcallback){
	likes.find({To: FbId}).toArray(function(err,likesArray){
		if(err){
			errcallback(err);
			return;
		}
		var tempArr = new Array();
		for(var i =0; i< likesArray.length; i++)
			tempArr.push(likesArray[i].From);
		var returnFunc = function(err, users){
			if(err)
				errcallback(err);
			else
				callback(users);
		};
		query.FbId = { $in : tempArr};
		people.find(query).toArray(returnFunc);

	});
}
// function for initializing database connection
exports.connect = function (callback){
	if(db){
		console.log("database alrdy init");
		process.nextTick(callback);
	}
	else{
		mongo.Db.connect(mongoUri,function(err, myDb){
			if(err)
				console.log(err);
			else{
				db = myDb;
				console.log("connected to the database");
				initCollections();
				callback();
			}
		});
	}
}


//  min age = current age divided by 2 + 7
//  max age = current age - 7 multiplied by 2

// return an object  for use   in db.find() that decides what age range of users to return
// as well as gender
exports.getUserQuery = function(Age,Gndr){
	if(Gndr === 'Male')
		Gndr = 'Female';
	else 
		Gndr = 'Male';
	var minAge = Math.floor(Age / 2) + 7;
	var maxAge = Math.floor((Age - 7)*2);
	var query ={ Age: { $gte: minAge, $lte: maxAge } ,Gender:Gndr };
	return query;
}

