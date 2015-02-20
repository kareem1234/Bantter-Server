
/* 
  Start app by using cluster module to fork off new processes
  save one core for os related functions

*/
/*
 var cluster = require('cluster');
 var numCPUs = require('os').cpus().length;
 if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
}else{
*/


/* 
 load express related modules
*/
var express = require('express')
  , routes = require('./routes')
  , awsRoutes = require('./routes/awsTranscode.js')
  , http = require('http')
  , db = require("./database/db.js")
  , path = require('path');

var app = express();
var portNum = Math.floor(Math.random()*10000);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
//app.use(express.logger('pro'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// get urls
app.get('/findWhoLikedMe',routes.findWhoLikedMe);
app.get('/findWhoILike',routes.findWhoILike);
app.get('/getVideoRefs',routes.getVideoRefs);
app.get("/getInbox",routes.getInboxRefs);
app.get("/findUsers",routes.findUsers);
app.get("/findInboxUsers",routes.findInboxUsers);
//
// post urls
app.post('/insertUser',routes.insertUser);
app.post('/insertLike',routes.insertLike);
app.post('/getPolicy',routes.getPolicy);
app.post('/insertVidRef',awsRoutes.insertVidRef);

// callback to start Server
function startServer(){
  console.log("starting server...");
  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
}

// connect to database, then init awstranscoder, then start server
db.connect(function(){
  awsRoutes.initTranscode(startServer);
});
//}




