// Shared response functions for sending error and success messages
exports.sendError = function(result, code, component, text) {
   result.status(code).json({
      status:"Failure",
      error:code === 500,
      componentID: component,
      message:text
   });
};

exports.sendSuccess = function(result, text, returnInfo = {}) {
   result.status(200).json({
      status:"Success",
      message:text,
      render:returnInfo
   });
};