CREATE DATABASE `assetmaster`;

USE assetmaster;

CREATE TABLE `Users` (
   UserID  VARCHAR(30) PRIMARY KEY NOT NULL,
   Username VARCHAR(30) NOT NULL UNIQUE,
   PasswordHash VARCHAR(255) NOT NULL,
   Email VARCHAR(255) NOT NULL UNIQUE,
   Verified CHAR(1) NOT NULL
);

CREATE TABLE `Budgets`(
   UserID  VARCHAR(30) PRIMARY KEY NOT NULL,
   IncomeCurrent DECIMAL(13, 2) NOT NULL,
   IncomeTotal DECIMAL(13, 2) NOT NULL,
   ExpensesCurrent DECIMAL(13, 2) NOT NULL,
   ExpensesTotal DECIMAL(13, 2) NOT NULL,
   Month DATE NOT NULL
);

CREATE TABLE `Categories`(
   CategoryID VARCHAR(30) PRIMARY KEY NOT NULL,
   Name varchar(30) NOT NULL,
   Type varchar(8) NOT NULL,
   Current DECIMAL(13, 2) NOT NULL,
   Total DECIMAL(13, 2) NOT NULL,
   Month DATE NOT NULL,
   UserID  VARCHAR(30) NOT NULL
);

CREATE TABLE `Accounts` (
   AccountID VARCHAR(30) PRIMARY KEY NOT NULL,
   Name VARCHAR(30) NOT NULL,
   Type VARCHAR(20) NOT NULL,
   Balance DECIMAL(13, 2) NOT NULL,
   UserID VARCHAR(30) NOT NULL
);

CREATE TABLE `Transactions` (
   TransactionID VARCHAR(30) PRIMARY KEY NOT NULL,
   Title VARCHAR(50) NOT NULL,
   Date DATE NOT NULL,
   Type varchar(8) NOT NULL,
   Amount DECIMAL(13, 2) NOT NULL,
   UserID VARCHAR(30)  NOT NULL,
   AccountID VARCHAR(30),
   CategoryID VARCHAR(30) NOT NULL
);

CREATE TABLE `Stocks`(
   DateAndHour VARCHAR(30) PRIMARY KEY,
   Stocks JSON
);

DELETE Users, Accounts, Budgets, Transactions, Categories
FROM Users
LEFT JOIN Accounts ON Accounts.UserID = 'qeaeomr1703376705615'
LEFT JOIN Budgets ON Budgets.UserID = 'qeaeomr1703376705615'
LEFT JOIN Transactions ON Transactions.UserID = 'qeaeomr1703376705615'
LEFT JOIN Categories ON Categories.UserID = 'qeaeomr1703376705615'
WHERE Users.UserID = 'qeaeomr1703376705615';