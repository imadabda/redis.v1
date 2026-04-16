<?php
$_SERVER['REQUEST_METHOD'] = 'CLI';
require_once 'db.php';

if (!$is_simulation) {
    echo "This script is meant to be run in simulation mode. Connects to real MySQL DB instead. Aborting.\n";
    exit;
}

$data = get_sim_data();

$colors = $data['box_colors'] ?? [];
if (empty($colors)) {
    echo "No colors found. Please make sure colors are initialized.\n";
    exit;
}

// Ensure the last ID for users and transactions
$maxUserId = 0;
foreach ($data['users'] as $u) {
    if ($u['id'] > $maxUserId) $maxUserId = $u['id'];
}

// 1. Add Users A1 to A30 and Transactions
$types = ['OUTGOING', 'RETURN'];
$maxTxId = 0;
if (!isset($data['transactions'])) $data['transactions'] = [];
foreach ($data['transactions'] as $tx) {
    if ($tx['id'] > $maxTxId) $maxTxId = $tx['id'];
}

$startNum = 1;
$endNum = 30;

for ($i = $startNum; $i <= $endNum; $i++) {
    $shortCode = "A" . $i;
    $name = "مستخدم " . $shortCode;
    
    // Check if exists
    $exists = false;
    foreach ($data['users'] as $u) {
        if ($u['short_code'] === $shortCode) {
            $exists = true;
            break;
        }
    }

    if (!$exists) {
        $maxUserId++;
        $data['users'][] = [
            "id" => $maxUserId,
            "name" => $name,
            "short_code" => $shortCode,
            "is_active" => true,
            "created_at" => date('Y-m-d H:i:s')
        ];
    }
    
    // Add 2-6 random transactions per user
    $numTx = rand(2, 6);
    // Let's create transactions roughly starting from last few days so we have enough data
    for ($j = 0; $j < $numTx; $j++) {
        $maxTxId++;
        $color = $colors[array_rand($colors)];
        $type = $types[array_rand($types)];
        $qty = rand(1, 25);
        $randomTimeOffset = rand(0, 10 * 24 * 3600); // Between now and 10 days ago
        $txTime = date('Y-m-d H:i:s', time() - $randomTimeOffset);
        
        $data['transactions'][] = [
            "id" => $maxTxId,
            "user_code" => $shortCode,
            "user_name" => $name,
            "color_code" => $color['short_code'] ?? $color['hex'],
            "color_name" => $color['name'],
            "quantity" => $qty,
            "type" => $type,
            "created_at" => $txTime
        ];
    }
}

save_sim_data($data);

echo "Successfully added dummy users and transactions for A1 to A30 in JSON simulation.\n";
