<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// --- POST ACTIONS ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // UPDATE STATUS ACTION
    if ($action === 'update_status') {
        $id = $data['id'];
        $newStatus = $data['status'];
        $amount = $data['amount'];

        $update_sql = "UPDATE comissions SET status = '$newStatus' WHERE order_id = '$id'";
        mysqli_query($conn, $update_sql);

        if ($newStatus === 'completed') {
            $wallet_sql = "INSERT INTO `e-wallet` (order_id, amount) VALUES ('$id', '$amount')";
            mysqli_query($conn, $wallet_sql);

            $get_comm_sql = "SELECT client_id, service_type FROM comissions WHERE order_id = '$id'";
            $comm_res = mysqli_query($conn, $get_comm_sql);
            $comm = mysqli_fetch_assoc($comm_res);

            if ($comm) {
                $client_id = $comm['client_id'];
                $msg = "Your commission request for '" . $comm['service_type'] . "' has been completed! ✅";
                $notif_sql = "INSERT INTO notifications (user_id, message) VALUES ('$client_id', '$msg')";
                mysqli_query($conn, $notif_sql);
            }
        }
        echo json_encode(['success' => true, 'message' => "Order marked as $newStatus."]);
    } 
    elseif ($action === 'delete') {
        $id = isset($_GET['id']) ? $_GET['id'] : '';
        $sql = "DELETE FROM comissions WHERE order_id = '$id'";
        if (mysqli_query($conn, $sql)) {
            echo json_encode(['success' => true, 'message' => 'Request deleted.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Delete failed.']);
        }
    } 
    elseif ($action === 'clear_all') {
        $sql = "DELETE FROM comissions";
        if (mysqli_query($conn, $sql)) {
            echo json_encode(['success' => true, 'message' => 'All requests cleared.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Clear failed.']);
        }
    }
    // DELETE USER
    elseif ($action === 'delete_user') {
        $id = isset($_GET['id']) ? $_GET['id'] : '';
        $sql = "DELETE FROM users WHERE id = '$id'";
        if (mysqli_query($conn, $sql)) {
            echo json_encode(['success' => true, 'message' => 'User deleted successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete user.']);
        }
    }
    // UPDATE USER
    elseif ($action === 'update_user') {
        $id = isset($data['id']) ? $data['id'] : '';
        $name = isset($data['name']) ? mysqli_real_escape_string($conn, $data['name']) : '';
        $email = isset($data['email']) ? mysqli_real_escape_string($conn, $data['email']) : '';

        if (!$id || !$name || !$email) {
            echo json_encode(['success' => false, 'message' => 'Missing data.']);
            exit;
        }

        $sql = "UPDATE users SET name = '$name', email = '$email' WHERE id = '$id'";
        if (mysqli_query($conn, $sql)) {
            echo json_encode(['success' => true, 'message' => 'User updated successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Update failed.']);
        }
    }
} 
// --- GET ACTIONS ---
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'all_requests') {
        $sql = "SELECT c.*, 
                IFNULL(u.name, 'Unknown User') as client_name, 
                IFNULL(u.email, 'N/A') as client_email
                FROM comissions c 
                LEFT JOIN users u ON c.client_id = u.id 
                ORDER BY c.created_at DESC";
        $result = mysqli_query($conn, $sql);
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
    } 
    elseif ($action === 'wallet_history') {
        $sql = "SELECT h.*, c.service_type as service, 
                IFNULL(u.name, 'Unknown User') as client_name, 
                IFNULL(u.email, 'N/A') as client_email 
                FROM `e-wallet` h 
                JOIN comissions c ON h.order_id = c.order_id 
                LEFT JOIN users u ON c.client_id = u.id 
                ORDER BY h.processed_at DESC";
        $result = mysqli_query($conn, $sql);
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
    } 
    elseif ($action === 'get_users') {
        $sql = "SELECT id, name, email, created_at FROM users ORDER BY id DESC";
        $result = mysqli_query($conn, $sql);
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $data]);
    }
}
?>