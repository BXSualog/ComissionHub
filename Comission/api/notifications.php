<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

// FETCH NOTIFICATIONS
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list') {
    $sql = "SELECT * FROM notifications WHERE user_id = '$user_id' ORDER BY created_at DESC";
    $result = mysqli_query($conn, $sql);

    $list = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $list[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $list]);
}

// CLEAR NOTIFICATIONS
elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'clear') {
    $sql = "DELETE FROM notifications WHERE user_id = '$user_id'";
    if (mysqli_query($conn, $sql)) {
        echo json_encode(['success' => true, 'message' => 'Notifications cleared.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to clear notifications.']);
    }
}
?>