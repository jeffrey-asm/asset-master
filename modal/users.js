const query = require("@/database/query.js");

module.exports = {
   // Fetch user
   getUserById: async(id) => {
      return await query.runQuery("SELECT * FROM users WHERE id = ?", [id]);
   },

   // Create user
   createUser: async(fields) => {
      const { name, email, password } = fields;
      return await query.runQuery(
         "INSERT INTO users (username, password, email, verified) VALUES (?, ?, ?, ?)",
         [name, email, password, false]
      );
   },

   // Delete user
   deleteUser: async(id) => {
      return await query.runQuery("DELETE FROM users WHERE id = ?", [id]);
   }
};