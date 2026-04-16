<?php
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($is_simulation) {
    $data = get_sim_data();
    if ($method === 'GET') {
        $active_users = array_filter($data['users'], function($u) { return $u['is_active']; });
        echo json_encode(array_values($active_users));
    } 
    elseif ($method === 'POST') {
        $new_user = json_decode(file_get_contents('php://input'), true);
        $new_user['id'] = count($data['users']) + 1;
        $new_user['is_active'] = true;
        $new_user['created_at'] = date('Y-m-d H:i:s');
        $data['users'][] = $new_user;
        save_sim_data($data);
        echo json_encode($new_user);
    }
    elseif ($method === 'PUT') {
        $id = $_GET['id'] ?? null;
        if ($id) {
            foreach ($data['users'] as &$u) {
                if ($u['id'] == $id) $u['is_active'] = false;
            }
            save_sim_data($data);
            echo json_encode(['success' => true]);
        }
    }
    exit;
}

if ($method === 'GET') {
    $stmt = $conn->prepare('SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC');
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if(!isset($data['name']) || !isset($data['short_code'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }

    try {
        $stmt = $conn->prepare('INSERT INTO users (name, short_code) VALUES (:name, :short_code)');
        $stmt->execute([
            ':name' => $data['name'],
            ':short_code' => $data['short_code']
        ]);
        
        $id = $conn->lastInsertId();
        $stmt = $conn->prepare('SELECT * FROM users WHERE id = :id');
        $stmt->execute([':id' => $id]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($method === 'PUT') {
    // Handling soft delete using ?id=1&action=disable
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;
    
    if ($id && $action === 'disable') {
        $stmt = $conn->prepare('UPDATE users SET is_active = false WHERE id = :id');
        $stmt->execute([':id' => $id]);
        echo json_encode(['message' => 'User disabled']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request']);
    }
}
?>
