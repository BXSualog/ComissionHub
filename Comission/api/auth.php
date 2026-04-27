<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Handle POST requests (Signup and Login)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read the incoming JSON data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // SIGNUP ACTION
    if ($action === 'signup') {
        $name = $data['name'];
        $email = $data['email'];
        $password = $data['password'];

        if (empty($name) || empty($email) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required.']);
            exit;
        }

        $check_sql = "SELECT id FROM users WHERE email = '$email'";
        $check_result = mysqli_query($conn, $check_sql);

        if (mysqli_num_rows($check_result) > 0) {
            echo json_encode(['success' => false, 'message' => 'Email already registered.']);
            exit;
        }

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $insert_sql = "INSERT INTO users (name, email, password) VALUES ('$name', '$email', '$hashed_password')";

        if (mysqli_query($conn, $insert_sql)) {
            $user_id = mysqli_insert_id($conn);
            $_SESSION['user_id'] = $user_id;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;

            echo json_encode(['success' => true, 'message' => 'Account created!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Registration failed.']);
        }
    }

    // LOGIN ACTION
    elseif ($action === 'login') {
        $email = $data['email'];
        $password = $data['password'];

        if (empty($email) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Email and password required.']);
            exit;
        }

        $sql = "SELECT * FROM users WHERE email = '$email'";
        $result = mysqli_query($conn, $sql);
        $user = mysqli_fetch_assoc($result);

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];

            echo json_encode(['success' => true, 'message' => 'Login successful!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        }
    }
}

// LOGOUT ACTION
elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out.']);
}

// CHECK SESSION ACTION
elseif ($action === 'session') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => true,
            'user' => [
                'name' => $_SESSION['user_name'],
                'email' => $_SESSION['user_email']
            ]
        ]);
    } else {
        echo json_encode(['success' => false]);
    }
}
?>