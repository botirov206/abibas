from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, warehouses, products, suppliers, inventory, purchase_orders, sales_orders, movements, dashboard

app = FastAPI(
    title="StockPilot WMS",
    description="Electronics & Hardware Warehouse Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(warehouses.router, prefix=PREFIX)
app.include_router(products.router, prefix=PREFIX)
app.include_router(suppliers.router, prefix=PREFIX)
app.include_router(inventory.router, prefix=PREFIX)
app.include_router(purchase_orders.router, prefix=PREFIX)
app.include_router(sales_orders.router, prefix=PREFIX)
app.include_router(movements.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "StockPilot WMS"}
