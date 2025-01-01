exports.sendError = function(result, code, id,  message) {
   result.status(code).json({
      status: "Error",
      id: id,
      message: message
   });
};

exports.sendSuccess = function(result, text, data = {}) {
   result.status(200).json({
      status:"Success",
      message: text,
      data: data
   });
};