-- Initialize databases for Acadex Mini Microservices
-- This script runs when the MySQL container starts

-- Create databases for each microservice
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS class_db;
CREATE DATABASE IF NOT EXISTS assignment_db;
CREATE DATABASE IF NOT EXISTS grading_db;
CREATE DATABASE IF NOT EXISTS file_db;
CREATE DATABASE IF NOT EXISTS subscription_db;
CREATE DATABASE IF NOT EXISTS notification_db;
CREATE DATABASE IF NOT EXISTS analytics_db;

-- Create user with permissions
CREATE USER IF NOT EXISTS 'acadex'@'%' IDENTIFIED BY 'acadex123';
GRANT ALL PRIVILEGES ON auth_db.* TO 'acadex'@'%';
GRANT ALL PRIVILEGES ON class_db.* TO 'acadex'@'%';
GRANT ALL PRIVILEGES ON assignment_db.* TO 'acadex'@'%';
GRANT ALL PRIVILEGES ON grading_db.* TO 'acadex'@'%';
GRANT ALL PRIVILEGES ON file_db.* TO 'acadex'@'%';
GRANT ALL PRIVILEGES ON subscription_db.* TO 'acadex'@'%';
GRANT ALL PRIVILEGES ON notification_db.* TO 'acadex'@'%';
GRANT ALL PRIVILEGES ON analytics_db.* TO 'acadex'@'%';
FLUSH PRIVILEGES;

-- Show created databases
SHOW DATABASES; 