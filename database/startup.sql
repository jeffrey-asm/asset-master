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

UPDATE Budgets B
JOIN Categories C ON B.UserID = C.UserID
SET B.IncomeCurrent = 0.00,
    B.ExpensesCurrent = 0.00,
    B.Month = '2023-12-01',
    C.Current = 0.00,
    C.Month = '2023-12-01'
WHERE B.UserID = ?;

update Categories set Current = '1100.00' WHERE CategoryID = 'ljgbgnw1703722449891';

update Budgets set IncomeCurrent = '120.00' WHERE UserID = 'qeaeomr1703376705615';

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


-- Handle budget category remove in the future

UPDATE Budgets B
JOIN Categories C ON B.UserID = C.UserID
SET B.IncomeCurrent = '0.00',
    B.ExpensesCurrent = '0.00',
    C.Current = '0.00'
WHERE B.UserID = 'qeaeomr1703376705615';

UPDATE Categories Set Current = '123.00' WHERE CategoryID= 'p381de4d5385b9a1e986b3547c208d';

UPDATE Transactions Set Amount = '2009.00' WHERE TransactionID= 'Oba730b1b94b855144cadc24600146';

-- EDIT ACCOUNT
UPDATE Transactions T
JOIN Budgets B ON T.UserID = B.UserID
Join Categories C on T.UserID = C.UserID
SET
   B.IncomeCurrent = ?,
   B.ExpensesCurrent = ?,
   T.Title = ?,
   T.CategoryID = ?,
   T.AccountID = ?,
   T.Type = ?,
   T.Date = ?,
   T.Amount = ?
WHERE T.UserID = ?;

CREATE TABLE `Stocks`(
   Hour INT PRIMARY KEY,
   Stocks JSON
);