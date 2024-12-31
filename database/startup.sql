CREATE TABLE `users` (
   user_id INT AUTO_INCREMENT PRIMARY KEY,
   username VARCHAR(30) NOT NULL UNIQUE,
   password VARCHAR(255) NOT NULL,
   email VARCHAR(255) NOT NULL UNIQUE,
   verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE `budgets` (
   budget_id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL,
   income_current DECIMAL(13, 2) NOT NULL,
   income_total DECIMAL(13, 2) NOT NULL,
   expenses_current DECIMAL(13, 2) NOT NULL,
   expenses_total DECIMAL(13, 2) NOT NULL,
   month DATE NOT NULL,
   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE `categories` (
   category_id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(30) NOT NULL,
   type ENUM('Income', 'Expenses') NOT NULL,
   current DECIMAL(13, 2) NOT NULL,
   total DECIMAL(13, 2) NOT NULL,
   month DATE NOT NULL,
   user_id INT NOT NULL,
   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE `accounts` (
   account_id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(30) NOT NULL,
   type VARCHAR(20) NOT NULL,
   balance DECIMAL(13, 2) NOT NULL,
   user_id INT NOT NULL,
   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE `transactions` (
   transaction_id INT AUTO_INCREMENT PRIMARY KEY,
   title VARCHAR(50) NOT NULL,
   date DATE NOT NULL,
   type ENUM('Income', 'Expenses') NOT NULL,
   amount DECIMAL(13, 2) NOT NULL,
   user_id INT NOT NULL,
   account_id INT,
   category_id INT NOT NULL,
   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
   FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
   FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

CREATE TABLE `stocks` (
   time DATETIME PRIMARY KEY,
   stocks JSON NOT NULL
);
