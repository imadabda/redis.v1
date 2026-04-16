<?php
$_SERVER['REQUEST_METHOD'] = 'CLI';
require_once 'db.php';

$data = get_sim_data();

$names = [
    "محمد ناصر", "خالد عبدالله", "أحمد سالم", "محمود إبراهيم", "طارق فتحي", 
    "عبدالرحمن حسن", "مصطفى يوسف", "ياسر كمال", "سامر سعيد", "علي رضا",
    "عمر فاروق", "رامي عبدالمجيد", "وليد صلاح", "حسام جمال", "حاتم رياض",
    "تامر عبداللطيف", "وائل عادل", "كريم شوقي", "بهاء حسين", "منير محمود",
    "أمجد فؤاد", "علاء سعد", "راشد نعيم", "فهد سليمان", "أسامة عبدالجواد",
    "هاني توفيق", "شادي سمير", "فارس عبدالعزيز", "عدنان هاشم", "باسم صبري"
];

$count = 0;
foreach ($data['users'] as &$u) {
    if (preg_match('/^A\d+$/', $u['short_code'])) {
        $index = intval(substr($u['short_code'], 1)) - 1;
        if (isset($names[$index])) {
            $u['name'] = $names[$index];
            
            // Also update transactions for this user
            if (isset($data['transactions'])) {
                foreach ($data['transactions'] as &$tx) {
                    if ($tx['user_code'] === $u['short_code']) {
                        $tx['user_name'] = $names[$index];
                    }
                }
            }
            $count++;
        }
    }
}

save_sim_data($data);
echo "Updated $count users and their transactions to real names.\n";
