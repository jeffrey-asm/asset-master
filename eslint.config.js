module.exports = {
   "rules": {
      "indent": ["error", 3, { "SwitchCase": 1 }],
      "quotes": ["error", "double"],
      "jsx-quotes": ["error", "prefer-double"],
      "semi": ["error", "always"],
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-mixed-spaces-and-tabs": ["error"],
      "no-multiple-empty-lines": ["error", { "max": 1 }],
      "no-var": "error",
      "eol-last": ["error", "never"],
      "prefer-const": "error",
      "arrow-spacing": "error",
      "no-trailing-spaces": "error",
      "space-infix-ops": "error",
      "space-before-blocks": ["error", "always"],
      "keyword-spacing": ["error", { "after": true }],
      "comma-spacing": "error",
      "comma-dangle": ["error", "never"],
      "spaced-comment": ["error", "always"],
      "space-before-function-paren": ["error", "never"],
      "object-curly-spacing": ["error", "always"]
   }
};