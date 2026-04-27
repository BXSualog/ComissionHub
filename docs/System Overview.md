# System Overview: CommissionHub

CommissionHub is a comprehensive web-based platform designed to streamline the process of submitting, managing, and tracking service commission requests. It provides a seamless interface for both clients and administrators to interact throughout the lifecycle of a project.

---

## 1. Core Functionalities

### 1.1 Client-Facing Features
- **Account Management**: Secure signup and login system for individual clients.
- **Commission Submission**: A dynamic multi-step form for submitting project details, service types, and budget requirements.
- **Personal Dashboard**: A private space for clients to view their request history and current project statuses.
- **Real-time Notifications**: Alerts notifying clients when their projects are marked as completed or updated.

### 1.2 Admin-Facing Features
- **Request Management**: A centralized dashboard to view, filter, and search all incoming commission requests.
- **Status Control**: Capability to mark projects as "Pending" or "Completed" with automated revenue logging.
- **E-Wallet & Revenue Tracking**: Automated tracking of income from completed projects.
- **Analytics & Statistics**: Advanced reporting tools using SQL aggregate functions and subqueries to visualize sales performance and user engagement.
- **User Management**: Tools to manage client accounts, including editing and deletion capabilities.

---

## 2. Technology Stack

### 2.1 Frontend
- **Structure**: Semantic HTML5.
- **Styling**: Vanilla CSS3 with a focus on modern aesthetics (dark mode, glassmorphism, responsive design).
- **Logic**: Vanilla JavaScript (ES6+) for dynamic UI updates and asynchronous API communication.

### 2.2 Backend
- **Server**: Node.js with the Express framework.
- **Session Management**: `express-session` for secure user authentication and persistent sessions.
- **Security**: `bcryptjs` for industry-standard password hashing.

### 2.3 Database
- **Engine**: MySQL.
- **Architecture**: Normalized relational database with optimized queries for real-time analytics.

---

## 3. Directory Structure

- `admin.html`: The main dashboard for administrators.
- `dashboard.html`: The private dashboard for registered clients.
- `commission.html`: The project submission interface.
- `index.html`: The public landing page and authentication portal.
- `/server/`: Contains the Node.js backend logic (`index.js`) and database configuration (`db.js`).
- `/js/`: Client-side logic including the API wrapper (`api_client.js`) and UI handlers (`script.js`).
- `/css/`: Modular stylesheets for general, admin, and dashboard-specific designs.
- `/docs/`: Comprehensive technical documentation (Database design, System overview).
- `/assets/`: Static media and images used across the application.

---

## 4. Workflow Overview

1. **Submission**: A client submits a request via `commission.html`.
2. **Notification**: The request is stored in the database and appears in the Admin Dashboard.
3. **Action**: The admin reviews the request and marks it as "Completed" upon finishing the work.
4. **Finalization**:
   - The revenue is automatically added to the **E-Wallet**.
   - A **Notification** is sent to the client.
   - The **Analytics** tab is updated to reflect the new sale.
