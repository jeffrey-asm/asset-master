// Shared method for all form controllers
exports.sendError = function(result, code, component, text) {
   result.status(code).json({
      status:"fail",
      error:code === 500,
      componentID:component,
      message:text
   });
};

exports.sendSuccess = function(result, text, returnInfo = {}) {
   result.status(200).json({
      status:"pass",
      message:text,
      render:returnInfo
   });
};