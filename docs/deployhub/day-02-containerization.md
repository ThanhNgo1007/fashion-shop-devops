# DeployHub — Day 2: Containerization

## Mục tiêu

Docker hóa toàn bộ ứng dụng D.E Fashion: backend, frontend và nginx reverse proxy. Thiết lập Docker Compose cho môi trường phát triển và production.

## Những gì đã làm

### 1. Backend Dockerfile (`backend/Dockerfile`)

Multi-stage build tối ưu cho Node.js + bcrypt:
- **Stage 1 (builder):** Cài build tools (python3, make, g++) cho native modules (bcrypt), chỉ install production dependencies
- **Stage 2 (runtime):** Copy dependencies đã build, chạy với non-root user, có HEALTHCHECK

```dockerfile
# Kiểm tra bcrypt compile thành công:
docker build -t fashionshop-api ./backend
docker run --rm fashionshop-api node -e "require('bcrypt')"
```

### 2. Frontend Dockerfile (`frontend/Dockerfile`)

Multi-stage build cho React CRA:
- **Stage 1:** Build React app với build args (`REACT_APP_API_KEY`, `REACT_APP_API_URL`, `REACT_APP_ADMIN_MAIL`)
- **Stage 2:** Serve bằng nginx:1.27-alpine với custom config cho SPA routing

### 3. Frontend Nginx Config (`frontend/nginx.conf`)

- `try_files $uri $uri/ /index.html` — hỗ trợ React Router
- Gzip compression cho text, CSS, JS
- Cache static assets 1 năm (fingerprinted files)
- Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, CSP

### 4. Docker Compose (`docker-compose.yml`)

4 services với health checks và dependency ordering:

```text
mongo (MongoDB 7)
  ↓ (service_healthy)
api (Express backend)
  ↓ (service_healthy)
frontend (React + nginx)
  ↓
proxy (nginx reverse proxy)
```

### 5. Production Override (`docker-compose.prod.yml`)

- Disable local MongoDB (dùng Atlas)
- Resource limits (CPU, memory)
- Chỉ proxy expose port 80/443
- JSON file logging với rotation

### 6. Nginx Reverse Proxy (`infra/nginx/default.conf`)

Cải thiện từ Day 1:
- Gzip compression
- Security headers
- Proxy `/health` endpoint
- WebSocket timeout 86400s
- `/nginx-status` cho monitoring
- `client_max_body_size 50m` cho upload

### 7. Health Check Endpoint

Thêm `GET /health` vào backend (`backend/src/routes/index.js`):
- Kiểm tra MongoDB connection state
- Trả `200 { status: "ok" }` hoặc `503 { status: "degraded" }`
- Dùng cho Docker HEALTHCHECK, K8s probes, monitoring

### 8. Makefile

Các lệnh tiện dụng: `make build`, `make up`, `make down`, `make health`, `make logs`...

## Cấu trúc file mới

```text
fashion-shop-project/
├── .env.backend.example          # [NEW] Template biến môi trường Docker
├── .gitignore                    # [NEW] Git ignore rules
├── docker-compose.yml            # [NEW] Local dev environment
├── docker-compose.prod.yml       # [NEW] Production overrides
├── Makefile                      # [NEW] Automation commands
├── backend/
│   ├── Dockerfile                # [NEW] Multi-stage Node.js build
│   ├── .dockerignore             # [NEW]
│   └── src/routes/index.js       # [MODIFIED] Thêm /health endpoint
├── frontend/
│   ├── Dockerfile                # [NEW] Multi-stage React build
│   ├── .dockerignore             # [NEW]
│   └── nginx.conf                # [NEW] SPA nginx config
└── infra/nginx/
    └── default.conf              # [MODIFIED] Thêm security headers, gzip, monitoring
```

## Cách chạy

```bash
# 1. Copy và điền biến môi trường
cp .env.backend.example .env.backend

# 2. Build và khởi chạy
make build
make up

# 3. Kiểm tra health
make health

# 4. Xem logs
make logs

# 5. Dọn dẹp
make down
```

## Xác minh Day 2

```bash
# Container đang chạy
docker compose ps

# Health check
curl http://localhost:3001/health
# → { "status": "ok", "uptime": ..., "mongodb": "connected" }

curl http://localhost:80/health
# → Proxy forward đến backend health

# Frontend SPA routing
curl -I http://localhost:3000/products/some-slug
# → 200 (try_files redirect to index.html)
```

## Tiêu chí hoàn thành

- [x] Backend và frontend có Dockerfile multi-stage build
- [x] Docker Compose chạy được 4 services với health checks
- [x] Nginx reverse proxy có security headers và gzip
- [x] Health endpoint `/health` kiểm tra MongoDB connectivity
- [x] Production override tách biệt
- [x] Makefile với các lệnh automation cơ bản
- [x] Không commit secrets hoặc `.env` files

## Bài học

- `bcrypt` cần native compilation → cần python3, make, g++ trong build stage, nhưng không cần trong runtime stage (multi-stage build giảm image size)
- Docker Compose `version` key đã deprecated từ Compose V2
- `service_healthy` condition đảm bảo MongoDB sẵn sàng trước khi API khởi động
- React CRA cần biến môi trường ở build time (ARG) chứ không phải runtime (ENV)
