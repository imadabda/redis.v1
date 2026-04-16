<?php
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($is_simulation) {
    $data = get_sim_data();
    if ($method === 'GET') {
        $active_colors = array_filter($data['box_colors'], function($c) { return $c['is_active']; });
        echo json_encode(array_values($active_colors));
    } 
    elseif ($method === 'POST') {
        $new_color = json_decode(file_get_contents('php://input'), true);
        $new_color['id'] = count($data['box_colors']) + 1;
        $new_color['is_active'] = true;
        $new_color['created_at'] = date('Y-m-d H:i:s');
        $data['box_colors'][] = $new_color;
        save_sim_data($data);
        echo json_encode($new_color);
    }
    elseif ($method === 'PUT') {
        $id = $_GET['id'] ?? null;
        if ($id) {
            foreach ($data['box_colors'] as &$c) {
                if ($c['id'] == $id) $c['is_active'] = false;
            }
            save_sim_data($data);
            echo json_encode(['success' => true]);
        }
    }
    exit;
}

if ($method === 'GET') {
    $stmt = $conn->prepare('SELECT * FROM box_colors WHERE is_active = true ORDER BY created_at ASC');
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if(!isset($data['name']) || !isset($data['hex']) || !isset($data['short_code'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }

    try {
        $stmt = $conn->prepare('INSERT INTO box_colors (name, hex, short_code) VALUES (:name, :hex, :short_code)');
        $stmt->execute([
            ':name' => $data['name'],
            ':hex' => $data['hex'],
            ':short_code' => $data['short_code']
        ]);
        
        $id = $conn->lastInsertId();
        $stmt = $conn->prepare('SELECT * FROM box_colors WHERE id = :id');
        $stmt->execute([':id' => $id]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($method === 'PUT') {
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;
    
    if ($id && $action === 'disable') {
        $stmt = $conn->prepare('UPDATE box_colors SET is_active = false WHERE id = :id');
        $stmt->execute([':id' => $id]);
        echo json_encode(['message' => 'Color disabled']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request']);
    }
}
?>
