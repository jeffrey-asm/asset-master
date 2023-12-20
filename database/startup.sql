CREATE DATABASE `assetmaster`;

USE assetmaster;

-- FOREIGN KEY FOR USER ID FOR EACH TABLE
CREATE TABLE Users (
   UserID  VARCHAR(30) PRIMARY KEY NOT NULL,
   Username VARCHAR(30) NOT NULL UNIQUE,
   PasswordHash VARCHAR(255) NOT NULL,
   Email VARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO Users (UserID,Username,Password_Hash, Email)
VALUES (
   'sas904aj3139',
  'jeffreyC4',
  'passwordHASH',
  'random@gmail.com'
);

SELECT * FROM Users;

CREATE TABLE Accounts (
   Account_ID VARCHAR(30) PRIMARY KEY NOT NULL,
   Name VARCHAR(20) NOT NULL,
   Type VARCHAR(20) NOT NULL,
   Balance DECIMAL(13, 2) NOT NULL,
   UserID VARCHAR(30) NOT NULL,
   FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

INSERT INTO Accounts (Account_ID,Name,Type,Balance,UserID)
VALUES (
   'dsad2374184',
   'Chase Savings',
   'Savings Account',
   250.50,
   'sas904aj3139'
);

SELECT * FROM Accounts;

-- Select Basic Account Information via foreign key of User ID
SELECT Users.UserID, Users.Username, Accounts.Name,Accounts.Type, Accounts.Balance FROM Accounts JOIN Users ON Accounts.UserID = Users.UserID WHERE Users.UserID = 'sas904aj3139';


-- TODO account for budget and transactions AND NEW VARIALBE NAMES
-- JSON FOR USER HISTORY
CREATE TABLE Transactions (
   Transaction_ID INT PRIMARY KEY NOT NULL UNIQUE,
   Description VARCHAR(50) NOT NULL,
   Category VARCHAR(50) NOT NULL,
   Date DATE NOT NULL,
   Amount DECIMAL(13, 2) NOT NULL,
   User_ID INT NOT NULL,
   Account_ID INT NOT NULL,
   FOREIGN KEY (User_ID) REFERENCES Users(User_ID),
   FOREIGN KEY (Account_ID) REFERENCES Accounts(Account_ID)
);

INSERT INTO Transactions (Transaction_ID,Account_ID,Description,Category,Date,Amount,User_ID)
VALUES (
   12344043,
   'Treats',
   'Food',
   250.50,
   904123139,
   2374184
);