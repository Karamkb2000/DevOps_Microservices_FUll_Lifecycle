# Run Locally (without Docker)

This is the manual setup — run each service directly with Node and connect to a local Postgres. Use this first to confirm the code works on your machine before we add Docker.

## Step 0 — Install prerequisites (one time)

### macOS
```bash
brew install node@20 postgresql@15
brew services start postgresql@15
```

### Ubuntu / WSL2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql-15
sudo service postgresql start
```

### Verify
```bash
node --version    # v20.x
psql --version    # psql 15.x
git --version
```

## Step 1 — Create the database (one time)

```bash
psql postgres <<'EOF'
CREATE USER ecommerce WITH PASSWORD 'devpassword' SUPERUSER;
CREATE DATABASE ecommerce OWNER ecommerce;
EOF
```

Verify the connection works:
```bash
psql -U ecommerce -d ecommerce -c "SELECT 1;"
```

## Step 2 — Clone the project

```bash
cd ~/Desktop
git clone <your-repo-url> DevOps_Microservices
cd DevOps_Microservices
```

## Step 3 — Install dependencies (one time, ~3 minutes)

```bash
cd ~/Desktop/DevOps_Microservices

for s in auth-service product-service order-service notification-service; do
  (cd services/$s && npm install)
done

(cd frontend && npm install)
```

## Step 4 — Start the 5 services

Open **5 separate terminal tabs** (Cmd+T on Mac, Ctrl+Shift+T on Linux). Each tab runs one process. Keep all five tabs open and running.

### Tab 1 — auth-service (port 3001)
```bash
cd ~/Desktop/DevOps_Microservices/services/auth-service && \
DB_HOST=localhost DB_USER=ecommerce DB_PASSWORD=devpassword DB_NAME=ecommerce \
JWT_SECRET=dev-secret PORT=3001 \
npm start
```

### Tab 2 — product-service (port 3002)
```bash
cd ~/Desktop/DevOps_Microservices/services/product-service && \
DB_HOST=localhost DB_USER=ecommerce DB_PASSWORD=devpassword DB_NAME=ecommerce \
JWT_SECRET=dev-secret PORT=3002 SEED_ON_BOOT=true \
npm start
```

### Tab 3 — order-service (port 3003)
```bash
cd ~/Desktop/DevOps_Microservices/services/order-service && \
DB_HOST=localhost DB_USER=ecommerce DB_PASSWORD=devpassword DB_NAME=ecommerce \
JWT_SECRET=dev-secret PORT=3003 \
PRODUCT_SERVICE_URL=http://localhost:3002 \
NOTIFICATION_SERVICE_URL=http://localhost:3004 \
npm start
```

### Tab 4 — notification-service (port 3004)
```bash
cd ~/Desktop/DevOps_Microservices/services/notification-service && \
DB_HOST=localhost DB_USER=ecommerce DB_PASSWORD=devpassword DB_NAME=ecommerce \
JWT_SECRET=dev-secret PORT=3004 \
npm start
```

### Tab 5 — frontend (port 5173)
```bash
cd ~/Desktop/DevOps_Microservices/frontend && npm run dev
```

## Step 5 — Verify everything is running

Open a 6th tab and run:

```bash
curl http://localhost:3001/health/live
curl http://localhost:3002/health/live
curl http://localhost:3003/health/live
curl http://localhost:3004/health/live
```

All four should print `{"status":"ok"}`.

Then open **http://localhost:5173** in the browser:
1. Click **Sign up**, register a user (password must be at least 8 characters)
2. Browse the 9 seeded products
3. Click a product, add 1 to cart
4. Go to **Cart** → **Checkout**, fill in the shipping form, place the order
5. Go to **Orders** to see the order
6. Check Tab 4 (notification-service) — you'll see a `[MAIL LOG]` line proving the order event fired

If you can complete that full flow, your local setup is working.

## Step 6 — Stop everything when done

In each of the 5 terminal tabs: **Ctrl + C**.

Postgres can keep running (it's harmless) or stop it:
```bash
# macOS
brew services stop postgresql@15

# Linux
sudo service postgresql stop
```

## Step 7 — Reset the database (if needed)

If anything goes wrong (migrations got corrupted, want a clean slate, etc.):

```bash
psql postgres <<'EOF'
DROP DATABASE IF EXISTS ecommerce;
CREATE DATABASE ecommerce OWNER ecommerce;
EOF
```

Then restart the 5 services. Migrations and product seeding run on boot.

## Troubleshooting

| Problem                                       | macOS Fix                                                                                       | Linux Fix                                                                                       | Windows Fix                                                                                     |                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `psql: command not found`                     | `echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc` | Install Postgres client: `sudo apt install postgresql-client` then verify with `psql --version` | Add PostgreSQL `bin` folder to PATH. Example: `C:\Program Files\PostgreSQL\15\bin`              |                                            |
| `ECONNREFUSED 127.0.0.1:5432`                 | Postgres not running: `brew services start postgresql@15`                                       | `sudo service postgresql start` or `sudo systemctl start postgresql`                            | Start PostgreSQL service from **Services** or run: `net start postgresql-x64-15`                |                                            |
| `password authentication failed`              | Wrong DB username/password. Re-run Step 1                                                       | Wrong DB username/password. Re-run Step 1                                                       | Wrong DB username/password. Re-run Step 1                                                       |                                            |
| `Port 3001 already in use`                    | `lsof -i :3001` then `kill -9 <PID>`                                                            | `sudo lsof -i :3001` then `kill -9 <PID>`                                                       | `netstat -ano                                                                                   | findstr :3001`then`taskkill /PID <PID> /F` |
| `relation "schema_migrations" does not exist` | Run Step 7 to reset the DB                                                                      | Run Step 7 to reset the DB                                                                      | Run Step 7 to reset the DB                                                                      |                                            |
| Sign up returns `"Register failed"`           | Open browser DevTools → Network → inspect the API response for the actual error                 | Open browser DevTools → Network → inspect the API response for the actual error                 | Open browser DevTools → Network → inspect the API response for the actual error                 |                                            |
| Products page is empty                        | Tab 2 didn’t run with `SEED_ON_BOOT=true`. Reset DB (Step 7) and restart Tab 2 with the env var | Tab 2 didn’t run with `SEED_ON_BOOT=true`. Reset DB (Step 7) and restart Tab 2 with the env var | Tab 2 didn’t run with `SEED_ON_BOOT=true`. Reset DB (Step 7) and restart Tab 2 with the env var |                                            |


## What's next

Once this manual flow works, you're ready for the next step — packaging the same services with Docker. See `02-DOCKER-SETUP.md`.
