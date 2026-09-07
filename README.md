# Mockup Form Campaign

Dự án này là hệ thống Public Form chuyên dụng phục vụ việc thu thập thông tin tuyển sinh (Lead) cho các chiến dịch Marketing. Nó được tách ra thành một Next.js App độc lập, siêu nhẹ và tối ưu hóa tốc độ tải trang.

## 🚀 Tính năng nổi bật

- **Form Tuyển sinh (`/public-forms`)**: Giao diện đẹp, mượt mà, hỗ trợ đổ dữ liệu Tỉnh/Thành, Quận/Huyện, Trường học tự động từ Backend Frappe.
- **Tích hợp API Trực tiếp (Lead Mapping)**: Kết nối thẳng với Backend Frappe qua các endpoint `get_public_provinces`, `create_public_lead`... không cần xác thực (Guest allow).
- **Chống trùng lặp (Duplicate Validation)**: Nhận diện mã lỗi `417 Expectation Failed` từ Frappe và hiển thị thông báo lỗi thân thiện ("Bạn đã đăng ký tham gia chiến dịch này rồi...") thay vì lỗi kỹ thuật.
- **Fix CORS Triệt để**: Sử dụng cơ chế Proxy Rewrites của Next.js để gọi API nội bộ, hoàn toàn loại bỏ nỗi lo bị trình duyệt chặn CORS.
- **UI Components Chuẩn**: Kế thừa trọn bộ `@tailgrids/core` (Button, Input, Select...) đảm bảo đồng nhất thiết kế với hệ thống lõi.

## 📦 Công nghệ sử dụng

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Styling**: Tailwind CSS
- **Thư viện UI/Icon**: `react-aria-components`, `sonner`, `lucide-react`
- **Kết nối Backend**: fetch API với Next.js API Rewrites

## ⚙️ Cài đặt & Chạy dự án

1. **Cài đặt thư viện**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Cấu hình môi trường**
   Đảm bảo file `.env` đã được cấu hình trỏ đúng về backend Frappe:
   ```env
   NEXT_PUBLIC_FRAPPE_URL=http://localhost:8001
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
│   └── api/lead-mapping/      # Logic gọi API sang Backend Frappe
└── utils/                     # Các hàm tiện ích (cn, format...)
```

## ⚠️ Lưu ý về API Proxy

Tất cả các request `fetch` từ client gọi vào đường dẫn `/api/method/...` sẽ được **Next.js tự động chuyển tiếp (Proxy)** sang `NEXT_PUBLIC_FRAPPE_URL/api/method/...` dựa theo cấu hình trong `next.config.ts`. Điều này giúp Frontend nằm chung tên miền ảo với Backend khi gọi API, tránh hoàn toàn lỗi CORS.
