//Shared method for all form controllers
exports.sendError = function(result,component,text){
   result.json({
      status:'fail',
      componentID: `${component}`,
      message: `${text}`
   });
}

exports.sendSuccess = function(result,text,returnInfo={}){
   result.json({
      status:'pass',
      message: `${text}`,
      render:returnInfo
   });
}
