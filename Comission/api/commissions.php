<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// CREATE COMMISSION REQUEST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $order_id = $data['id'];
    $client_id = $_SESSION['user_id'];
    $service_type = $data['service'];
    $payment_method = $data['payment'];
    $budget_tier = $data['budget'];
    $budget_amount = $data['amount'];
    $deadline = $data['deadline'];
    $description = $data['details'];

    if (!$client_id) {
        echo json_encode(['success' => false, 'message' => 'Please login to submit a request.']);
        exit;
    }

    $sql = "INSERT INTO comissions (order_id, client_id, service_type, payment_method, budget_tier, budget_amount, deadline, description, status) 
            VALUES ('$order_id', '$client_id', '$service_type', '$payment_method', '$budget_tier', '$budget_amount', '$deadline', '$description', 'pending')";

    if (mysqli_query($conn, $sql)) {
        echo json_encode(['success' => true, 'message' => 'Commission request submitted!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save request.']);
    }
}

// LIST USER'S COMMISSIONS
elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list') {
    $client_id = $_SESSION['user_id'];

    if (!$client_id) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
        exit;
    }

    $sql = "SELECT * FROM comissions WHERE client_id = '$client_id' ORDER BY created_at DESC";
    $result = mysqli_query($conn, $sql);

    $commissions = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $commissions[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $commissions]);
}
?>