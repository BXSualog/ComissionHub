# Database Analysis & Setup Guide for phpMyAdmin

This document provides all the necessary entities, attributes, and data types to manually create your database in **phpMyAdmin**.

---

## 1. Entity & Attribute Reference

Use the tables below as your guide when creating new tables in your MySQL database.

### 1.1 Users (Account Management)

**Purpose:** Stores login credentials and defines user access levels.

| Column Name | Data Type      | Key / Extra                  | Description                  |
| ----------- | -------------- | ---------------------------- | ---------------------------- |
| `id`        | `INT`          | Primary Key, A.I.            | Unique ID for every user.    |
| `name`      | `VARCHAR(100)` |                              | User's name for display.     |
| `email`     | `VARCHAR(100)` | Unique                       | Login email.                 |
| `password`  | `VARCHAR(255)` |                              | Store passwords here.        |
| `created_at`| `TIMESTAMP`    | Default: `CURRENT_TIMESTAMP` | Internal tracking.           |

### 1.2 Commissions (Project Requests)

**Purpose:** Captures all details from the project request form.

| Column Name | Data Type       | Key / Extra                    | Description                      |
| ----------- | --------------- | ------------------------------ | -------------------------------- |
| `id`         | `VARCHAR(50)`   | Primary Key                    | Use the alphanumeric ID from JS. |
| `client_id`  | `INT`           | Foreign Key                    | Link to `users.id`.              |
| `service`    | `VARCHAR(50)`   |                                | e.g., "Web Designing".           |
| `payment`    | `VARCHAR(50)`   |                                | e.g., "GCash".                   |
| `budget`     | `VARCHAR(50)`   |                                | e.g., "Silver", "Gold".          |
| `amount`     | `DECIMAL(10,2)` |                                | Numeric value for calculations.  |
| `deadline`   | `DATE`          | Nullable                       | Optional project deadline.       |
| `details`    | `TEXT`          |                                | Detailed project brief.          |
| `status`     | `ENUM`          | Values: 'pending', 'completed' | Tracks progress.                 |
| `created_at` | `TIMESTAMP`     | Default: `CURRENT_TIMESTAMP`   | Submission date.                 |

### 1.3 Notifications (Client Alerts)

**Purpose:** Stores alerts shown to clients when their projects are updated.

| Column Name | Data Type   | Key / Extra                  | Description              |
| ----------- | ----------- | ---------------------------- | ------------------------ |
| `id`        | `INT`       | Primary Key, A.I.            | Unique ID.               |
| `user_id`   | `INT`       | Foreign Key                  | Link to `users.id`.      |
| `message`   | `TEXT`      |                              | Alert message content.   |
| `is_read`   | `BOOLEAN`   | Default: `0`                 | Tracking for UI.         |
| `created_at`| `TIMESTAMP` | Default: `CURRENT_TIMESTAMP` | When it was sent.        |

### 1.4 E-Wallet (Income History)

**Purpose:** Tracks completed work and total revenue for the admin.

| Column Name | Data Type       | Key / Extra                  | Description                  |
| ----------- | --------------- | ---------------------------- | ---------------------------- |
| `id`        | `INT`           | Primary Key, A.I.            | Transaction ID.              |
| `order_id`  | `VARCHAR(50)`   | Foreign Key                  | Link to `commissions.id`.    |
| `amount`    | `DECIMAL(10,2)` |                              | Value of the completed work. |
| `date`      | `TIMESTAMP`     | Default: `CURRENT_TIMESTAMP` | Completion date.             |

### 1.5 Attachments (Optional)

**Purpose:** Stores names and paths of files uploaded by clients.

| Column Name | Data Type      | Key / Extra       | Description              |
| ----------- | -------------- | ----------------- | ------------------------ |
| `id`        | `INT`          | Primary Key, A.I. | Unique ID.               |
| `order_id`  | `VARCHAR(50)`  | Foreign Key       | Link to `commissions.id`.|
| `name`      | `VARCHAR(255)` |                   | Original filename.       |
| `path`      | `VARCHAR(255)` |                   | Location on your server. |

---

## 2. Relationships Overview

- **Users → Commissions**: One user can have many commissions (Link `client_id` to `id`).
- **Users → Notifications**: One user can receive many notifications (Link `user_id` to `id`).
- **Commissions → E-Wallet**: One commission result contributes one entry to income history (Link `order_id` to `id`).
- **Commissions → Attachments**: One commission can have multiple file uploads (Link `order_id` to `id`).
