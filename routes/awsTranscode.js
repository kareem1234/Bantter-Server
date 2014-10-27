// on get list of all pipes
// on request create a job using randomly selected pipe / or alternate pipes
// get event hanlder for on job complete and insertVidref when job is complete
var AWS = require("aws-sdk");
var db = require("../database/db.js");
AWS.config.loadFromPath("./config.json");
var elastictranscoder = new AWS.ElasticTranscoder();
var pipes = new Array();
var preset;

function errCallback(res){
  console.log("error found");
  var func = function(err){
    if(err)
      console.log(err);
    if(res && !res.headersSent)
      res.send(404);
  };
  return func;
}

function getPipes(callback){
	var params = {
 		Ascending: 'true',
	};
	elastictranscoder.listPipelines(params, function(err, data) {
 		 if (err) console.log(err); // an error occurred
  		 else{
  		 		for(var i =0;i<data.Pipelines.length; i++){
            console.log("transcoder pipe found");
  		 			pipes.push(data.Pipelines[i].Id);
  		 		}
  		 		callback();
  		 }       
	});
}
function getPresets(callback){
  var params = {
    Ascending: 'true',
  };
  elastictranscoder.listPresets(params, function(err,data){
      if(err)
          console.log(err);
      else{
          for(var i = 0; i<data.Presets.length;i++){
              if(data.Presets[i].Type ==="Custom"){
                  preset = data.Presets[i].Id;
                  console.log("transcoder preset loaded");
                  callback();
                }
          }
      }
  });
}


function transcode(fileName,callback,errCallback){
var newfileName = fileName.replace(".3gp",".mp4");
newfileName = newfileName.replace(".mov",".mp4");
var pipeId = pipes[0];
console.log(pipeId);
console.log("setting up transcode params");
var params = {
  Input: { // required
      AspectRatio: 'auto',
      Container: 'auto',
      FrameRate: 'auto',
      Interlaced: 'auto',
      Key: fileName,
      Resolution: 'auto'
    },
  PipelineId:pipeId,
  Output:{
        Key: newfileName,
        PresetId: preset
    }
  };
  console.dir(params);
  elastictranscoder.createJob(params,function(err,data){
      if(err) errCallback(err);
      else
          callback();
      
  });
}
exports.initTranscode = function(callback){
  var count = 0;
  var func  = function(){
    count++;
    if(count == 2)
        callback();
  }
  getPresets(func);
  getPipes(func); 
}
exports.insertVidRef = function(req,res){
  console.log("printing insertVidRef body");
  console.dir(req.body);
  var ref = req.body.VidRef;
  var user = req.body;
  delete user.VidRef;

  var suc = function(){
      res.end();
  };
  var callback = function(){
     db.insertVidRef(ref,function(){
        db.updateUser(user,suc,errCallback(res));
     },errCallback(res));
  };
  transcode(ref.Url,callback,errCallback(res));
}

