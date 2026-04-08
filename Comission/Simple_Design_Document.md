# CommissionHub — Simplified System Design

This document explains how the CommissionHub app works using simple language that everyone can understand. It avoids technical code and focuses on the people using the app and the information being handled.

---

## 1. System Requirements (What the App Does)
The app is a bridge between a person who needs creative work done (the **Customer**) and a professional who provides services (the **Admin**).

*   **For Customers:** It allows them to see what services are offered, create an account, and fill out a form to request a project. They can also see when their project is finished.
*   **For the Admin:** It provides a private dashboard to see all incoming requests, organize them, mark them as done, or remove old ones. **It also features an E-Wallet tracker to automatically sum up total earnings from all completed projects.**
*   **Information Storage:** The app remembers who you are, what you requested, and all historical income data (processed through budget tier parsing) so you don't lose your progress.

---

## 2. System Actors (Who Uses the App)

| Who they are | What they do in the App |
|---|---|
| **Customer (Client)** | Browses the services, creates a personal account, sends detailed project requests, and waits for updates on their dashboard. |
| **Administrator (Worker)** | Logs into a private panel to see all requests. They review what the customer wants, mark orders as "Completed" when the work is done, manage the overall list, and **monitor financial growth through the E-Wallet interface.** |
| **The System (App)** | Automatically saves data, sends alerts when work is finished, and makes sure the right information is shown to the right person. |

---

## 3. Top Use Cases (How People Use the App)

This diagram shows how different actions connect the Customer and the Admin through the App.

```mermaid
flowchart TD
    subgraph "Customer Actions"
        C1[Browse Services] --> C2[Create Account/Login]
        C2 --> C3[Send Work Request]
        C3 --> C4[Track Progress on Dashboard]
    end

    subgraph "Admin Actions"
        A1[Login to Admin Panel] --> A2[Review Customer Requests]
        A2 --> A3[Mark Request as Finished]
        A3 --> A4[Track Earnings via E-Wallet]
        A4 --> A5[Delete or Archive Orders]
    end

    C3 -- "Sends Order To" --> A2
    A3 -- "Notifies" --> C4
    A3 -- "Adds Payment To" --> A4
```

---

## 4. Class Diagram (The Information Held)

This diagram shows the main "objects" or boxes of information the app keeps track of and what details (attributes) are inside them.

```mermaid
classDiagram
    class CustomerProfile {
        Full Name
        Email Address
        Password
        Account Created Date
    }

    class ProjectRequest {
        Unique Order ID
        Customer's Name
        Customer's Email
        Service Type (e.g., Graphics, Voice)
        How they will pay (e.g., GCash)
        Budget Choice
        Deadline Date
        Project Description
        Current Status (Waiting or Finished)
        Date Submitted
    }

    class AlertNotification {
        Message (e.g., "Your project is done!")
        Date Sent
        Has it been seen?
    }

    class EWalletTracker {
        Total Earnings (₱)
        Number of Completed Commissions
        Income History List
        Budget Parsing Engine
    }

    CustomerProfile "1" --> "*" ProjectRequest : Sends
    ProjectRequest "1" --> "1" AlertNotification : Creates
    ProjectRequest "*" --> "1" EWalletTracker : Contributes Income
```

---

## 5. Activity Diagrams (Step-by-Step Flows)

### 5.1 Ordering a Service (The Customer's Journey)
```mermaid
stateDiagram-v2
    [*] --> SeeServices
    SeeServices --> NeedsToLogin
    NeedsToLogin --> FillInRequestForm
    FillInRequestForm --> AttachFiles : Optional
    AttachFiles --> SubmitOrder
    SubmitOrder --> SaveOrderInApp
    SaveOrderInApp --> ShowOnDashboard
    ShowOnDashboard --> [*]
```

### 5.2 Finishing a Request (The Admin's Journey)
```mermaid
stateDiagram-v2
    [*] --> LoginAsAdmin
    LoginAsAdmin --> LookAtOrdersList
    LookAtOrdersList --> OpenOrderDetails
    OpenOrderDetails --> ClickFinishButton
    ClickFinishButton --> SystemSendsAlertToCustomer
    SystemSendsAlertToCustomer --> ParseBudgetTier
    ParseBudgetTier --> AddAmountToEWalletTotal
    AddAmountToEWalletTotal --> UpdateIncomeHistoryList
    UpdateIncomeHistoryList --> OrderMarkedAsDone
    OrderMarkedAsDone --> [*]
```
