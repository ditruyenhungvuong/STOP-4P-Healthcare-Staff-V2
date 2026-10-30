# STOP-4P Healthcare Staff — DỪNG 5

Web app mobile-first (HTML/CSS/JS thuần, không cần build) dành cho nhân viên y tế, xây dựng theo đặc tả
*DUNG5_Dac_ta_ung_dung_cho_lap_trinh_v1* và kế thừa cơ chế trò chơi của repo
[`ditruyenhungvuong/nhatkymebau`](https://github.com/ditruyenhungvuong/nhatkymebau) (bầy khỉ + chuông, rồng thổi chong chóng,
bản đồ điểm đau, thư giãn, capybara gọi tên cảm xúc, đám mây, hũ bình an), đã chuyển sang bối cảnh nhân viên y tế.

> Bản demo, **không phải** công cụ chẩn đoán hay điều trị. Nội dung bài tập chưa được hội đồng chuyên môn phê duyệt.

## Chạy thử

- **Windows, không cần cài gì:** `powershell -ExecutionPolicy Bypass -File tools\serve.ps1` rồi mở http://localhost:8765
- Hoặc đưa cả thư mục lên GitHub Pages / bất kỳ web server tĩnh nào.
- Mở trực tiếp `index.html` bằng file:// cũng chạy được trên hầu hết trình duyệt.

## Có gì trong bản này

| Đặc tả | Đã làm |
|---|---|
| S01 Chào mừng | Hai lựa chọn ngang cấp: ẩn danh / số điện thoại; liên kết thư viện, quyền riêng tư, hỗ trợ |
| S02 OTP | Chuẩn hóa +84, che số, OTP hết hạn 5 phút, tối đa 5 lần nhập, gửi lại sau 60 giây, không cho biết số đã có tài khoản chưa. **Chế độ `dev-mock`** (mã hiện trên màn hình) **chỉ bật khi chạy trên máy** (localhost / 127.0.0.1 / file:). Bản công khai (GitHub Pages) tự chuyển `disabled`: ẩn đăng nhập, chỉ còn ẩn danh, ghi "Bản demo công khai chưa có đăng nhập" |
| S03 Hồ sơ | Hùng Vương / Khác (bắt buộc chọn một); khoa/phòng tùy chọn, "Không muốn cung cấp", xóa được; không gửi cho AI |
| S04 DỪNG 5 | Vòng tròn 5 giây, nút Bỏ qua, tôn trọng `prefers-reduced-motion` |
| S05 Check-in | Nhiều cảm xúc (ảnh capybara), thang 0–10, văn bản tự do ≤ 2.000 ký tự, tình huống, thời gian, "đang làm việc cần tập trung", **cảnh báo thông tin nhận diện** (SĐT, dãy số dài, số giường, mã bệnh án, danh xưng + tên) |
| S06 Gợi ý | Kiểm tra an toàn bằng luật trước; tối đa 2 bài trong danh mục; sửa nhãn; đổi gợi ý; "Tôi cần người hỗ trợ" |
| S07 Trình phát | 12 hoạt động của mục 4 — thở 4-6 / hộp / 4-7-8 (có cổng xác nhận nín thở), HUM, grounding 5-4-3-2-1, PMR, nhật ký, biết ơn, âm thanh (tự tạo bằng WebAudio, không tự phát), nghỉ ngắn phục hồi; nút "Trở về thở tự nhiên" |
| **4 trạm – 1 phút bình an** | Module thả lỏng thân – tâm 8–10 phút: khởi động (tự chấm căng thẳng 0–10) → 4 trạm **hơi thở → vai gáy → mặt và hàm → tâm trí**, mỗi trạm đi qua 4 nhịp **Nhận biết → Trải nghiệm → Buông lỏng → Cảm nhận** có hẹn giờ nhẹ (90 giây, riêng trạm tâm trí 2 phút), tạm dừng / "Tiếp" / bỏ qua trạm; người chơi tự bấm "Tôi đã…" để mở khóa trạm, đếm 0/4. Kết thúc: chấm lại 0–10, chọn vùng thả lỏng rõ nhất, ghi chú tùy chọn và thông điệp kết thúc |
| **Hành trình STOP-4P** | Trò chơi 9 chặng: check-in → STOP bầy khỉ (giữ chuông 3 giây) → rồng thổi chong chóng (giữ = hít vào, thả = thở ra) → điểm đau (hình NVYT mặc scrubs) → thư giãn từng vùng → gọi tên cảm xúc → thả mây → hũ bình an → 3 lời biết ơn (cây ra lá). Chặng nào cũng bỏ qua được, nhảy tự do trên bản đồ; không điểm số, không streak |
| **Giọng đọc người quản trò** — *đang tạm tắt* (`index.html` không nạp `js/voice.js`) | Giọng máy của thiết bị (Web Speech API) đọc lời dẫn cho **mọi bài tập và cả hai trò chơi**: nút bật/tắt, chọn **giọng nữ / giọng nam**, chế độ "chậm hơn", nút "Đọc lại". Mặc định tắt; chỉ phát sau khi người dùng bấm; tự dừng khi đổi màn hình hoặc mở "Trở về thở tự nhiên". Lời dẫn chia thành từng câu với **khoảng dừng 5–10 giây** để người nghe kịp cảm nhận |
| **Bài ngồi cho đôi chân** (mới, 29/10/2026, **đã được BS Thông duyệt 29/10/2026** — `status: 'approved'`, hiện cả khi `ALLOW_DRAFT_CONTENT: false`) | "Nhón gót khi ngồi" (seated calf raise, 1–2 hiệp × 12 lần) và "Nâng gót cơ dép khi ngồi" (soleus push-up, 2 phút giữa ca hoặc 10 phút sau ăn chia 4 đoạn). Hình bàn chân SVG nâng/hạ theo nhịp, số đếm, đồng hồ, tạm dừng, bỏ qua đoạn, "Thấy khó chịu? Dừng ngay". Bối cảnh mới trong check-in: "Giữa 2 ca", "Sau khi ăn". Không âm thanh, không giọng đọc; không gợi ý khi có chóng mặt/khó thở/đau ngực. Đặc tả: `docs/specs/stop-4p-hs-bai-ngoi-calf-soleus.md` (trong xưởng App Creator) |
| S08 Check-out | Thang 0–10 (có "không muốn trả lời"), Phù hợp / Không phù hợp / Khó chịu hơn / Chưa chắc; "khó chịu hơn" → dừng, thở tự nhiên, tìm hỗ trợ |
| S09 Hành trình | Chỉ member: dòng thời gian, biểu đồ trước/sau, bài hữu ích, xóa từng mục (bấm 2 lần), xuất JSON/CSV, xóa toàn bộ, xóa tài khoản |
| S10 Hỗ trợ | Truy cập từ mọi màn hình; 115; người tin cậy; kênh của cơ sở (cấu hình); mệt mỏi ảnh hưởng người bệnh |
| Guest → member | Chỉ lưu phiên vừa làm khi người dùng chọn "Có" (mặc định Không) |

### Bộ luật an toàn (`js/engine.js`)
- Ý nghĩ tự hại / nguy hiểm → trang hỗ trợ khẩn **trước**, không chỉ đưa bài thở. Vì tiếng Việt hay nói cường điệu ("mệt muốn chết"), trang này có nút "Tôi đang an toàn — tiếp tục", sau đó vẫn hiện thẻ hỗ trợ con người.
- Thiếu ngủ / sau trực + mệt → `MICRO_RECOVERY`, nhắc báo người phụ trách; không bao giờ gợi ý "thở cho tỉnh để trực tiếp".
- Đang làm nhiệm vụ cần tập trung → chỉ `STOP_PAUSE`.
- Chóng mặt, khó thở, đau ngực hoặc mức khó chịu ≥ 7 → loại bài có nín thở, khuyên kiểm tra sức khỏe.
- Ca nặng / tự trách, trống rỗng, kiệt sức kéo dài → luôn hiện thẻ hỗ trợ con người.

## Quyền riêng tư trong bản demo
- **Ẩn danh:** không ghi check-in, nhật ký hay bất kỳ nội dung nào vào localStorage, cookie hay máy chủ; đóng/tải lại trang là mất. (Khi bật lại giọng đọc thì có một ngoại lệ: tùy chọn giọng đọc `stop4p_voice` — thiết lập hiển thị, không phải dữ liệu sức khỏe. Hiện giọng đọc tắt nên không có ngoại lệ nào.)
- **Giọng đọc (đang tạm tắt):** chạy hoàn toàn trong trình duyệt bằng giọng có sẵn của thiết bị, không gọi dịch vụ ngoài, không đọc nội dung người dùng tự viết. Nếu máy chưa cài giọng tiếng Việt, app báo rõ và hướng dẫn cách cài; lúc đó giọng mặc định sẽ phát âm sai.

### Giọng tiếng Việt trên từng nền tảng
App tự dò giọng `vi-*` của thiết bị, ưu tiên giọng "Natural/Neural", và ghi rõ đang dùng giọng nào.

| Nền tảng | Giọng tiếng Việt thường có | Kết quả trong app |
|---|---|---|
| Windows + Chrome | `Microsoft An` (nam, cài qua Cài đặt › Giọng nói) | Giọng nam thật; giọng nữ là **mô phỏng** (dùng An, nâng cao độ) |
| Microsoft Edge | `Microsoft HoaiMy` (nữ) và `NamMinh` (nam), giọng tự nhiên | Có đủ hai giọng thật — nên dùng Edge nếu cần giọng nữ |
| Android | `vi-vn-x-vif` (nữ), `vi-vn-x-vim` (nam) | Đủ hai giọng thật |
| iPhone/iPad | `Linh` (nữ) | Giọng nữ thật; giọng nam mô phỏng |

Lưu ý: trình duyệt chỉ nạp danh sách giọng **lúc khởi động**. Vừa cài giọng xong thì phải đóng hẳn trình duyệt rồi mở lại, sau đó bấm "↻ Làm mới giọng" trong app.
- **Member (demo, chỉ khi chạy trên máy):** dữ liệu nằm trong localStorage **của thiết bị này**, khóa là SHA-256 (salt công khai) của số điện thoại; không lưu số nguyên văn. **Đây không phải bảo mật:** trên máy dùng chung, người dùng được trình duyệt đó có thể suy ra số điện thoại trong vài giây và đọc hành trình — trên máy chung hãy dùng ẩn danh. Tài khoản chỉ được ghi xuống máy **sau** khi người dùng bấm đồng ý. Lưu hành trình, lưu nội dung tự viết và đồng ý nghiên cứu là ba đồng ý riêng (hai mục sau mặc định tắt).
- **Bộ lọc thông tin nhận diện** soát mọi ô tự viết được lưu (check-in, nhật ký, lời nhắn hũ bình an, 3 lời biết ơn, ghi chú 4 trạm) và cho sửa / bỏ / vẫn giữ. Giới hạn: không bắt khi gõ không dấu ("giuong 12"), tên viết thường ("chị lan"), tên VIẾT HOA TOÀN BỘ, tên không kèm danh xưng.
- **localStorage dùng chung origin:** trên GitHub Pages mọi app của tài khoản `ditruyenhungvuong` chung origin `ditruyenhungvuong.github.io` và đọc được localStorage của nhau. App không đổi được điều này, nên bản công khai không ghi gì; khi có đăng nhập thật thì dữ liệu phải ở máy chủ (hoặc dùng tên miền riêng).
- Bộ lọc thông tin nhận diện chuẩn hóa văn bản về NFC trước khi soát (văn bản dán từ macOS / gõ Unicode tổ hợp vẫn được soát).
- Không có trang quản trị, không thống kê theo khoa, không xếp hạng.

## Cấu hình — `js/config.js`
- `SUPPORT_CHANNELS`: kênh hỗ trợ của bệnh viện — **chỉ điền sau khi đơn vị xác nhận**; hiện để trống (người dùng thấy "Cơ sở chưa công bố kênh hỗ trợ trong ứng dụng…", màn khẩn chỉ hiện 115 và "nói với người ở gần").
- `DEPARTMENTS_HV`: danh mục khoa/phòng **mẫu**, cần danh sách chính thức.
- `ASSET_BASE`: ảnh capybara đang lấy trực tiếp từ repo nhatkymebau trên GitHub; muốn chạy offline thì chép ảnh vào `assets/` và đổi thành `'assets/'`. Không tải được ảnh thì app tự hiện emoji.
- `OTP_MODE`: tự chọn `dev-mock` khi chạy trên máy (localhost / 127.0.0.1 / `file://` không có host), `disabled` ở mọi nơi khác — kể cả `file://maychu/...` (thư mục chia sẻ mạng). **Chỉ thử đăng nhập trên máy cá nhân**: chạy `serve.ps1`/localhost trên máy dùng chung của khoa vẫn có rủi ro ai gõ số đồng nghiệp cũng đọc được dữ liệu. Khi có máy chủ SMS OTP thật thì đặt `'server'` và điền `OTP_ENDPOINTS`.
- `AI_RECOMMEND_ENDPOINT`: đã có adapter sẵn để nối máy chủ.
- `ALLOW_DRAFT_CONTENT`: chỉ đặt `false` **sau khi** đã đổi `status` của bài thành `approved`; nếu chưa có bài nào được duyệt, thư viện và màn Gợi ý hiện lời giải thích thay vì trống.

## Chưa làm / cần làm trước khi dùng thật
1. Backend (đặc tả mục 8–10): OTP qua SMS thật, phiên bằng cookie HttpOnly, PostgreSQL, mã hóa, API `/api/me/*`. **Chưa làm thì không được dùng OTP giả khi phát hành** — bản công khai hiện đã tắt đăng nhập (chỉ ẩn danh).
2. AI phía server (nếu dùng): prompt JSON, allowlist, retention của nhà cung cấp. App đã lọc lại kết quả AI bằng danh mục và không để AI hạ mức hỗ trợ.
3. Hội đồng chuyên môn duyệt nội dung (đổi `status` thành `approved`, đặt `ALLOW_DRAFT_CONTENT: false`) và rà lại danh sách từ khóa an toàn.
4. S11 (biên tập nội dung, số liệu tổng hợp có ngưỡng ≥ 10) — thuộc P2, cần backend.
5. Các quyết định ở mục 15 của đặc tả.

## Cấu trúc
```
index.html · styles.css
js/config.js   cấu hình của đơn vị triển khai
js/data.js     danh mục bài tập, cảm xúc, tình huống, từ khóa
js/engine.js   an toàn + gợi ý + phát hiện thông tin nhận diện + adapter AI
js/store.js    lưu trữ member (demo, localStorage)
js/voice.js    giọng đọc người quản trò (Web Speech API, nữ/nam, khoảng dừng)
js/players.js  trình phát bài tập + trò chơi STOP-4P
js/app.js      điều hướng và các màn hình S01–S10
tools/serve.ps1  web server tĩnh cho Windows
tests/e2e.js     kiểm thử tự động bằng Chrome headless (tests/lib/cdp.js), xem đầu file để chạy
```
