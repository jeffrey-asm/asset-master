CREATE DATABASE `assetmaster`;

USE assetmaster;

CREATE TABLE Users (
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


-- Handle budget category remove in the future
CREATE TABLE Transactions (
   Transaction_ID INT PRIMARY KEY NOT NULL UNIQUE,
   Title VARCHAR(50) NOT NULL,
   CategoryID VARCHAR(30) NOT NULL,
   Date DATE NOT NULL,
   Amount DECIMAL(13, 2) NOT NULL,
   User_ID INT NOT NULL,
   Account_ID INT NOT NULL,
);


CREATE TABLE Accounts (
   AccountID VARCHAR(30) PRIMARY KEY NOT NULL,
   Name VARCHAR(20) NOT NULL,
   Type VARCHAR(20) NOT NULL,
   Balance DECIMAL(13, 2) NOT NULL,
   UserID VARCHAR(30) NOT NULL
);

INSERT INTO Accounts (AccountID,Name,Type,Balance,UserID)
VALUES (
   'dsad2374184',
   'Chase Savings',
   'Savings Account',
   250.50,
   'sas904aj3139'
);

SELECT * FROM Accounts;



INSERT INTO Transactions (Transaction_ID,Account_ID,Description,Category,Date,Amount,User_ID)
VALUES (
   12344043,
   'Treats',
   'Food',
   250.50,
   904123139,
   2374184
);