CREATE DATABASE IF NOT EXISTS vegetable_system;
USE vegetable_system;

CREATE TABLE IF NOT EXISTS product_listing (
    listing_id          INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id           INT,
    title               VARCHAR(255),
    description         TEXT,
    is_visible          BOOLEAN,
    listed_at           DATETIME,
    expires_at          DATETIME,
    risk_level          VARCHAR(20),
    suggested_discount  INT,
    price_per_kg        DOUBLE,
    quantity_kg         DOUBLE,
    category            VARCHAR(100),
    availability_status VARCHAR(20)
);

-- Delivery agent columns (added for delivery management feature)
-- These are managed by JPA/Hibernate via spring.jpa.hibernate.ddl-auto=update
-- If using ddl-auto=none or validate, run manually:
-- ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS agent_name VARCHAR(100);
-- ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS agent_phone VARCHAR(20);
-- ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS agent_vehicle VARCHAR(30);
-- ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50);
-- ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS pickup_date DATE;