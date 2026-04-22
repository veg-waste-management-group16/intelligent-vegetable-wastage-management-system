-- Clear existing mock/sample data
DELETE FROM payments;
DELETE FROM orders;
DELETE FROM users;

-- Reset auto-increment counters for clean IDs
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- Realistic customer records
INSERT INTO users (name, email, role) VALUES
('Meena', 'meena@example.com', 'CUSTOMER'),
('Kamal', 'kamal@example.com', 'CUSTOMER'),
('Joy', 'joy@example.com', 'CUSTOMER'),
('Sam', 'sam@example.com', 'CUSTOMER'),
('Anu', 'anu@example.com', 'CUSTOMER'),
('Ravi', 'ravi@example.com', 'CUSTOMER'),
('Nila', 'nila@example.com', 'CUSTOMER'),
('Pranav', 'pranav@example.com', 'CUSTOMER'),
('Diya', 'diya@example.com', 'CUSTOMER'),
('Arun', 'arun@example.com', 'CUSTOMER');

-- Realistic vegetable order records with valid order IDs and reasonable totals
INSERT INTO orders (order_id, total_amount, status, customer_id) VALUES
(301, 420.00, 'PAID',             (SELECT user_id FROM users WHERE email = 'meena@example.com' LIMIT 1)),
(302, 315.50, 'APPROVED',         (SELECT user_id FROM users WHERE email = 'kamal@example.com' LIMIT 1)),
(303, 268.75, 'PENDING_APPROVAL', (SELECT user_id FROM users WHERE email = 'joy@example.com' LIMIT 1)),
(304, 190.00, 'REJECTED',         (SELECT user_id FROM users WHERE email = 'sam@example.com' LIMIT 1)),
(305, 540.25, 'PAYMENT_FAILED',   (SELECT user_id FROM users WHERE email = 'anu@example.com' LIMIT 1)),
(306, 360.00, 'APPROVED',         (SELECT user_id FROM users WHERE email = 'ravi@example.com' LIMIT 1)),
(307, 289.90, 'PENDING_APPROVAL', (SELECT user_id FROM users WHERE email = 'nila@example.com' LIMIT 1)),
(308, 455.40, 'PENDING_APPROVAL', (SELECT user_id FROM users WHERE email = 'pranav@example.com' LIMIT 1)),
(309, 178.25, 'PENDING_APPROVAL', (SELECT user_id FROM users WHERE email = 'diya@example.com' LIMIT 1)),
(310, 399.00, 'PENDING_APPROVAL', (SELECT user_id FROM users WHERE email = 'arun@example.com' LIMIT 1));

-- Payment history linked to valid orders
INSERT INTO payments (payment_method, payment_status, transaction_reference, order_id) VALUES
('Credit/Debit Card', 'SUCCESS', 'TXNMEEN301', 301),
('Credit/Debit Card', 'FAILED',  'TXNANU305', 305);
