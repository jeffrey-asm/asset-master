const mysql = require("mysql2");

const tables = [
  `CREATE TABLE Users (
      UserID  VARCHAR(30) PRIMARY KEY NOT NULL,
      Username VARCHAR(30) NOT NULL UNIQUE,
      PasswordHash VARCHAR(255) NOT NULL,
      Email VARCHAR(255) NOT NULL UNIQUE,
      Verified CHAR(1) NOT NULL
   );`,
  `CREATE TABLE Budgets (
      UserID  VARCHAR(30) PRIMARY KEY NOT NULL,
      IncomeCurrent DECIMAL(13, 2) NOT NULL,
      IncomeTotal DECIMAL(13, 2) NOT NULL,
      ExpensesCurrent DECIMAL(13, 2) NOT NULL,
      ExpensesTotal DECIMAL(13, 2) NOT NULL,
      Month DATE NOT NULL
   );`,
  `CREATE TABLE Categories (
      CategoryID VARCHAR(30) PRIMARY KEY NOT NULL,
      Name varchar(30) NOT NULL,
      Type varchar(8) NOT NULL,
      Current DECIMAL(13, 2) NOT NULL,
      Total DECIMAL(13, 2) NOT NULL,
      Month DATE NOT NULL,
      UserID  VARCHAR(30) NOT NULL
   );`,
  `CREATE TABLE Accounts (
      AccountID VARCHAR(30) PRIMARY KEY NOT NULL,
      Name VARCHAR(30) NOT NULL,
      Type VARCHAR(20) NOT NULL,
      Balance DECIMAL(13, 2) NOT NULL,
      UserID VARCHAR(30) NOT NULL
   );`,
  `CREATE TABLE Transactions (
      TransactionID VARCHAR(30) PRIMARY KEY NOT NULL,
      Title VARCHAR(50) NOT NULL,
      Date DATE NOT NULL,
      Type varchar(8) NOT NULL,
      Amount DECIMAL(13, 2) NOT NULL,
      UserID VARCHAR(30)  NOT NULL,
      AccountID VARCHAR(30),
      CategoryID VARCHAR(30) NOT NULL
   );`,
  `CREATE TABLE Stocks (
      DateAndHour VARCHAR(30) PRIMARY KEY,
      Stocks JSON
   );`,
];

function createDatabaseIfNotExists() {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSWORD,
    });

    connection.query(
      `CREATE DATABASE IF NOT EXISTS assetmaster`,
      (error, results) => {
        if (error) {
          console.error("Error creating database:", error);
          reject(error);
        } else {
          resolve();
        }
        connection.end();
      }
    );
  });
}

async function seedDatabase() {
  const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: "assetmaster",
  });

  for (const tableQuery of tables) {
    await new Promise((resolve, reject) => {
      connection.query(tableQuery, (error, results) => {
        if (error) {
          console.error("Error creating table:", error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  connection.end();
}

async function seed() {
  try {
    await createDatabaseIfNotExists();
    await seedDatabase();
    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Seed failed:", error);
  }
}

seed();
