# Sample SQL Queries: CommissionHub

This document provides a collection of the SQL queries used within the CommissionHub platform for authentication, commission management, and administrative analytics.

---

## 1. Authentication & User Management

### 1.1 User Signup
Registers a new user into the system.
```sql
INSERT INTO users (name, email, password) VALUES ('John Doe', 'john@example.com', 'hashed_password');
```

### 1.2 User Login
Retrieves user data by email for password verification.
```sql
SELECT * FROM users WHERE email = 'john@example.com';
```

### 1.3 Update User Profile
Updates user details from the admin panel.
```sql
UPDATE users SET name = 'New Name', email = 'newemail@example.com' WHERE id = 1;
```

### 1.4 Delete User
Removes a user and all their related data (via CASCADE).
```sql
DELETE FROM users WHERE id = 1;
```

---

## 2. Commission Management

### 2.1 Create Commission Request
Submits a new project brief.
```sql
INSERT INTO comissions (order_id, client_id, service_type, payment_method, budget_tier, budget_amount, deadline, description, status) 
VALUES ('uid123', 1, 'Web Designing', 'GCash', 'Gold', 5000.00, '2023-12-31', 'Project details here...', 'pending');
```

### 2.2 List Client Commissions
Fetches all requests for a specific client.
```sql
SELECT * FROM comissions WHERE client_id = 1 ORDER BY created_at DESC;
```

### 2.3 Update Request Status
Updates a project's progress and logs revenue if completed.
```sql
-- Step 1: Update Status
UPDATE comissions SET status = 'completed' WHERE order_id = 'uid123';

-- Step 2: Log Revenue (if completed)
INSERT INTO `e-wallet` (order_id, amount) VALUES ('uid123', 5000.00);
```

---

## 3. Administrative Analytics (Advanced Queries)

### 3.1 General System Summary (Subqueries)
Fetches multiple global metrics in a single result set.
```sql
SELECT 
    (SELECT COUNT(*) FROM comissions) as total_requests,
    (SELECT IFNULL(AVG(budget_amount), 0) FROM comissions WHERE status = 'completed') as avg_order_value,
    (SELECT service_type FROM comissions GROUP BY service_type ORDER BY COUNT(*) DESC LIMIT 1) as top_service,
    (SELECT COUNT(DISTINCT client_id) FROM comissions) as active_clients;
```

### 3.2 Revenue by Service (Aggregate Functions & Share Calculation)
Calculates total earnings per category and their percentage of total revenue.
```sql
SELECT 
    service_type, 
    SUM(budget_amount) as total_revenue, 
    COUNT(*) as order_count,
    (SUM(budget_amount) / (SELECT NULLIF(SUM(budget_amount), 0) FROM comissions WHERE status = 'completed') * 100) as share_percentage
FROM comissions 
WHERE status = 'completed' 
GROUP BY service_type
ORDER BY total_revenue DESC;
```

### 3.3 User Engagement Report (JOIN, GROUP BY, HAVING)
Lists clients with pending requests to track active workload.
```sql
SELECT u.name, COUNT(c.order_id) as pending_count 
FROM users u 
LEFT JOIN comissions c ON u.id = c.client_id AND c.status = 'pending' 
GROUP BY u.id, u.name
HAVING pending_count > 0;
```

---

## 4. Notifications

### 4.1 Fetch Notifications
Retrieves all alerts for a specific user.
```sql
SELECT * FROM notifications WHERE user_id = 1 ORDER BY created_at DESC;
```

### 4.2 Clear Notifications
Deletes all alerts for a user.
```sql
DELETE FROM notifications WHERE user_id = 1;
```
