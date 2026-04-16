-- أداة إنشاء الجداول لقاعدة بيانات MySQL على Hostinger

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS box_colors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hex VARCHAR(20) NOT NULL,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_code VARCHAR(10) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    color_code VARCHAR(10) NOT NULL,
    color_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    type ENUM('OUTGOING', 'RETURN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إدخال بيانات مبدئية للألوان
INSERT IGNORE INTO box_colors (name, hex, short_code) VALUES
('أحمر - مخالة كبيرة', '#ef4444', 'R1'),
('أصفر - مخالة متوسطة', '#eab308', 'Y1'),
('أزرق - مخالة صغيرة', '#3b82f6', 'B1');
