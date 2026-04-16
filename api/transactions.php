<?php
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($is_simulation) {
    $data = get_sim_data();
    if ($method === 'GET') {
        echo json_encode($data['transactions']);
    } 
    elseif ($method === 'POST') {
        $new_tx = json_decode(file_get_contents('php://input'), true);
        $new_tx['id'] = count($data['transactions']) + 1;
        $new_tx['created_at'] = isset($new_tx['created_at']) && !empty($new_tx['created_at']) ? date('Y-m-d H:i:s', strtotime($new_tx['created_at'])) : date('Y-m-d H:i:s');
        $data['transactions'][] = $new_tx;
        save_sim_data($data);
        echo json_encode($new_tx);
    }
    exit;
}

if ($method === 'GET') {
    $stmt = $conn->prepare('SELECT * FROM transactions ORDER BY created_at DESC');
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if(!isset($data['user_code']) || !isset($data['color_code']) || !isset($data['quantity']) || !isset($data['type'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }

    try {
        $created_at = isset($data['created_at']) && !empty($data['created_at']) ? date('Y-m-d H:i:s', strtotime($data['created_at'])) : date('Y-m-d H:i:s');
        $stmt = $conn->prepare('
            INSERT INTO transactions (user_code, user_name, color_code, color_name, quantity, type, created_at) 
            VALUES (:user_code, :user_name, :color_code, :color_name, :quantity, :type, :created_at)
        ');
        $stmt->execute([
            ':user_code' => $data['user_code'],
            ':user_name' => $data['user_name'] ?? '',
            ':color_code' => $data['color_code'],
            ':color_name' => $data['color_name'] ?? '',
            ':quantity' => $data['quantity'],
            ':type' => $data['type'],
            ':created_at' => $created_at
        ]);
        
        $id = $conn->lastInsertId();
        $stmt = $conn->prepare('SELECT * FROM transactions WHERE id = :id');
        $stmt->execute([':id' => $id]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
