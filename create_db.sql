
-- create database if not exists
CREATE DATABASE IF NOT EXISTS gmail_to_whatsapp;

-- use database
USE gmail_to_whatsapp;

-- create tables
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS emails (
    user_email_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    auth_uri VARCHAR(255) DEFAULT 'https://accounts.google.com/o/oauth2/auth',
    token_uri VARCHAR(255) DEFAULT 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url VARCHAR(255) DEFAULT 'https://www.googleapis.com/oauth2/v1/certs',
    client_id VARCHAR(255),
    client_secret VARCHAR(255),
    authorized BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, email),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (user_id, email),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);



-- DELETE FROM tokens;
-- show tables;
-- SELECT * FROM users;
-- SELECT * FROM emails;
-- SELECT * FROM tokens;
-- DROP TABLE tokens;
-- DROP TABLE users;


-- insert user data to users table
-- INSERT INTO users (username, email, phone_number, password) 
-- VALUES ("user1", "email1@gmail.com", "+249123123123", "1234"),
--     ("user2", "email2@gmail.com", "+249123456789", "6573"),
--     ("user3", "email3@gmail.com", "249124578963", "1234");



-- insert user email data to emails table
-- INSERT INTO emails (user_id, email, client_id, client_secret) 
-- VALUES (1, "email1@gmail.com", "client_id1", "client_secret1"),
-- (2, "email1@gmail.com", "client_id2", "client_secret2"),
-- (2, "email2@gmail.com", "client_id2", "client_secret2"),
-- (1, "email1_1@gmail.com", "client_id1_1", "client_secret1_1"),
-- (3, "email3@gmail.com", "client_id3", "client_secret3");


