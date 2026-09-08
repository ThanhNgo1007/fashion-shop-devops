# DeployHub — Day 1: Baseline vận hành

## Mục tiêu

Thiết lập một điểm xuất phát có thể kiểm chứng cho lộ trình DevOps: hiểu luồng ứng dụng hiện tại, biết cách kiểm tra một endpoint HTTP từ Linux và ghi rõ những phần hạ tầng chưa được tự động hóa.

## Kiến trúc hiện tại

```text
Browser
  |
  +--> React storefront và admin dashboard
          |
          +--> Express REST API + Socket.IO
                    |
                    +--> MongoDB Atlas
                    +--> Cloudinary / VNPay Sandbox / Gemini / Email
```

- Frontend là React và hiện được tài liệu hóa với Cloudflare Pages.
- Backend là Express/Socket.IO, lấy cổng chạy từ `PORT` và kết nối MongoDB bằng biến môi trường.
- Backend và frontend phụ thuộc URL môi trường để CORS và gọi API hoạt động đúng.

Nguồn tham chiếu: `README.md`, `backend/src/index.js`, `backend/.env.example` và `frontend/.env.example`.

## Trạng thái DevOps ban đầu

| Hạng mục | Trạng thái Day 1 | Mục tiêu lab tiếp theo |
| --- | --- | --- |
| Container | Chưa có Dockerfile hoặc Compose | Docker hóa backend, frontend và database local |
| CI/CD | Chưa có pipeline | Tạo GitHub Actions cho test, build và scan |
| IaC | Chưa có Terraform | Mô tả hạ tầng staging bằng Terraform |
| Kubernetes | Chưa có manifests | Deploy trên kind hoặc k3d trước |
| Observability | Chưa có health endpoint hoặc dashboard | Thêm endpoint và Prometheus/Grafana ở các ngày sau |

Không ghi secrets, token, URL có credential hoặc nội dung `.env` vào tài liệu này.

## Linux health check

Script `scripts/check-health.sh` kiểm tra một URL và trả exit code để dùng được trong shell, CI hoặc cron:

```bash
./scripts/check-health.sh https://staging.example.com/
```

- HTTP `2xx` hoặc `3xx`: in `UP (...)` và exit `0`.
- HTTP `4xx` hoặc `5xx`: in `DOWN (...)` và exit `1`.
- Lỗi DNS, timeout hoặc kết nối: in `DOWN (request failed)` và exit `1`.
- Thiếu URL: in hướng dẫn sử dụng và exit `64`.

Backend hiện chưa có endpoint `/health`; khi endpoint này được thêm ở lab Kubernetes, dùng:

```bash
./scripts/check-health.sh http://localhost:3001/health
```

Có thể đặt timeout ngắn hơn trong CI:

```bash
CONNECT_TIMEOUT_SECONDS=2 MAX_TIME_SECONDS=5 ./scripts/check-health.sh https://staging.example.com/
```

## Xác minh Day 1

```bash
bash scripts/tests/check-health.test.sh
```

Kết quả mong đợi:

```text
PASS: check-health.sh behavior verified
```

## Tiêu chí hoàn thành

- Có sơ đồ và phạm vi hiện tại của ứng dụng.
- Có script kiểm tra HTTP có exit code phù hợp cho automation.
- Có test mô phỏng response thành công, HTTP 503, lỗi kết nối và thiếu tham số.
- Không thay đổi logic frontend/backend hoặc đụng đến secrets.
