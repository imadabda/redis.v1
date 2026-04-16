<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Hostinger DB config
$host = 'localhost';
$db_name = 'u515868829_irdeas';
$username = 'u515868829_ardis_admin';
$password = 'ArdisPremium2026!';

$is_simulation = false;

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // If connection fails, switch to simulation mode using JSON file
    $is_simulation = true;
    $data_file = __DIR__ . '/simulation_data.json';
    if (!file_exists($data_file)) {
        file_put_contents($data_file, json_encode([
            "users" => [
                ["id" => 1, "name" => "عماد عبدة", "short_code" => "AF", "is_active" => true, "created_at" => date('Y-m-d H:i:s')],
                ["id" => 2, "name" => "أحمد زكي", "short_code" => "AZ", "is_active" => true, "created_at" => date('Y-m-d H:i:s')]
            ],
            "box_colors" => [
                ["id" => 1, "name" => "أحمر - مخالة كبيرة", "hex" => "#ef4444", "short_code" => "R1", "is_active" => true, "created_at" => date('Y-m-d H:i:s')],
                ["id" => 2, "name" => "أصفر - مخالة متوسطة", "hex" => "#eab308", "short_code" => "Y1", "is_active" => true, "created_at" => date('Y-m-d H:i:s')],
                ["id" => 3, "name" => "أزرق - مخالة صغيرة", "hex" => "#3b82f6", "short_code" => "B1", "is_active" => true, "created_at" => date('Y-m-d H:i:s')]
            ],
            "transactions" => []
        ]));
    }
}

// Global functions for simulation
function get_sim_data() {
    global $data_file;
    return json_decode(file_get_contents($data_file), true);
}

function save_sim_data($data) {
    global $data_file;
    file_put_contents($data_file, json_encode($data));
}
?>
