# VegLife — Unified System (Everything on Port 8082)

All Java code runs from a single Spring Boot backend on port 8082.
The AI server runs separately on port 8000 (Python — cannot be merged into Spring Boot).

## Quick Start (3 terminals)

### Terminal 1 — Unified Spring Boot Backend
```bash
cd backend

# Set your MySQL password in src/main/resources/application.properties:
#   spring.datasource.password=YOUR_MYSQL_PASSWORD

mvn spring-boot:run
# Runs on http://localhost:8082
# Auto-creates database 'vegetable_system' and all tables on first run
```

### Terminal 2 — AI Prediction Server
```bash
cd ai-server
pip install -r requirements.txt   # first time only
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Runs on http://localhost:8000
# Trained model files (model.pkl etc) are already included
```

### Terminal 3 — React Frontend
```bash
cd frontend_react
npm install    # first time only
npm run dev
# Runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Port Map

| Service              | Port | Notes                          |
|----------------------|------|--------------------------------|
| React Frontend       | 5173 | Vite dev server                |
| Spring Boot Backend  | 8082 | Users + Listings + Stocks + Orders |
| AI FastAPI Server    | 8000 | ML demand predictions          |

---

## Database

Single MySQL database: **vegetable_system**

Tables auto-created by JPA on first run:
- `users` — all roles (admin, farmer, customer)
- `product_listing` — marketplace vegetable listings
- `notifications` — admin notifications
- `farmer_stock` — farmer stock inventory
- `farmer_order` — customer orders

---

## API Endpoints (all on port 8082)

| Path | Description |
|------|-------------|
| `POST /api/users/login` | Login |
| `POST /api/users/register` | Register |
| `GET /api/users/role/FARMER` | Get all farmers |
| `GET /api/listings` | All listings |
| `GET /api/listings/filter/visible` | Public marketplace listings |
| `GET /api/farmer/stocks/farmer/{id}` | Farmer's stock |
| `POST /api/farmer/stocks/add` | Add new stock |
| `GET /api/farmer/orders/farmer/{id}` | Farmer's orders |
| `POST /api/farmer/orders` | Create order (checkout) |
| `PATCH /api/farmer/orders/{id}/status` | Update order status |

---

## Roles

| Role | After Login | Notes |
|------|-------------|-------|
| ADMIN | `/admin` | Full dashboard, user + listing management |
| FARMER | `/farmer` | Stock management, AI demand, orders |
| CUSTOMER | `/customer` | Marketplace, cart, checkout |

Farmers must be approved by admin before they can access their dashboard.
