# Mockup Form Campaign

Dự án này là hệ thống Public Form chuyên dụng phục vụ việc thu thập thông tin tuyển sinh (Lead) cho các chiến dịch Marketing. Nó được tách ra thành một Next.js App độc lập, siêu nhẹ và tối ưu hóa tốc độ tải trang.

## 🚀 Tính năng nổi bật

- **Form Tuyển sinh (`/public-forms`)**: Giao diện đẹp, mượt mà, hỗ trợ đổ dữ liệu Tỉnh/Thành, Quận/Huyện, Trường học tự động từ crm-backend.
- **Tích hợp crm-backend**: Dùng các endpoint khách (không cần đăng nhập) `GET /api/v1/public/{provinces,wards,high-schools,majors,campaigns}` và `POST /api/v1/leads/intake`.
- **Gửi lại an toàn**: Mỗi lượt gửi mang `Idempotency-Key`; backend giới hạn tần suất theo IP và báo lỗi bằng thông điệp tiếng Việt.
- **Không CORS**: Trình duyệt chỉ gọi `/api/backend/...` cùng origin, route handler chuyển tiếp sang crm-backend.
- **UI Components Chuẩn**: Kế thừa trọn bộ `@tailgrids/core` (Button, Input, Select...) đảm bảo đồng nhất thiết kế với hệ thống lõi.

## 📦 Công nghệ sử dụng

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Styling**: Tailwind CSS
- **Thư viện UI/Icon**: `react-aria-components`, `sonner`, `lucide-react`
- **Kết nối Backend**: fetch API qua route handler `/api/backend`

## ⚙️ Cài đặt & Chạy dự án

1. **Cài đặt thư viện**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Cấu hình môi trường**
   Đặt địa chỉ crm-backend (biến phía server, không phải `NEXT_PUBLIC_*`):
   ```env
   CRM_BACKEND_URL=https://api.faip.pro
   ```

3. **Chạy Server Development**
   ```bash
   npm run dev
   ```
   Trang web sẽ chạy tại: [http://localhost:3000](http://localhost:3000) (hoặc 3001 nếu port đã bị chiếm).

## 📂 Cấu trúc thư mục

```
src/
├── app/
│   ├── (without-layouts)/
│   │   └── public-forms/      # Trang chủ đạo chứa các form chiến dịch
│   ├── css/                   # Global styles & Tailwind utils
│   └── globals.css
├── components/
│   └── tailgrids/core/        # Các UI Components cơ bản (nút, input, select...)
├── services/
│   └── api/lead-mapping/      # Logic gọi crm-backend
└── utils/                     # Các hàm tiện ích (cn, format...)
```

## ⚠️ Lưu ý về API Proxy

`src/app/api/backend/[...path]/route.ts` chỉ chuyển tiếp các đường dẫn công khai nói trên tới `CRM_BACKEND_URL/api/v1/...` (cùng `Idempotency-Key` và IP người gửi để backend giới hạn tần suất đúng người). Đường dẫn khác trả 404.

Danh sách học sinh trên trang chỉ gồm những đăng ký vừa thực hiện trên thiết bị này: backend không cung cấp danh sách lead công khai.
