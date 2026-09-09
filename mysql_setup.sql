-- MySQL setup for Eksplorasi Dinamika
-- Import this file into your MySQL database via phpMyAdmin, MySQL Workbench, or mysql CLI.

CREATE TABLE IF NOT EXISTS teacher_accounts (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(80) NOT NULL,
  password_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_teacher_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evaluation_results (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  student_class VARCHAR(10) NOT NULL,
  score INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default teacher account:
-- username = tuisdap
-- password = Bismillah08*
INSERT INTO teacher_accounts (username, password_hash)
SELECT 'tuisdap', SHA2('Bismillah08*', 256)
WHERE NOT EXISTS (
  SELECT 1 FROM teacher_accounts WHERE username = 'tuisdap'
);

