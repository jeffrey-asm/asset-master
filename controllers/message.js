//Shared method for all form controllers
exports.sendError = function(result,component,text){
   if(result.statusCode == 500){
      result.json({
         error:true
      });
   } else{
      result.json({
         status:'fail',
         componentID: `${component}`,
         message: `${text}`
      });
   }
}

exports.sendSuccess = function(result,text,returnInfo={}){
   result.json({
      status:'pass',
      message: `${text}`,
      render:returnInfo
   });
}
