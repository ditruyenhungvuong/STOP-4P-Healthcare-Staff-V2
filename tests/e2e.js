/* =========================================================
   E2E – STOP-4P Healthcare Staff ("DỪNG 5") – QA rà soát app đã có.
   Chạy Chrome headless thật qua DevTools Protocol (lib/cdp.js), KHÔNG đụng Chrome của người dùng.

   Chạy:
     set NODE=C:\Users\SF\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
     %NODE% tests\e2e.js [--port=8767] [--out=<thư mục kết quả>] [--only=guest,member,...] [--images]
   Ubuntu (cần Node ≥ 22 vì dùng WebSocket có sẵn; thư mục tạm phải ngắn, Chrome báo "Socket path too long" nếu dài):
     export TMPDIR=/tmp/claude-1000/qa-stop4p; mkdir -p $TMPDIR
     $NODE tests/e2e.js --port=8767 --out=$TMPDIR/out
   Kịch bản: guest | member | privacy | journey | stations | safety | pii | edge | reduced | layout | public | seated
   - Sửa đợt 1–3 (28/10/2026): các test từng ghi nhận lỗi (NT-01, N-02…N-07, G-10, C-01) nay khẳng định hành vi ĐÃ SỬA;
     thêm kịch bản `privacy` (T-06/T-08/T-10/T-11) và `public` (T-01: bản công khai không có đăng nhập).
   - Server tĩnh phải chạy sẵn: python -m http.server 8767 --bind 127.0.0.1 --directory <thư mục app>
   - Mặc định CHẶN ảnh capybara (raw.githubusercontent) và Google Fonts để test tất định
     → đồng thời kiểm tra fallback emoji. Thêm --images để cho tải ảnh (chỉ dùng chụp màn hình).
   - Không ghi gì vào thư mục app ngoài file này; ảnh và profile Chrome ghi vào --out (mặc định %TEMP%).
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { launch, sleep } = require('./lib/cdp');

const argv = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)=?(.*)$/); return m ? [m[1], m[2] || true] : [a, true]; }));
const PORT = +(argv.port || 8767);
const APP_URL = 'http://127.0.0.1:' + PORT + '/index.html';
// Tên miền giả trỏ về 127.0.0.1 (Chrome --host-resolver-rules) để thử bản "công khai" — không phải localhost (T-01)
const PUBLIC_HOST = 'stop4p-demo.example';
const PUBLIC_URL = 'http://' + PUBLIC_HOST + ':' + PORT + '/index.html';
const OUT = path.resolve(argv.out || path.join(os.tmpdir(), 'stop4p-qa'));
const SHOTS = path.join(OUT, 'qa-screens');
fs.mkdirSync(SHOTS, { recursive: true });
const ONLY = argv.only ? String(argv.only).split(',') : null;
const ALLOW_IMAGES = !!argv.images;
const BLOCKED = ['*raw.githubusercontent.com*', '*fonts.googleapis.com*', '*fonts.gstatic.com*'];

/* ===== Bộ câu an toàn của code-reviewer (review lần 3–4): proto4 (37 phải khẩn + 35 không khẩn), safety3, safety4 =====
   Kỳ vọng: urgent | noturgent | human (thẻ cần người hỗ trợ) | nothuman | phys (loại bài nín thở).
   Có dấu * = GIỚI HẠN ĐÃ GHI ở mục 6.1 bản gộp (khái niệm mới chờ hội đồng, hoặc câu không dấu mơ hồ chấp nhận bắt nhầm):
   test khẳng định hành vi hiện tại để nếu đổi thì phải cập nhật 6.1. Sinh từ /tmp/claude-1000/rv-stop4p/s/ ngày 29/10/2026. */
const SAFETY_BANK = [["hom qua minh tu hai","urgent","proto4"],
  ["toi da tu hai","urgent","proto4"],
  ["minh hay tu hai","urgent","proto4"],
  ["nghi den chuyen tu hai","urgent","proto4"],
  ["co y nghi tu hai","urgent","proto4"],
  ["toi rach tay","urgent","proto4"],
  ["da rach tay roi","urgent","proto4"],
  ["lay dao rach tay","urgent","proto4"],
  ["minh muon tu hai","urgent","proto4"],
  ["toi muon rach tay","urgent","proto4"],
  ["tu hai ban than","urgent","proto4"],
  ["nghi toi tu hai minh","urgent","proto4"],
  ["minh da tu rach tay","urgent","proto4"],
  ["hom qua rach co tay","urgent","proto4"],
  ["muon tu hai.","urgent","proto4"],
  ["tu hai","urgent","proto4"],
  ["dang nghi den tu hai","urgent","proto4"],
  ["tu lam hai ban than","urgent","proto4"],
  ["muon cat tay","urgent","proto4"],
  ["toi muon cat co tay","urgent","proto4"],
  ["muon ket lieu ban than","urgent","proto4"],
  ["uong thuoc de chet","urgent","proto4"],
  ["muon bien mat mai mai","urgent","proto4"],
  ["khong con ly do song","urgent","proto4"],
  ["da tu hai 2 lan","urgent","proto4"],
  ["tu hai 3 lan roi","urgent","proto4"],
  ["tu hai ca dem","urgent","proto4"],
  ["toi tu hai toi qua","urgent","proto4"],
  ["tu hai den chay mau","urgent","proto4"],
  ["tu hai qua nhieu","urgent","proto4"],
  ["rạch cổ tay","urgent","proto4"],
  ["muốn rạch cổ tay","urgent","proto4"],
  ["cắt cổ tay","urgent","proto4"],
  ["tự cắt tay","urgent","proto4"],
  ["mình muốn rạch tay","urgent","proto4"],
  ["nghĩ đến chuyện tự hại","urgent","proto4"],
  ["muốn cắt tay","urgent","proto4"],
  ["Từ hai tuần nay mình khó ngủ","noturgent","proto4"],
  ["tu hai tuan nay kho ngu","noturgent","proto4"],
  ["da tu hai tuan nay minh kho ngu","noturgent","proto4"],
  ["tu hai gio sang da thuc","noturgent","proto4"],
  ["bi rach tay khi mo ong thuoc","noturgent","proto4"],
  ["mo ong thuoc bi rach tay minh","noturgent","proto4"],
  ["Đã từ hai tuần nay mình khó ngủ","noturgent","proto4"],
  ["mình muốn từ hai tuần sau nghỉ phép","noturgent","proto4"],
  ["nghĩ tới từ hai năm trước","noturgent","proto4"],
  ["từ hai đến ba ca một tuần","noturgent","proto4"],
  ["từ hai giờ sáng","noturgent","proto4"],
  ["mở ống thuốc bị rách cổ tay","noturgent","proto4"],
  ["rách tay khi mở ống","noturgent","proto4"],
  ["con từ hai tuổi","noturgent","proto4"],
  ["từ hai đứa nhỏ cùng ốm","noturgent","proto4"],
  ["bị rách tay áo","noturgent","proto4"],
  ["mình bị rách tay","noturgent","proto4"],
  ["Kết quả từ hai xét nghiệm đều ổn","noturgent","proto4"],
  ["Áp lực từ hai phía","noturgent","proto4"],
  ["mình nghe từ hai đồng nghiệp","noturgent","proto4"],
  ["nhận ca từ hai khoa","noturgent","proto4"],
  ["từ hai bên gia đình","noturgent","proto4"],
  ["từ hai bệnh viện chuyển về","noturgent","proto4"],
  ["từ hai, ba ngày nay mình mệt","noturgent","proto4"],
  ["học được từ hai chị điều dưỡng","noturgent","proto4"],
  ["lấy máu từ hai tay","noturgent","proto4"],
  ["mở ống thuốc rách tay","noturgent","proto4"],
  ["găng rách tay","noturgent","proto4"],
  ["mình lỡ cắt tay khi gọt táo","noturgent","proto4"],
  ["cắt tay áo cho bệnh nhân","noturgent","proto4"],
  ["mình bị cắt tay khi mở ống thuốc","noturgent","proto4"],
  ["cắt tay áo","noturgent","proto4"],
  ["tu hai den ba ca","noturgent","proto4"],
  ["tu hai nguoi","noturgent","proto4"],
  ["từ hai mình đã đi làm","noturgent","proto4"],
  ["nghi den tu hai","urgent","safety3"],
  ["muon rach co tay","urgent","safety3"],
  ["muon ket lieu doi minh","urgent","safety3"],
  ["toi muon tu tu","noturgent*","safety3"],
  ["khong muon song nua","urgent","safety3"],
  ["muon chet","urgent","safety3"],
  ["tu lam dau ban than","noturgent*","safety3"],
  ["muon lam dau ban than","noturgent*","safety3"],
  ["song khong co y nghia","noturgent*","safety3"],
  ["muon nhay lau","urgent","safety3"],
  ["muốn tự hại","urgent","safety3"],
  ["tự rạch tay","urgent","safety3"],
  ["tu hai gio sang da truc","noturgent","safety3"],
  ["bị rách tay khi mở ống thuốc","noturgent","safety3"],
  ["đã từ hai tuần nay mệt","noturgent","safety3"],
  ["căng thẳng kéo dài cả tháng","human","safety3"],
  ["stress kéo dài","human","safety3"],
  ["lo âu kéo dài","human","safety3"],
  ["buồn bã kéo dài","human","safety3"],
  ["tình trạng này kéo dài 3 tuần","human","safety3"],
  ["bi bao hanh","human","safety3"],
  ["khong thiet song nua","human","safety3"],
  ["mệt mỏi kéo dài","human","safety3"],
  ["kéo dài mấy tháng nay","human","safety3"],
  ["cang thang keo dai","human","safety3"],
  ["ap luc keo dai","human","safety3"],
  ["áp lực kéo dài","human","safety3"],
  ["mất ngủ kéo dài nhiều tuần","human","safety3"],
  ["chán kéo dài","human","safety3"],
  ["căng thẳng cứ kéo dài","human","safety3"],
  ["tình trạng mệt kéo dài","human","safety3"],
  ["kéo dài hơn một tháng","human","safety3"],
  ["Ca mổ kéo dài 5 tiếng","nothuman","safety3"],
  ["Ca mổ kéo dài năm tiếng","nothuman","safety3"],
  ["ca mổ kéo dài gần năm tiếng","nothuman","safety3"],
  ["ca trực kéo dài tới năm giờ sáng","nothuman","safety3"],
  ["buổi họp kéo dài thẳng tới trưa","nothuman","safety3"],
  ["hàng chờ kéo dài đến tận năm giờ","nothuman","safety3"],
  ["kéo dài thẳng","nothuman","safety3"],
  ["tình trạng bệnh nhân kéo dài","nothuman","safety3"],
  ["tình trạng này kéo dài thì nguy cho bệnh nhân","human*","safety3"],
  ["dây truyền căng kéo dài","human*","safety3"],
  ["cơn đau kéo dài 2 giờ","nothuman","safety3"],
  ["cuộc gọi kéo dài 3 phút","nothuman","safety3"],
  ["mang đi bảo hành","nothuman","safety3"],
  ["không thiệt gì","nothuman","safety3"],
  ["lo kéo dài thời gian","nothuman","safety3"],
  ["cảm giác kéo dài thời gian","nothuman","safety3"],
  ["kéo dài đến năm sau mới xong hồ sơ","human*","safety3"],
  ["kéo dài sang tháng sau","nothuman","safety3"],
  ["hợp đồng kéo dài 2 năm","human*","safety3"],
  ["Chiều nay hội họp","nothuman","safety3"],
  ["tim hoi hop qua","phys","safety3"],
  ["tim hồi hộp","phys","safety3"],
  ["hội họp","phys","safety3"],
  ["từ hai ba hôm nay","noturgent","safety4"],
  ["từ hai bác sĩ trực","noturgent","safety4"],
  ["cách nhau từ hai mét","noturgent","safety4"],
  ["từ hai mẹ con","noturgent","safety4"],
  ["từ hai ống thuốc","noturgent","safety4"],
  ["đi từ hai nơi","noturgent","safety4"],
  ["từ hai đứa","noturgent","safety4"],
  ["Từ hai hôm nay","noturgent","safety4"],
  ["tính từ hai lần trước","noturgent","safety4"],
  ["rách tay rồi, băng lại","noturgent","safety4"],
  ["ống thuốc làm rách tay","noturgent","safety4"],
  ["dao mổ cắt tay mình","urgent*","safety4"],
  ["đứt tay khi mở ống","noturgent","safety4"],
  ["ket qua tu hai xet nghiem","urgent*","safety4"],
  ["ap luc tu hai phia","urgent*","safety4"],
  ["tu hai ba hom nay", "noturgent", "safety4 + lượt 6 (anh quyết)"],
  ["mo ong thuoc rach tay","urgent*","safety4"],
  ["rach tay roi bang lai","urgent*","safety4"],
  ["minh lo cat tay khi got tao","noturgent","safety4"],
  ["cat tay ao cho benh nhan","noturgent","safety4"],
  ["gang rach tay","urgent*","safety4"],
  ["cat tay ao","noturgent","safety4"],
  ["cứa tay","noturgent*","safety4"],
  ["cứa cổ tay","noturgent*","safety4"],
  ["tự tữ","urgent","safety4"],
  ["tựtử","urgent","safety4"],
  ["muốn tự hại bản thân","urgent","safety4"],
  ["tự làm đau mình","noturgent*","safety4"],
  ["mún chết","urgent","safety4"],
  ["muốn chít","urgent","safety4"],
  ["muốn die","urgent","safety4"],
  ["ko muốn sống nữa","urgent","safety4"],
  ["k muốn sống","urgent","safety4"],
  ["hok muốn sống nữa","urgent","safety4"],
  ["không muốn sống nữa","urgent","safety4"],
  ["chán sống","noturgent*","safety4"],
  ["hết muốn sống","noturgent*","safety4"],
  ["nghĩ đến cái chết","noturgent*","safety4"],
  ["mun chet","urgent","safety4"],
  ["muon chit","urgent","safety4"],
  ["muon die","urgent","safety4"],
  ["ko muon song nua","urgent","safety4"],
  ["k muon song","urgent","safety4"],
  ["hok muon song nua","urgent","safety4"],
  ["kh muon song","urgent","safety4"],
  ["khg muon song","urgent","safety4"],
  ["tu tu","noturgent*","safety4"],
  ["muon tu tu","noturgent*","safety4"],
  ["cua tay","noturgent*","safety4"],
  ["cua co tay","noturgent*","safety4"],
  ["tu cat tay","urgent","safety4"],
  ["tu rach","noturgent*","safety4"],
  ["rach tay","urgent","safety4"],
  ["cat tay","urgent","safety4"],
  ["rach co tay","urgent","safety4"],
  ["muon rach tay minh","urgent","safety4"],
  ["minh tu hai","urgent","safety4"],
  ["ts","noturgent*","safety4"],
  ["tu hai a","urgent","safety4"],
  ["tu hai di","urgent","safety4"],
  ["tu hai thoi","urgent","safety4"],
  ["tu hai hoai","urgent","safety4"],
  ["tu hai nhieu lan","urgent","safety4"],
  // thêm ở lượt sửa 4 (G-1): teen code không được tạo bắt nhầm mới
  ["nặn mụn chết","noturgent","G-1"], ["pin die rồi","noturgent","G-1"], ["đau hông muốn nằm","noturgent","G-1"], ["ko muốn đi làm","noturgent","G-1"], ["k biết nữa","noturgent","G-1"],
  ["mún chết","urgent","G-1"], ["hông muốn sống","urgent","G-1"], ["tựtử","urgent","G-1"],
  // thêm ở lượt sửa 5 (review lần 5): 7 câu K-2 'tự hại + trạng từ thời gian', câu proto5, toàn bộ safety5
  ["tu hai hom qua","urgent","K-2 lần 5"],
  ["tu hai dem qua","urgent","K-2 lần 5"],
  ["tu hai chieu qua","urgent","K-2 lần 5"],
  ["tu hai sang nay","urgent","K-2 lần 5"],
  ["tu hai nam ngoai","urgent","K-2 lần 5"],
  ["minh tu hai ca tuan","urgent","K-2 lần 5"],
  ["tu hai ca ngay","urgent","K-2 lần 5"],
  ["tu hai toi nay","urgent","proto5"],
  ["tu hai toi qua","urgent","proto5"],
  ["tu hai dua nho","noturgent","proto5"],
  ["tu hai lan truoc","noturgent","proto5"],
  ["tu hai nguoi nha","noturgent","proto5"],
  ["tu hai tuan nay","noturgent","proto5"],
  ["tu hai hom nay", "urgent", "proto5 + lượt 6 (anh quyết)"],
  ["tu hai ngay nay","noturgent","proto5"],
  ["tu hai thang nay","noturgent","proto5"],
  ["tu hai nam nay","noturgent","proto5"],
  ["tu hai ca truc","noturgent","proto5"],
  ["tu hai dem nay", "urgent", "proto5 + lượt 6 (anh quyết)"],
  ["tu hai sang", "urgent", "proto5 + lượt 6 (anh quyết)"],
  ["tu hai thang truoc", "noturgent", "proto5 + lượt 6 (anh quyết)"],
  ["tu hai nam truoc", "noturgent", "proto5 + lượt 6 (anh quyết)"],
  ["kh muốn sống","urgent","safety5"],
  ["khg muốn sống","urgent","safety5"],
  ["hong muon song","urgent","safety5"],
  ["hk muon song","urgent","safety5"],
  ["KO MUỐN SỐNG","urgent","safety5"],
  ["mệt muốn die","urgent","safety5"],
  ["nghĩ đến tự tữ","urgent","safety5"],
  ["k còn lý do để sống","urgent","safety5"],
  ["ko con ly do song","urgent","safety5"],
  ["die cho xong","urgent","safety5"],
  ["chit cho xong","urgent","safety5"],
  ["k muốn sống nữa đâu","urgent","safety5"],
  ["kg muốn sống","noturgent*","safety5"],
  ["khum muốn sống","noturgent*","safety5"],
  ["hem muốn sống","noturgent*","safety5"],
  ["hổng muốn sống","noturgent*","safety5"],
  ["hong mun song","urgent","safety5"],
  ["ko mun song","urgent","safety5"],
  ["muốn chớt","noturgent*","safety5"],
  ["muốn dieee","noturgent*","safety5"],
  ["muốn đi chết","noturgent*","safety5"],
  ["tự tửa","noturgent*","safety5"],
  ["tu tu sat","urgent","safety5"],
  ["tự sát","urgent","safety5"],
  ["muốn tự tử","urgent","safety5"],
  ["tutu","noturgent*","safety5"],
  ["k muốn đi làm","noturgent","safety5"],
  ["ko muốn ăn","noturgent","safety5"],
  ["hông muốn nói chuyện","noturgent","safety5"],
  ["mún về nhà","noturgent","safety5"],
  ["muốn chít khăn","urgent*","safety5"],
  ["muon chit chat","urgent*","safety5"],
  ["bệnh nhân die rồi","noturgent","safety5"],
  ["máy die rồi","noturgent","safety5"],
  ["điện thoại die","noturgent","safety5"],
  ["pin die","noturgent","safety5"],
  ["k muốn sống chung với mẹ chồng","urgent*","safety5"],
  ["ko muốn sống ở thành phố này","urgent*","safety5"],
  ["không muốn sống ở đây nữa","urgent*","safety5"],
  ["nan mun chet","urgent*","safety5"],
  ["mụn chết","noturgent","safety5"],
  ["đau hông","noturgent","safety5"],
  ["hong may","noturgent","safety5"],
  ["may hong roi","noturgent","safety5"],
  ["k muốn sống như vậy","urgent","safety5"],
  ["vitamin K muốn","noturgent","safety5"],
  ["5k muốn","noturgent","safety5"],
  ["hk muốn ăn","noturgent","safety5"],
  ["die hard","noturgent","safety5"],
  ["constructor","noturgent","safety5"],
  ["toString valueOf","noturgent","safety5"],
  ["cắt tay","urgent*","safety5"],
  ["rạch tay","urgent","safety5"],
  ["tự cắt tay mình","urgent","safety5"],
  ["lỡ tay cắt vào ngón","noturgent","safety5"],
  ["cắt móng tay","noturgent","safety5"],
  ["cắt tay chân","urgent*","safety5"],
  ["chặt tay","noturgent","safety5"],
  ["rạch tay áo","noturgent","safety5"],
  ["muốn rạch tay","urgent","safety5"],
  ["mình đã rạch tay","urgent","safety5"],
  ["lấy dao cắt tay","urgent","safety5"],
  ["mình cắt tay rồi","urgent","safety5"],
  ["cắt tay cho đỡ đau","urgent","safety5"],
  ["rạch tay cho nhẹ lòng","urgent","safety5"],
  ["mình hay cắt tay","urgent","safety5"],
  ["tôi rạch tay mình","urgent","safety5"],
  ["cắt cổ tay mình","urgent","safety5"],
  ["tu hai lan nua","urgent","safety5"],
  ["tu hai hai lan","urgent","safety5"],
  ["tu hai 2 lan","urgent","safety5"],
  ["tu hai mot lan","urgent","safety5"],
  ["tu hai suot dem","urgent","safety5"],
  ["tu hai moi ngay","urgent","safety5"],
  ["tu hai tuan truoc", "noturgent", "safety5 + lượt 6 (anh quyết)"],
  ["tu hai luc 2 gio sang","urgent","safety5"],
  ["tu hai gio sang","noturgent","safety5"],
  ["bi rach tay","noturgent","safety5"],
  ["rach tay khi mo ong","noturgent","safety5"],
  ["cat mong tay","noturgent","safety5"],
  // lượt sửa 6 (anh Thông quyết 29/10/2026): "bắt '… nay' gần, bỏ qua khứ" — chỉ với chữ gõ không dấu
  ["tu hai sang.", "urgent", "lượt 6 (anh quyết)"],
  ["minh muon tu hai sang!", "urgent", "lượt 6 (anh quyết)"],
  ["tu hai sang, roi di lam", "urgent", "lượt 6 (anh quyết)"],
  ["minh tu hai dem nay", "urgent", "lượt 6 (anh quyết)"],
  ["chac tu hai toi nay", "urgent", "lượt 6 (anh quyết)"],
  ["toi se tu hai hom nay", "urgent", "lượt 6 (anh quyết)"],
  ["minh tu hai hom nay roi", "urgent", "lượt 6 (anh quyết)"],
  ["minh tu hai sang nay", "urgent", "lượt 6 (anh quyết)"],
  ["tu hai, ba hom nay", "noturgent", "lượt 6 (anh quyết)"],
  ["tu hai ba ngay nay", "noturgent", "lượt 6 (anh quyết)"],
  ["tu hai sang roi", "noturgent", "lượt 6 (anh quyết)"],
  ["tu hai, ba ngay nay minh met", "noturgent", "lượt 6 (anh quyết)"],
  ["từ hai hôm nay", "noturgent", "lượt 6 (anh quyết)"],
  ["từ hai đêm nay", "noturgent", "lượt 6 (anh quyết)"],
  ["Từ hai hôm nay mình mệt", "noturgent", "lượt 6 (anh quyết)"],
  ["từ hai sáng", "noturgent", "lượt 6 (anh quyết)"],
  ["từ hai tối nay mới rảnh", "noturgent", "lượt 6 (anh quyết)"],
  // lượt sửa 7 (review lần 6): K-3 chữ số không được miễn, R-3 dấu phẩy trước từ loại trừ, toàn bộ safety6
  ["da tu hai 3 dem lien","urgent","K-3/R-3 lượt 7"],
  ["tu hai 2 ngay lien","urgent","K-3/R-3 lượt 7"],
  ["tu hai 3 hom nay","urgent","K-3/R-3 lượt 7"],
  ["toi tu hai 2 tuan nay","urgent","K-3/R-3 lượt 7"],
  ["muon rach tay, khong ai biet","urgent","K-3/R-3 lượt 7"],
  ["toi cat tay, roi ngoi khoc","urgent","K-3/R-3 lượt 7"],
  ["minh rach co tay, dau lam","urgent","K-3/R-3 lượt 7"],
  ["cat tay, luc got tao","noturgent","R-3 lượt 7"],
  ["rach tay, khi mo ong thuoc","noturgent","R-3 lượt 7"],
  ["minh tu hai hom nay","urgent","safety6"],
  ["toi muon tu hai dem nay","urgent","safety6"],
  ["minh tu hai sang!","urgent","safety6"],
  ["Tu Hai Hom Nay","urgent","safety6"],
  ["TU HAI DEM NAY","urgent","safety6"],
  ["tu hai hom truoc","noturgent","safety6"],
  ["tu hai dem truoc","noturgent","safety6"],
  ["tu hai sang mai","noturgent","safety6"],
  ["tu hai 1 lan","urgent","safety6"],
  ["tu hai mot ngay","noturgent*","safety6"],
  ["tu hai, minh met qua","urgent","safety6"],
  ["tu hai...","urgent","safety6"],
  ["tu hai!!","urgent","safety6"],
  ["tu hai?","urgent","safety6"],
  ["tu hai;","urgent","safety6"],
  ["minh muon tu hai, khong ai hieu","urgent","safety6"],
  ["tu hai cho do dau","urgent","safety6"],
  ["tu hai bang dao","urgent","safety6"],
  ["tu hai luc nua dem","urgent","safety6"],
  ["tu hai ngay qua","urgent","safety6"],
  ["tu hai trua nay","urgent","safety6"],
  ["tu hai chieu nay","urgent","safety6"],
  ["minh tu hai ca dem qua","urgent","safety6"],
  ["muon tu hai.Mai lai di lam","urgent","safety6"],
  ["tu hai den 3 ca","noturgent","safety6"],
  ["tu hai gio, mai lai","noturgent","safety6"],
  ["tu hai - ba ngay","noturgent","safety6"],
  ["tu hai/ba ngay","noturgent","safety6"],
  ["tu hai,ba hom nay","noturgent","safety6"],
  ["tu hai . tuan nay","urgent*","safety6"],
  ["bi rach tay, khi mo ong thuoc","noturgent","safety6"],
  ["cat tay ao, roi","noturgent","safety6"],
  ["tu hai buoi chieu","noturgent","safety6"],
  ["tu hai buoi sang","noturgent","safety6"],
  ["tu hai muoi gio","noturgent","safety6"],
  ["Từ hai sáng","noturgent","safety6"],
  ["tự hại hôm nay","urgent","safety6"],
  ["tự hại","urgent","safety6"],
  ["mình tự hại sáng nay","urgent","safety6"],
  ["rạch tay, khi mở ống thuốc","noturgent","safety6"],
  ["cắt tay, lúc gọt táo","noturgent","safety6"],
  ["mình bị cắt tay","noturgent","safety6"],
  ["rạch cổ tay.","urgent","safety6"],
  ["Áp lực từ hai phía.","noturgent","safety6"],
  // sau review lần 7 (G-g): chấm phẩy / ba chấm ngay sau từ gốc tính là cuối câu — giới hạn đã biết, chấp nhận
  ["cat tay; luc got tao","urgent*","G-g lần 7"],
  ["cat tay... luc got tao","urgent*","G-g lần 7"],
  ["toi rach tay. luc do dau lam","urgent","G-g lần 7"]];


/* ===== Ghi kết quả ===== */
const results = [];
const knownLimits = []; // câu "giới hạn đã biết" của SAFETY_BANK, báo riêng, không tính vào số xanh
let scenario = '';
let fails = 0;
function check(name, ok, detail) {
  results.push({ scenario, name, ok: !!ok, detail: detail == null ? '' : String(detail).slice(0, 400) });
  if (!ok) fails++;
  console.log((ok ? '  ok   ' : '  FAIL ') + name + (detail && !ok ? '  → ' + String(detail).slice(0, 300) : ''));
}
function eq(name, actual, expected) { check(name, actual === expected, 'thực tế=' + JSON.stringify(actual) + ' kỳ vọng=' + JSON.stringify(expected)); }
function has(name, text, needle) { check(name, String(text || '').includes(needle), 'không thấy "' + needle + '" trong: ' + String(text || '').slice(0, 200)); }

/* ===== Nhật ký console / mạng của trang ===== */
const consoleLog = [];   // lỗi + cảnh báo JS
const httpErrors = [];   // 4xx/5xx
const reqUrl = new Map();
const isBlockedUrl = u => /raw\.githubusercontent\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u || '');
function wireLogs(page) {
  page.on('Runtime.consoleAPICalled', p => {
    if (p.type === 'error' || p.type === 'warning') consoleLog.push({ scenario, kind: 'console.' + p.type, text: p.args.map(a => a.value || a.description || '').join(' ') });
  });
  page.on('Runtime.exceptionThrown', p => consoleLog.push({ scenario, kind: 'exception', text: (p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text }));
  page.on('Log.entryAdded', p => {
    const e = p.entry;
    if ((e.level === 'error' || e.level === 'warning') && !isBlockedUrl(e.url) && !/raw\.githubusercontent|fonts\.g/.test(e.text || '')) consoleLog.push({ scenario, kind: 'log.' + e.level, text: e.text + ' ' + (e.url || '') });
  });
  page.on('Network.requestWillBeSent', p => reqUrl.set(p.requestId, p.request.url));
  page.on('Network.responseReceived', p => { if (p.response.status >= 400) httpErrors.push({ scenario, status: p.response.status, url: p.response.url }); });
  page.on('Network.loadingFailed', p => { const u = reqUrl.get(p.requestId) || ''; if (!p.blockedReason && !isBlockedUrl(u)) httpErrors.push({ scenario, status: 'FAIL ' + p.errorText, url: u }); });
}

/* ===== Trợ giúp thao tác ===== */
let page = null;
const ev = expr => page.evaluate(expr);
const J = v => JSON.stringify(v);
const screen = () => ev(`document.querySelector('#main').dataset.screen`);
const text = sel => ev(`(document.querySelector(${J(sel)}) || {}).textContent`);
const exists = sel => ev(`!!document.querySelector(${J(sel)})`);
const count = sel => ev(`document.querySelectorAll(${J(sel)}).length`);
const visible = sel => ev(`(() => { const el = document.querySelector(${J(sel)}); if (!el) return false; if (el.hidden || el.closest('[hidden]')) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })()`);
const toast = () => ev(`(document.querySelector('#toast.show') || {}).textContent || ''`);
const stack = () => ev(`STOP4P_APP.state.stack.map(s => s.name)`);
async function waitFor(expr, ms = 4000, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await sleep(80); }
  throw new Error('hết giờ chờ ' + (label || expr));
}
/* chờ mọi cuộn (cuộn mượt của app, scroll-snap của bản đồ chặng) dừng hẳn trước khi lấy tọa độ */
async function settleScroll() {
  let prev = null;
  for (let i = 0; i < 25; i++) {
    const cur = await ev(`[scrollX, scrollY].concat([...document.querySelectorAll('.s4-map, .st-map')].map(m => m.scrollLeft)).join(',')`);
    if (cur === prev) return; prev = cur; await sleep(120);
  }
}
/* click bằng chuột thật vào phần tử theo selector; nếu phần tử nằm trong menu đóng thì dùng el.click().
   Nút trên bản đồ chặng (scroll-snap) click bằng el.click() vì tọa độ sau snap không ổn định trong headless. */
async function click(sel) {
  await ev(`(() => { const el = document.querySelector(${J(sel)}); if (!el) throw new Error('không thấy ' + ${J(sel)}); })()`);
  if ((await screen()) === 'player') await settleScroll();
  if (/map/.test(sel)) { await ev(`document.querySelector(${J(sel)}).click()`); await sleep(150); await settleScroll(); return; }
  try { await page.click(sel); } catch (e) { await ev(`document.querySelector(${J(sel)}).click()`); }
  await sleep(120);
}
/* click nút theo chữ hiển thị (trong #main hoặc #header) */
async function clickText(t, root = '#main') {
  const ok = await ev(`(() => { const els = [...document.querySelectorAll(${J(root)} + ' button, ' + ${J(root)} + ' a, ' + ${J(root)} + ' summary')];
    const el = els.find(b => b.textContent.replace(/\\s+/g, ' ').trim().includes(${J(t)})); if (!el) return false; el.setAttribute('data-qa', 't'); return true; })()`);
  if (!ok) throw new Error('không thấy nút "' + t + '"');
  await click('[data-qa="t"]');
  await ev(`document.querySelectorAll('[data-qa="t"]').forEach(e => e.removeAttribute('data-qa'))`);
}
async function setRange(sel, v) { await ev(`(() => { const el = document.querySelector(${J(sel)}); el.value = ${v}; el.dispatchEvent(new Event('input', { bubbles: true })); })()`); await sleep(60); }
async function typeInto(sel, t) {
  await ev(`(() => { const el = document.querySelector(${J(sel)}); el.focus(); el.select && el.select(); })()`);
  await page.type(t);
  await sleep(80);
}
async function clearInput(sel) { await ev(`(() => { const el = document.querySelector(${J(sel)}); el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); })()`); }
async function hold(sel, ms) {
  await settleScroll(); // app cuộn mượt (scrollIntoView smooth) khi đổi chặng → chờ xong mới lấy tọa độ
  const { x, y } = await page.center(sel);
  await settleScroll();
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(ms);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(100);
}
let shotN = 0;
async function shot(name, full) {
  const file = path.join(SHOTS, String(++shotN).padStart(2, '0') + '-' + scenario + '-' + name + '.png');
  try { await page.screenshot(file, full); } catch (e) { console.log('  (không chụp được ' + name + ': ' + e.message + ')'); }
  return file;
}
/* Mỗi màn (trừ support) phải có nút Hỗ trợ ở header */
async function expectScreen(name, label) {
  const s = await screen();
  eq((label || 'màn') + ' = ' + name, s, name);
  if (s !== 'support') check('có nút Hỗ trợ ở header (' + s + ')', await exists('#header .pill-support'));
}
async function fresh(width = 375, height = 812) {
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
  await page.send('Network.clearBrowserCache');
  await page.navigate(APP_URL);
  await ev(`(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} })()`);
  await page.navigate(APP_URL);
  await waitFor(`!!window.STOP4P_APP && document.querySelector('#main').dataset.screen`, 8000, 'app khởi động');
}
/* Tỉ lệ tương phản WCAG giữa hai màu CSS (rgb/rgba hoặc #hex), tính ngay trong trang */
const CONTRAST_JS = `(() => { const toRGB = c => { c = String(c).trim(); if (c[0] === '#') { const h = c.slice(1); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); } return c.match(/[\\d.]+/g).slice(0, 3).map(Number); };
  const lum = c => { const v = toRGB(c).map(x => x / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  window.__ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100; }; })()`;
const storageKeys = () => ev(`({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })`);

/* ===== Đi qua check-in nhanh (từ pause5) ===== */
async function goPause5FromHome() {
  await clickText('Bắt đầu DỪNG 5');
  await expectScreen('pause5');
}
async function fillCheckin(o = {}) {
  await expectScreen('checkin');
  for (const e of o.emotions || []) await click(`[data-chip="emotions"][data-code="${e}"]`);
  if (o.distress != null) await setRange('#distress', o.distress);
  if (o.text != null) { await clearInput('#narr'); if (o.text) await typeInto('#narr', o.text); }
  for (const c of o.contexts || []) await click(`[data-chip="contexts"][data-code="${c}"]`);
  if (o.minutes) await click(`[data-chip="minutes"][data-code="${o.minutes}"]`);
  if (o.focus) await click('#focus');
}
async function submitCheckin() { await clickText('Xem gợi ý cho tôi'); await sleep(250); }
const suggestionIds = () => ev(`[...document.querySelectorAll('#main .ex-list [data-act=startEx]')].map(b => b.dataset.id)`);

/* ===== Kiểm tra chung trên màn trình phát ===== */
async function checkPlayerChrome(id) {
  await expectScreen('player', id);
  has(id + ': h1 đúng tên bài', await text('#main h1'), await ev(`STOP4P_DATA.EXERCISES[${J(id)}].title`));
  check(id + ': có nút "Trở về thở tự nhiên"', await exists('#main [data-act=natural]'));
  check(id + ': có nút "Kết thúc → Check-out"', await exists('#main .player-foot [data-act=finishExercise]'));
  check(id + ': có dòng an toàn chung', await exists('#main .safety-line'));
  if (id !== 'STOP4P_FULL') check(id + ': có dòng an toàn riêng của bài', await exists('#main .ex-safety'));
  // Trở về thở tự nhiên → lớp phủ hiện, quay lại được
  await click('#main [data-act=natural]');
  check(id + ': lớp phủ thở tự nhiên hiện', await visible('#natural'));
  has(id + ': lớp phủ có "Tìm hỗ trợ"', await text('#natural'), 'Tìm hỗ trợ');
  check(id + ': lớp phủ là role=dialog aria-modal (T-22)', await ev(`(() => { const n = document.querySelector('#natural'); return n.getAttribute('role') === 'dialog' && n.getAttribute('aria-modal') === 'true' && n.getAttribute('aria-labelledby') === 'natural-title'; })()`));
  eq(id + ': mở lớp phủ → focus vào tiêu đề (T-22)', await ev(`document.activeElement && document.activeElement.id`), 'natural-title');
  check(id + ': lớp phủ mở → header, thân bài, chân trang là inert (G-06)', await ev(`document.querySelector('#header').inert && document.querySelector('#player-body').inert && document.querySelector('.player-foot').inert && !document.querySelector('#natural').inert`));
  if (id === 'STOP_PAUSE' || id === 'STOP4P_FULL') {
    await page.key('Escape'); await sleep(120);
    check(id + ': Esc đóng lớp phủ (T-22)', !(await visible('#natural')));
    check(id + ': đóng lớp phủ → gỡ inert (G-06)', await ev(`!document.querySelector('#header').inert && !document.querySelector('#player-body').inert`));
    check(id + ': đóng xong focus về nút "Trở về thở tự nhiên" (T-22)', await ev(`document.activeElement && document.activeElement.dataset.act === 'natural'`));
  } else {
    await click('#natural [data-act=closeNatural]');
    check(id + ': đóng lớp phủ được', !(await visible('#natural')));
  }
}
async function finishViaCheckout(after, fit) {
  if ((await screen()) === 'player') await clickText('Kết thúc → Check-out', '#main .player-foot');
  await expectScreen('checkout');
  if (after != null) await setRange('#after', after);
  if (fit) await click(`[data-chip="fit"][data-code="${fit}"]`);
  await clickText('Xong ✓');
  await expectScreen('done');
}

/* =========================================================
   Kịch bản 1: ẩn danh — chào → DỪNG 5 → check-in → gợi ý → 13 mục thư viện → check-out → hoàn tất
   ========================================================= */
async function scGuest() {
  await fresh();
  await expectScreen('welcome');
  has('welcome: tiêu đề DỪNG 5', await text('#main h1'), 'DỪNG 5');
  check('welcome: hai lựa chọn ngang cấp', (await exists('[data-act=startGuest]')) && (await exists('[data-go=login]')));
  check('welcome: có dòng "không phải công cụ chẩn đoán"', (await text('#main .draft-note') || '').includes('chẩn đoán'));
  await shot('welcome');

  await click('[data-act=startGuest]');
  await expectScreen('profile');
  check('profile (ẩn danh): có nút Bỏ qua', await exists('[data-act=skipProfile]'));
  has('header: dải "Ẩn danh"', await text('#header .mode-strip'), 'Ẩn danh');
  await click('[data-act=skipProfile]');

  await expectScreen('pause5');
  const t0 = await text('#pause-btn');
  eq('pause5: lúc đầu nút là "Bỏ qua"', t0.trim(), 'Bỏ qua');
  check('pause5: nút lúc đầu là soft', await ev(`document.querySelector('#pause-btn').classList.contains('soft')`));
  await sleep(2500);
  eq('pause5: sau 2,5 s vẫn là "Bỏ qua"', (await text('#pause-btn')).trim(), 'Bỏ qua');
  await shot('pause5');
  await sleep(2900);
  eq('pause5: sau 5 s đổi thành "Tiếp tục check-in ›"', (await text('#pause-btn')).trim(), 'Tiếp tục check-in ›');
  check('pause5: nút thành primary', await ev(`document.querySelector('#pause-btn').classList.contains('primary')`));
  await click('#pause-btn');

  await expectScreen('checkin');
  eq('checkin: 7 ô cảm xúc', await count('#main .emo'), 7);
  eq('checkin: ảnh bị chặn → 7 emoji dự phòng', await count('#main .emo .emoji-fallback'), ALLOW_IMAGES ? 2 : 7);
  eq('checkin: 9 chip tình huống (thêm Giữa 2 ca, Sau khi ăn)', await count('[data-chip="contexts"]'), 9);
  eq('checkin: 5 chip phút', await count('[data-chip="minutes"]'), 5);
  has('checkin: thanh trượt chưa chọn', await text('#main .distress-value'), 'Chưa chọn');
  check('checkin: có "Bỏ qua, tôi tự chọn trong thư viện"', await exists('#main [data-go=library]'));
  has('checkin: ghi chú ẩn danh không lưu', await text('#main .fine'), 'không được lưu');
  // thanh trượt bằng bàn phím
  await ev(`document.querySelector('#distress').focus()`);
  await page.key('ArrowRight');
  has('checkin: ArrowRight → 6 · Khá khó chịu', await text('#main .distress-value'), '6 · Khá khó chịu');
  check('checkin: aria-valuetext cập nhật', (await ev(`document.querySelector('#distress').getAttribute('aria-valuetext')`)) === '6 — Khá khó chịu');
  await fillCheckin({ emotions: ['worried', 'tired'], text: 'Sắp tư vấn một ca khó, mình thấy lo', contexts: ['before_difficult_task'], minutes: 3 });
  eq('checkin: đếm ký tự', (await text('#narr-count')).trim(), '35');
  check('checkin: chip cảm xúc aria-pressed', await ev(`document.querySelector('[data-chip="emotions"][data-code="worried"]').getAttribute('aria-pressed') === 'true'`));
  await shot('checkin', true);
  await submitCheckin();

  await expectScreen('result');
  const ids = await suggestionIds();
  check('result: tối đa 2 gợi ý', ids.length >= 1 && ids.length <= 2, ids);
  check('result: không gợi ý bài nín thở khi chưa cần (ưu tiên STOP_PAUSE/BREATHE_46)', ids[0] === 'STOP_PAUSE' || ids[0] === 'BREATHE_46', ids);
  has('result: nhãn "không phải chẩn đoán"', await text('#main .tag'), 'không phải chẩn đoán');
  check('result: có "Tôi cần người hỗ trợ"', await ev(`[...document.querySelectorAll('#main [data-go=support]')].some(b => b.textContent.includes('Tôi cần người hỗ trợ'))`));
  check('result: thẻ bài có dòng an toàn', (await count('#main .ex-safety')) === ids.length);
  check('result: có "Nội dung 0.1-draft · Chờ hội đồng…"', (await text('#main .ex-version') || '').includes('Chờ hội đồng'));
  await shot('result', true);
  // đổi gợi ý
  await clickText('đổi gợi ý');
  const ids2 = await suggestionIds();
  check('result: "đổi gợi ý" ra bộ khác', JSON.stringify(ids2) !== JSON.stringify(ids), ids2);
  // sửa nhãn
  await click('#main .edit-labels summary');
  await click('#main .edit-labels [data-chip="contexts"][data-code="sleep"]');
  await clickText('Cập nhật gợi ý');
  has('result: toast sau sửa nhãn', await toast(), 'Đã cập nhật gợi ý');
  const ids3 = await suggestionIds();
  check('result: sửa nhãn "Khó ngủ" → gợi ý nhóm ngủ (PMR/4 trạm/nhật ký/âm thanh/thở 4-6)', ids3.every(i => ['PMR_SHORT', 'RELAX_4STATIONS', 'JOURNAL', 'AUDIO_CALM', 'BREATHE_46'].includes(i)), ids3);
  has('result: ghi chú "không phải cách điều trị mất ngủ"', await text('#main .notes'), 'mất ngủ');

  /* ---- Mở từng mục trong thư viện ---- */
  await clickText('Xem cả thư viện');
  await expectScreen('library');
  const all = await ev(`Object.keys(STOP4P_DATA.EXERCISES)`);
  eq('library: số mục trong EXERCISES (13 + 2 bài ngồi)', all.length, 15);
  eq('library: số thẻ bài hiển thị', await count('#main .ex-card'), 15);
  await shot('library', true);

  const simple = ['STOP_PAUSE', 'BREATHE_46', 'BOX_4444', 'BREATHE_478', 'HUM', 'GROUND_54321', 'PMR_SHORT', 'JOURNAL', 'GRATITUDE_3', 'AUDIO_CALM', 'MICRO_RECOVERY'];
  for (const id of simple) {
    if ((await screen()) !== 'library') { await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150); }
    await click(`#main [data-act=startEx][data-id="${id}"]`);
    await checkPlayerChrome(id);
    await runExercise(id);
    await shot('player-' + id, true);
    // Kết thúc → check-out → hoàn tất (lần đầu chụp; các lần sau chỉ đi qua)
    await finishViaCheckout(id === 'STOP_PAUSE' ? 3 : null, id === 'STOP_PAUSE' ? 'fit' : null);
    if (id === 'STOP_PAUSE') {
      has('done: hiện Trước 6 → Sau 3', await text('#main .delta'), 'Trước: 6 → Sau: 3');
      has('done: phiên ẩn danh không lưu', await text('#main .guest-save'), 'Phiên ẩn danh không được lưu');
      check('done: có nút lưu bằng SĐT', await exists('[data-act=saveAsMember]'));
      await shot('done', true);
    }
  }
  // về trang chính, xóa dữ liệu tạm
  await clickText('Kết thúc & xóa dữ liệu tạm');
  await expectScreen('home');
  has('home: toast xóa dữ liệu tạm', await toast(), 'Đã xóa dữ liệu tạm');
  const ks = await storageKeys();
  eq('ẩn danh: localStorage trống sau khi dùng', ks.local.length, 0);
  eq('ẩn danh: sessionStorage trống sau khi dùng', ks.session.length, 0);
  check('ẩn danh: state check-in đã reset', await ev(`STOP4P_APP.state.checkin.distress === null && STOP4P_APP.state.session.exercises.length === 0`));
  await shot('home', true);

  // Kết thúc phiên ẩn danh qua menu
  await ev(`document.querySelector('#header [data-act=endGuest]').click()`);
  await sleep(150);
  await expectScreen('welcome');
  has('menu: toast kết thúc phiên ẩn danh', await toast(), 'Đã kết thúc phiên ẩn danh');

  // Trang hỗ trợ và quyền riêng tư
  await click('#header .pill-support');
  await expectScreen('support');
  check('support: có link tel:115', await exists('#main a[href="tel:115"]'));
  has('support: kênh cơ sở chưa có → lời thường (T-18)', await text('#main'), 'Cơ sở chưa công bố kênh hỗ trợ');
  check('support: không còn câu kỹ thuật "đơn vị triển khai" / "SUPPORT_CHANNELS" (T-18)', !/đơn vị triển khai chưa cấu hình|SUPPORT_CHANNELS|js\/config\.js/.test(await text('#main')));
  has('support: mệt ảnh hưởng người bệnh', await text('#main'), 'Mệt mỏi đang ảnh hưởng');
  await shot('support', true);
  await ev(`document.querySelector('#header [data-go=about]').click()`); await sleep(150);
  await expectScreen('about');
  check('about: không còn nhắc "Giọng đọc" khi voice.js tắt (T-13/N-05)', !/giọng đọc/i.test(await text('#main')));
  has('about (localhost, dev-mock): nói thật về máy dùng chung (T-09)', await text('#main'), 'máy dùng chung');
}

/* Chạy tối thiểu từng loại bài để chắc là kết thúc được */
async function runExercise(id) {
  const type = await ev(`STOP4P_DATA.EXERCISES[${J(id)}].type`);
  if (type === 'breath') {
    const holds = await ev(`!!STOP4P_DATA.EXERCISES[${J(id)}].holdsBreath`);
    if (holds) {
      check(id + ': có cổng xác nhận nín thở', await visible('#gate'));
      check(id + ': giao diện thở còn ẩn sau cổng', !(await visible('#bui')));
      has(id + ': cổng có lựa chọn không nín thở', await text('#gate'), 'Chọn thở 4–6');
      await click('#gate-ok');
      check(id + ': qua cổng → hiện giao diện thở', await visible('#bui'));
    } else check(id + ': không có cổng (không nín thở)', !(await exists('#gate')));
    const phases = await ev(`(${J(id)} === 'BREATHE_478') ? 3 : (${J(id)} === 'BOX_4444') ? 4 : 2`);
    check(id + ': chọn sẵn thời lượng', await exists('[data-dur].on'));
    await click('#bplay');
    await sleep(900);
    has(id + ': nhịp đầu là "Hít vào"', await text('#phase'), 'Hít vào');
    eq(id + ': nút thành Tạm dừng', (await text('#bplay')).trim(), '❚❚ Tạm dừng');
    has(id + ': còn thời gian', await text('#remain'), 'Còn khoảng');
    await click('#bplay');
    eq(id + ': tạm dừng → "Tiếp tục"', (await text('#bplay')).trim(), '▶ Tiếp tục');
    await click('#bstop');
    eq(id + ': dừng → "Đã dừng"', (await text('#phase')).trim(), 'Đã dừng');
    check(id + ': pattern đủ ' + phases + ' pha', await ev(`(() => { const P = { BREATHE_46: 2, BOX_4444: 4, BREATHE_478: 3, HUM: 2 }; return P[${J(id)}] === ${phases}; })()`));
  } else if (type === 'steps') {
    check('STOP_PAUSE: bước 1 nút Trước disabled', await ev(`document.querySelector('#sprev').disabled`));
    for (let i = 0; i < 3; i++) { eq('STOP_PAUSE: bước ' + (i + 1) + ' nút Tiếp', (await text('#snext')).trim(), 'Tiếp ›'); await click('#snext'); }
    has('STOP_PAUSE: bước 4 "Quan sát"', await text('#stepc'), 'Quan sát');
    await page.click('#snext', 2); await sleep(150); // N-03: chạm ĐÚP ở bước 4 → chỉ sang bước 5, không nhảy check-out
    const scr = await screen();
    eq('STOP_PAUSE: sau lần bấm Tiếp thứ 4 (chạm đúp) vẫn ở bài (bước 5), không nhảy check-out (NT-01, N-03)', scr, 'player');
    if (scr === 'player') {
      eq('STOP_PAUSE: bước 5 nút "Xong → Check-out"', (await text('#snext')).trim(), 'Xong → Check-out');
      has('STOP_PAUSE: bước 5 hỏi "Mình cần gì"', await text('#stepc'), 'Mình cần gì');
      check('STOP_PAUSE: nút bước 5 không gắn data-act (tránh kích hoạt trong cùng cú click)', !(await exists('#snext[data-act]')));
      await sleep(400);
      await click('#snext');
      eq('STOP_PAUSE: bấm "Xong → Check-out" ở bước 5 → sang check-out', await screen(), 'checkout');
      await ev(`history.back()`); await sleep(300);
    } else {
      // quay lại bài để các kiểm tra sau vẫn chạy được
      await ev(`history.back()`); await sleep(300);
      has('STOP_PAUSE: quay lại bằng Back → đang ở bước 5 (chưa ai thấy)', await text('#stepc'), 'Mình cần gì');
    }
  } else if (type === 'grounding') {
    for (let i = 0; i < 5; i++) {
      const n = 5 - i;
      eq('GROUND: bước ' + (i + 1) + ' có ' + n + ' chấm', await count('.tap-dot'), n);
      await click('.tap-dot');
      check('GROUND: chạm chấm → bật', await ev(`document.querySelector('.tap-dot').classList.contains('on')`));
      await click('#gnext');
    }
    has('GROUND: kết "Bạn đang ở đây, lúc này."', await text('#ground'), 'Bạn đang ở đây, lúc này.');
    check('GROUND: có nút Check-out', await exists('#ground [data-act=finishExercise]'));
  } else if (type === 'pmr') {
    await click('#pplay');
    await sleep(300);
    has('PMR: vùng 1 Bàn tay', await text('#pmrc'), 'Bàn tay');
    for (let i = 0; i < 7; i++) await click('#pskip');
    has('PMR: Hoàn thành sau 7 vùng', await text('#pmrc'), 'Hoàn thành');
  } else if (type === 'journal') {
    has('JOURNAL (ẩn danh): báo không lưu', await text('#main .player-body'), 'ẩn danh: nhật ký không được lưu');
    await typeInto('#j1', 'BN Nguyễn Văn A ở giường 12 trở nặng');
    await click('#jdone');
    check('JOURNAL: cảnh báo PII', await exists('#jpii .pii-panel'));
    has('JOURNAL: nêu "Nguyễn Văn"', await text('#jpii'), 'Nguyễn Văn');
    has('JOURNAL: nêu "giường 12"', await text('#jpii'), 'giường 12');
    has('JOURNAL: bảng có dòng "không thể phát hiện mọi thông tin"', await text('#jpii'), 'không thể phát hiện mọi thông tin');
    await click('#jclear');
    has('JOURNAL: toast xóa', await toast(), 'Đã xóa nội dung nhật ký');
    check('JOURNAL: "Xóa nội dung" xóa luôn bảng cảnh báo PII (G-10)', !(await exists('#jpii .pii-panel')));
  } else if (type === 'gratitude') {
    has('GRATITUDE: lời nhắc không ép tích cực', await text('#main .gentle'), 'Không cần phải tích cực');
    check('GRATITUDE: có nút Bỏ qua', await ev(`[...document.querySelectorAll('#main .player-body button')].some(b => b.textContent.trim() === 'Bỏ qua')`));
    eq('GRATITUDE: cây chưa lá', await count('#tree .leaf.on'), 0);
    await typeInto('#g0', 'Một cốc nước ấm');
    eq('GRATITUDE: 1 điều → 1 lá', await count('#tree .leaf.on'), 1);
  } else if (type === 'audio') {
    eq('AUDIO: không tự phát (nút ▶ Phát)', (await text('#aplay')).trim(), '▶ Phát');
    await click('#aplay');
    await sleep(1200);
    eq('AUDIO: đang phát → "■ Dừng"', (await text('#aplay')).trim(), '■ Dừng');
    has('AUDIO: đếm ngược', await text('#aleft'), 'Còn 4:');
    await click('#aplay');
    eq('AUDIO: dừng được', (await text('#aplay')).trim(), '▶ Phát');
  } else if (type === 'recovery') {
    has('RECOVERY: thẻ an toàn người bệnh', await text('#main .safety-card'), 'báo người phụ trách');
    await click('#mr0');
    await click('[data-rest="1"]');
    check('RECOVERY: thanh nghỉ hiện', await visible('#rest'));
    check('RECOVERY: có nút "Tìm hỗ trợ"', await ev(`[...document.querySelectorAll('#main .player-body [data-go=support]')].length > 0`));
  }
}

/* =========================================================
   Kịch bản 2: đăng nhập SĐT + OTP dev-mock → đồng ý → hồ sơ → check-in → bài → check-out → Hành trình của tôi
   ========================================================= */
async function scMember() {
  await fresh();
  await click('[data-go=login]');
  await expectScreen('login');
  has('login: có banner DEMO', await text('#main .dev-banner'), 'DEMO');
  await typeInto('#phone', '12345');
  await clickText('Gửi mã ›');
  has('login: số sai → lỗi mềm có ví dụ', await text('#phone-err'), 'ví dụ 0912 345 678');
  await typeInto('#phone', '0912345678');
  await clickText('Gửi mã ›');
  await waitFor(`!!document.querySelector('.otp-code')`, 3000, 'mã OTP hiện');
  has('otp: số đã che', await text('#main'), '+849 ••• ••678');
  const code = (await text('.otp-code')).trim();
  check('otp: mã 6 số hiện trên màn (dev-mock)', /^\d{6}$/.test(code), code);
  has('otp: nút gửi lại đang đếm', await text('#resend'), 'Gửi lại sau');
  check('otp: màn nhập mã có đường ra ẩn danh (T-23)', await exists('#main [data-act=loginAsGuest]'));
  await shot('otp');
  // gửi lại mã: báo bằng toast, không nằm trong ô lỗi đỏ (T-23)
  await ev(`STOP4P_APP.state.otp.resendAt = 0`);
  await sleep(1100);
  await click('#resend');
  has('otp: gửi lại → toast "Đã gửi mã mới."', await toast(), 'Đã gửi mã mới');
  eq('otp: gửi lại → ô lỗi đỏ trống', (await text('#otp-err')).trim(), '');
  const code2 = (await text('.otp-code')).trim();
  check('otp: mã mới vẫn 6 số', /^\d{6}$/.test(code2), code2);
  await typeInto('#otp', code2 === '000000' ? '111111' : '000000');
  await clickText('Xác minh mã');
  eq('otp: sai → "Còn 4 lần thử"', (await text('#otp-err')).trim(), 'Mã chưa đúng. Còn 4 lần thử.');
  await typeInto('#otp', code2);
  await page.key('Enter');
  await sleep(400);
  await expectScreen('consent');
  has('login: toast thành công', await toast(), 'Đăng nhập thành công');
  eq('consent: CHƯA ghi gì vào localStorage trước khi đồng ý (T-08)', (await storageKeys()).local.length, 0);
  check('consent: mục 1 bật sẵn', await ev(`document.querySelector('#c-store').checked`));
  check('consent: mục 2, 3 tắt sẵn', await ev(`!document.querySelector('#c-text').checked && !document.querySelector('#c-research').checked`));
  await shot('consent', true);
  await click('#c-store');
  await clickText('Tiếp tục');
  has('consent: bỏ mục 1 → lỗi mềm', await text('#consent-err'), 'cần đồng ý mục đầu tiên');
  await click('#c-store'); await click('#c-text');
  await clickText('Tiếp tục');
  await expectScreen('profile');
  check('profile (member): KHÔNG có nút Bỏ qua (G-03)', !(await exists('[data-act=skipProfile]')));
  await clickText('Lưu & tiếp tục');
  has('profile: chưa chọn → lỗi mềm', await text('#prof-err'), 'Vui lòng chọn nơi công tác');
  await click('input[name=wp][value=hung_vuong]');
  await ev(`(() => { const s = document.querySelector('#dept'); s.value = 'Khoa Sanh'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await clickText('Lưu & tiếp tục');
  await expectScreen('pause5');
  has('header: dải đã đăng nhập + số che', await text('#header .mode-strip'), 'Đã đăng nhập +849 ••• ••678');
  const ks1 = await storageKeys();
  check('member: có đúng 1 khóa stop4p_member_<hash>', ks1.local.length === 1 && /^stop4p_member_[0-9a-f]{32}$/.test(ks1.local[0]), ks1.local);
  check('member: không lưu số nguyên văn', !(await ev(`JSON.stringify(localStorage).includes('0912345678')`)));
  check('member: sessionStorage có phiên hoạt động', ks1.session.includes('stop4p_active_member'));

  // tải lại trang giữa chừng → vẫn đăng nhập, về trang chính
  await page.navigate(APP_URL);
  await waitFor(`!!window.STOP4P_APP`, 8000);
  await expectScreen('home');
  check('member: trang chính có tile Hành trình của tôi', await exists('#main [data-go=journey]'));

  await goPause5FromHome();
  await click('#pause-btn');
  await fillCheckin({ emotions: ['sad'], distress: 7, text: 'Ca trực dài, mình thấy buồn', minutes: 5 });
  has('checkin (member, đã đồng ý lưu nội dung): ghi chú sẽ lưu', await text('#main section.checkin > .fine'), 'sẽ được lưu');
  await submitCheckin();
  await expectScreen('result');
  const ids = await suggestionIds();
  check('result: mức 7 → không có bài nín thở', !ids.includes('BOX_4444') && !ids.includes('BREATHE_478'), ids);
  await click('#main .ex-list [data-act=startEx]');
  await expectScreen('player');
  await finishViaCheckout(4, 'fit');
  has('done (member): đã lưu', await text('#main .ok'), 'Đã lưu vào Hành trình của tôi');
  has('done: Trước 7 → Sau 4', await text('#main .delta'), 'Trước: 7 → Sau: 4');
  await clickText('Về trang chính');
  await expectScreen('home');

  await click('#main [data-go=journey]');
  await expectScreen('journey');
  eq('journey: 1 mục', await count('#main .j-item'), 1);
  check('journey: có biểu đồ', await exists('#main svg.chart'));
  has('journey: hiện 7 → 4', await text('#main .j-top'), '7 → 4');
  has('journey: cảm xúc Buồn', await text('#main .j-item'), 'Buồn');
  check('journey: mục có nội dung đã viết (đã đồng ý)', await exists('#main .j-item details'));
  has('journey: "Chỉ bạn xem được"', await text('#main .fine'), 'Chỉ bạn xem được');
  await shot('journey', true);

  // Xuất JSON / CSV: chặn tải file, bắt blob
  await ev(`(() => { window.__blobs = []; URL.createObjectURL = b => { window.__blobs.push(b); return 'blob:qa'; }; HTMLAnchorElement.prototype.click = function () {}; })()`);
  await clickText('Xuất JSON');
  const json = await ev(`window.__blobs[0].text()`);
  let parsed = null; try { parsed = JSON.parse(json); } catch (e) { /* đỏ bên dưới */ }
  check('export JSON: hợp lệ, 1 check-in, có narrative', parsed && parsed.checkins.length === 1 && parsed.checkins[0].narrative === 'Ca trực dài, mình thấy buồn', json.slice(0, 200));
  await clickText('Xuất CSV');
  const csv = await ev(`window.__blobs[1].text()`);
  check('export CSV: header + 1 dòng, có nhãn tiếng Việt', csv.split('\n').length === 2 && csv.includes('"Buồn"'), csv.slice(0, 200));
  // Blob.text() tự bỏ BOM khi giải mã → phải đọc byte thô
  const head = await ev(`new Response(window.__blobs[1]).arrayBuffer().then(b => [...new Uint8Array(b).slice(0, 3)].join(','))`);
  eq('export CSV: 3 byte đầu là BOM UTF-8 EF BB BF (Excel đọc đúng dấu)', head, '239,187,191');
  const bomProbe = await ev(`(async () => { const src = await (await fetch('js/app.js')).text(); const i = src.indexOf("'" + String.fromCharCode(0xFEFF) + "' + cols.join"); return { inSource: i >= 0, evalKeeps: eval("'" + String.fromCharCode(0xFEFF) + "a'").charCodeAt(0) === 0xFEFF }; })()`);
  check('BOM: nguồn app.js có U+FEFF trong chuỗi và engine giữ nguyên', bomProbe.inSource && bomProbe.evalKeeps, JSON.stringify(bomProbe));
  check('export CSV: tiêu đề bài tiếng Việt', /"(Thở|Dừng|Grounding|Nghỉ|Nhật|Ba|Âm|Thư|Ngân|Hành|4 trạm)/.test(csv.split('\n')[1]), csv.split('\n')[1]);

  // Xóa từng mục (2 lần)
  await click('#main [data-act=deleteOne]');
  eq('journey: bấm 1 lần → "Bấm lần nữa để xóa"', (await text('#main [data-act=deleteOne]')).trim(), 'Bấm lần nữa để xóa');
  eq('journey: chưa xóa', await count('#main .j-item'), 1);
  await click('#main [data-act=deleteOne]');
  has('journey: toast đã xóa', await toast(), 'Đã xóa check-in');
  eq('journey: rỗng', await count('#main .j-item'), 0);
  has('journey: trạng thái rỗng mời làm', await text('#main'), 'Chưa có gì ở đây. Bắt đầu một lần DỪNG 5 nhé.');
  // Xóa toàn bộ
  await click('[data-act=askDeleteAll]');
  check('journey: hộp xác nhận xóa toàn bộ', await exists('#confirm-box .confirm'));
  await click('[data-act=cancelConfirm]');
  check('journey: Hủy đóng hộp', !(await exists('#confirm-box .confirm')));
  await click('[data-act=askDeleteAll]');
  await clickText('Tôi hiểu, xóa toàn bộ');
  has('journey: toast xóa toàn bộ', await toast(), 'Đã xóa toàn bộ hành trình');
  // Đổi lựa chọn lưu trữ → quay về đâu?
  await click('#main [data-go=consent]');
  await expectScreen('consent');
  check('consent (đổi): mục 2 nhớ trạng thái đã bật', await ev(`document.querySelector('#c-text').checked`));
  await clickText('Tiếp tục');
  eq('consent (đổi) → về home chứ không về journey (G-11)', await screen(), 'home');
  // Xóa tài khoản
  await ev(`document.querySelector('#header [data-go=journey]').click()`); await sleep(150);
  await click('[data-act=askDeleteAccount]');
  await clickText('Tôi hiểu, xóa tài khoản');
  await expectScreen('welcome');
  has('xóa tài khoản: toast', await toast(), 'Đã xóa tài khoản');
  const ks2 = await storageKeys();
  eq('xóa tài khoản: localStorage trống', ks2.local.length, 0);
  eq('xóa tài khoản: sessionStorage trống', ks2.session.length, 0);

  // Guest → member từ màn Hoàn tất (importGuest)
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]'); await click('#pause-btn');
  await fillCheckin({ emotions: ['calm'], distress: 2, minutes: 1 });
  await submitCheckin();
  await click('#main .ex-list [data-act=startEx]');
  await finishViaCheckout(1, 'fit');
  await click('[data-act=saveAsMember]');
  await expectScreen('login');
  await typeInto('#phone', '0987654321'); await clickText('Gửi mã ›');
  await waitFor(`!!document.querySelector('.otp-code')`, 3000);
  await typeInto('#otp', (await text('.otp-code')).trim()); await clickText('Xác minh mã');
  await expectScreen('consent'); await clickText('Tiếp tục');
  await expectScreen('profile');
  await click('input[name=wp][value=other]'); await clickText('Lưu & tiếp tục');
  await expectScreen('importGuest');
  check('importGuest: mặc định "Không"', await ev(`document.querySelector('input[name=imp][value=no]').checked`));
  await click('input[name=imp][value=yes]');
  await clickText('Tiếp tục');
  await expectScreen('journey');
  has('importGuest: toast đã lưu phiên', await toast(), 'Đã lưu phiên vừa thực hiện');
  eq('importGuest: 1 mục trong hành trình', await count('#main .j-item'), 1);
  has('importGuest: 2 → 1', await text('#main .j-top'), '2 → 1');
  // đăng xuất
  await ev(`document.querySelector('#header [data-act=logout]').click()`); await sleep(150);
  await expectScreen('welcome');
  const ks3 = await storageKeys();
  check('logout: dữ liệu member còn trong localStorage, phiên đã xóa', ks3.local.length === 1 && ks3.session.length === 0, ks3);
}

/* =========================================================
   Kịch bản 3: Hành trình STOP-4P 9 chặng — đi đủ, rồi bỏ qua hết, rồi nhảy tự do
   ========================================================= */
async function scJourney() {
  await fresh();
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  await expectScreen('home');
  await click('#main [data-act=startEx][data-id="STOP4P_FULL"]');
  await checkPlayerChrome('STOP4P_FULL');
  eq('journey: bản đồ 9 chặng', await count('#s4map .node'), 9);
  has('journey: chặng 1/9', await text('.s4-count'), 'Chặng 1/9');
  const nodeCls = () => ev(`[...document.querySelectorAll('#s4map .node')].map(n => n.classList.contains('done') ? 'done' : n.classList.contains('skipped') ? 'skipped' : '-')`);
  const skipBtn = async () => check('chặng có "Bỏ qua chặng này"', await exists('[data-s4=skip]'));

  // 1 check-in
  await skipBtn();
  check('"Bỏ qua chặng này" là link gạch chân (T-26)', await ev(`document.querySelector('[data-s4=skip]').classList.contains('link')`));
  eq('bản đồ: nhãn chặng ngắn (T-19)', await ev(`document.querySelector('#s4map .node:nth-child(3) span').textContent`), 'Rồng');
  eq('bản đồ: nhãn chặng 12px (T-19)', await ev(`getComputedStyle(document.querySelector('#s4map .node span')).fontSize`), '12px');
  has('chặng 1 chưa làm: nút phải là "Sang chặng sau ›" (T-17)', await text('#s4next'), 'Sang chặng sau');
  check('chặng 1 chưa làm: nút phải nhạt (soft)', await ev(`document.querySelector('#s4next').classList.contains('soft')`));
  await ev(`document.querySelector('#s4d').focus()`);
  await setRange('#s4d', 6);
  has('chặng 1: nhãn 6 · Khá khó chịu', await text('#s4dv'), '6 · Khá khó chịu');
  eq('chặng 1: aria-valuetext (T-27)', await ev(`document.querySelector('#s4d').getAttribute('aria-valuetext')`), '6 — Khá khó chịu');
  has('chặng 1 xong: nút "thức dậy" thành "Tiếp tục ›" (T-17)', await text('#s4next'), 'Tiếp tục');
  check('chặng 1 xong: nút đậm (primary)', await ev(`document.querySelector('#s4next').classList.contains('primary')`));
  await click('#s4next');
  // 2 monkeys
  has('chặng 2 STOP bầy khỉ', await text('.s4-head h2'), 'STOP bầy khỉ');
  eq('chặng 2: 12 con khỉ', await count('#garden .monkey'), 12);
  await hold('#bell', 1200);
  has('chặng 2: thả sớm → "Thử lại"', await text('#bell-msg'), 'Thử lại');
  await hold('#bell', 3300);
  has('chặng 2: giữ 3 s → "Bầy khỉ đã ngồi yên"', await text('#bell-msg'), 'Bầy khỉ đã ngồi yên');
  has('chặng 2: mantra', await text('#gquote'), 'Dừng lại. Mình đang ở đây');
  check('chặng 2: garden.calm', await ev(`document.querySelector('#garden').classList.contains('calm')`));
  await shot('journey-monkeys');
  await click('#s4next');
  // 3 dragon
  has('chặng 3 Rồng', await text('.s4-head h2'), 'Rồng thổi chong chóng');
  await hold('#hold', 300);
  has('chặng 3: giữ ngắn → "Giữ lâu hơn"', await text('#dmsg'), 'Giữ lâu hơn một chút');
  let tries = 0;
  while (+(await text('#bc')) < 3 && tries < 6) { tries++; await hold('#hold', 1400); await sleep(200); }
  eq('chặng 3: 3 hơi thở', (await text('#bc')).trim(), '3');
  check('chặng 3: số lần giữ cần để đủ 3 hơi (>3 = harness bỏ lỡ pointer, không phải app)', true, tries);
  check('chặng 3: chong chóng quay', await ev(`document.querySelector('#pin').classList.contains('spinning')`));
  await click('#s4next');
  // 4 pain
  has('chặng 4 Điểm đau', await text('.s4-head h2'), 'Điểm đau');
  eq('chặng 4: 9 vùng chip', await count('#zchips [data-z]'), 9);
  await click('#zchips [data-z="shoulders"]');
  await click('#zchips [data-z="back"]');
  check('chặng 4: hình đánh dấu vai', await ev(`!!document.querySelector('#fig .zone.marked[data-zone="shoulders"]')`));
  await shot('journey-pain');
  await click('#s4next');
  // 5 relax
  has('chặng 5 Thư giãn', await text('.s4-head h2'), 'Thư giãn');
  check('chặng 5: "Bỏ qua vùng này" là link (T-26)', await ev(`document.querySelector('[data-s4=relaxskip]').classList.contains('link')`));
  eq('chặng 5: chỉ 1 nút primary trên màn khi chưa xong (T-26/7.1)', await count('#s4stage .btn.primary'), 1);
  let relaxZones = [];
  for (let i = 0; i < 9; i++) {
    const lbl = await text('#relax-body .label');
    relaxZones.push((lbl || '').split('·')[0].trim());
    if (lbl && (lbl.includes('Vai') || lbl.includes('Hông'))) has('chặng 5: vùng đã đánh dấu (' + lbl.split('·')[0].trim() + ') có ghi chú nhẹ', await text('#relax-body'), 'vùng bạn đã đánh dấu');
    await click('[data-s4=relaxed]');
  }
  has('chặng 5: kết "Cả cơ thể đã được chú ý"', await text('#relax-body'), 'Cả cơ thể đã được chú ý');
  check('chặng 5: đi đủ 9 vùng, có "Hông / thắt lưng" và "Chân" (T-15/N-02)', relaxZones.length === 9 && relaxZones.some(z => z.includes('Hông')) && relaxZones.includes('Chân'), relaxZones);
  await click('#s4next');
  // 6 name
  has('chặng 6 Gọi tên cảm xúc', await text('.s4-head h2'), 'Gọi tên cảm xúc');
  await click('[data-emo="tired"]');
  has('chặng 6: câu gọi tên', await text('#nsay'), 'mệt mỏi');
  await click('#s4next');
  // 7 clouds
  has('chặng 7 Đám mây', await text('.s4-head h2'), 'Đám mây');
  await click('#cgo');
  eq('chặng 7: thả rỗng → không tính', (await text('#ccount')).trim(), '');
  await typeInto('#cth', 'Lỡ mình đã bỏ sót điều gì');
  await page.key('Enter');
  await sleep(150);
  has('chặng 7: Enter → "Đã thả 1 đám mây"', await text('#ccount'), 'Đã thả 1 đám mây');
  eq('chặng 7: có mây trên trời', await count('#sky .cloud'), 1);
  await shot('journey-clouds');
  await click('#s4next');
  // 8 connect
  has('chặng 8 Kết nối bản thân', await text('.s4-head h2'), 'Kết nối bản thân');
  await typeInto('#self', 'Mình đã cố hết sức với chị Lan giường 12');
  await click('#tojar');
  check('chặng 8: lời nhắn có tên/giường → cảnh báo PII trước khi gửi (T-06)', await exists('#self-pii .pii-panel'));
  has('chặng 8: bảng nêu "chị Lan"', await text('#self-pii'), 'chị Lan');
  check('chặng 8: chưa gửi vào hũ khi mới cảnh báo', !(await ev(`STOP4P_APP.state.session.stop4p.selfNote`)));
  await clearInput('#self');
  check('chặng 8: sửa lời nhắn → bảng cảnh báo ẩn', !(await exists('#self-pii .pii-panel')));
  await click('[data-phrase]');
  has('chặng 8: chip điền vào ô', await ev(`document.querySelector('#self').value`), 'Mình đã làm hết sức');
  await click('#tojar');
  await sleep(1500);
  has('chặng 8: toast hũ bình an', await toast(), 'Đã gửi vào hũ bình an');
  await click('#s4next');
  // 9 gratitude
  has('chặng 9 biết ơn', await text('.s4-head h2'), '3 lời biết ơn');
  has('chặng 9: nút "Hoàn tất ›"', await text('#s4next'), 'Hoàn tất');
  await typeInto('#g0', 'Ca trực đã qua');
  eq('chặng 9: cây 1 lá', await count('#tree .leaf.on'), 1);
  await click('#s4next');
  // end
  has('kết: "Bạn đã đi hết hành trình"', await text('.s4-end h2'), 'Bạn đã đi hết hành trình');
  has('kết: 9/9 chặng', await text('.s4-sum'), '9/9 chặng');
  has('kết: 3 hơi thở', await text('.s4-sum'), '3 hơi thở');
  has('kết: 1 đám mây', await text('.s4-sum'), '1 đám mây');
  const cls1 = await nodeCls();
  check('bản đồ: 9/9 node .done (tick ✓)', cls1.every(c => c === 'done'), cls1);
  check('bản đồ: tick ✓ vẽ bằng ::before', (await ev(`getComputedStyle(document.querySelector('#s4map .node.done'), '::before').content`)) === '"✓"');
  await shot('journey-end', true);
  await click('.s4-end [data-act=finishExercise]');
  await expectScreen('checkout');
  await setRange('#after', 2);
  await clickText('Xong ✓');
  await expectScreen('done');
  has('done sau hành trình: Trước 6 (lấy từ chặng 1) → Sau 2', await text('#main .delta'), 'Trước: 6 → Sau: 2');
  await clickText('Kết thúc & xóa dữ liệu tạm');

  /* ---- Gọi tên cảm xúc điền sẵn từ check-in → tính là đã xong (N-04) ---- */
  await goPause5FromHome(); await click('#pause-btn');
  await fillCheckin({ emotions: ['tired'], distress: 4, minutes: 10 });
  await submitCheckin();
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  await click('#main [data-act=startEx][data-id="STOP4P_FULL"]');
  has('sau check-in: hành trình mở ở chặng 2', await text('.s4-count'), 'Chặng 2/9');
  await click('#s4map .node:nth-child(6) button');
  eq('chặng 6: cảm xúc từ check-in đã điền sẵn', await count('[data-emo].on'), 1);
  eq('chặng 6: điền sẵn → chặng tính là đã xong (N-04)', (await nodeCls())[5], 'done');
  has('chặng 6 điền sẵn: nút "Tiếp tục ›"', await text('#s4next'), 'Tiếp tục');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  await ev(`document.querySelector('#header [data-act=endGuest]').click()`); await sleep(150);
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);

  /* ---- Lần 2: bỏ qua từng chặng ---- */
  await click('#main [data-act=startEx][data-id="STOP4P_FULL"]');
  await expectScreen('player');
  has('lần 2: bắt đầu lại từ chặng 1', await text('.s4-count'), 'Chặng 1/9');
  for (let i = 0; i < 9; i++) await click('[data-s4=skip]');
  has('lần 2: kết 0/9 chặng', await text('.s4-sum'), '0/9 chặng');
  const cls2 = await nodeCls();
  check('bản đồ: 9/9 node .skipped (mờ)', cls2.every(c => c === 'skipped'), cls2);
  check('bản đồ: node bỏ qua mờ 0.5', (await ev(`getComputedStyle(document.querySelector('#s4map .node.skipped button')).opacity`)) === '0.5');
  await shot('journey-skipped', true);

  /* ---- Nhảy tự do ---- */
  await click('#s4map .node:nth-child(3) button');
  has('nhảy: về chặng 3', await text('.s4-count'), 'Chặng 3/9');
  check('nhảy: node 3 là current', await ev(`document.querySelector('#s4map .node:nth-child(3)').classList.contains('current')`));
  await click('#s4map .node:nth-child(9) button');
  has('nhảy: tới chặng 9', await text('.s4-count'), 'Chặng 9/9');
  // "Sang chặng sau" khi chưa làm → KHÔNG bị tính là bỏ qua nữa (T-17/N-04)
  await ev(`(() => { const g = STOP4P_APP.state.session.stop4p; g.skipped = g.skipped.filter(k => k !== 'name'); })()`);
  await click('#s4map .node:nth-child(6) button');
  check('chặng 6: cảm xúc điền sẵn từ check-in? (ẩn danh không check-in → trống)', (await count('[data-emo].on')) === 0);
  has('chặng 6 chưa chạm: nút "Sang chặng sau ›"', await text('#s4next'), 'Sang chặng sau');
  await click('#s4next');
  const c6 = (await nodeCls())[5];
  eq('T-17/N-04: "Sang chặng sau" khi chưa chạm → chặng không bị đánh dấu bỏ qua', c6, '-');
  // Trở về thở tự nhiên rồi kết thúc bài từ lớp phủ
  await click('#main [data-act=natural]');
  await click('#natural [data-act=finishExercise]');
  await expectScreen('checkout');
}

/* =========================================================
   Kịch bản 4: 4 trạm × 4 nhịp
   ========================================================= */
async function scStations() {
  await fresh();
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  await click('#main [data-act=startEx][data-id="RELAX_4STATIONS"]');
  await checkPlayerChrome('RELAX_4STATIONS');
  eq('4 trạm: bản đồ 4 trạm', await count('#stmap .st-node'), 4);
  has('4 trạm: 0/4', await text('#stprog'), '0/4 trạm');
  has('intro: "không có thắng thua"', await text('.st-intro'), 'không có thắng thua');
  await setRange('#st-before', 6);
  const lbl = await text('#st-beforev');
  has('intro: nhãn mức 6 là nhãn căng thẳng "Khá căng" (T-16/N-03)', lbl, '6 · Khá căng');
  eq('intro: aria-valuetext thanh trượt 4 trạm (T-27)', await ev(`document.querySelector('#st-before').getAttribute('aria-valuetext')`), '6 — Khá căng');
  check('4 trạm: 4 trạm nằm trên một hàng ở 375px (T-24)', await ev(`new Set([...document.querySelectorAll('#stmap .st-node')].map(n => n.offsetTop)).size === 1`));
  await shot('stations-intro', true);
  await clickText('Bắt đầu trạm 1');
  eq('trạm 1: nút bản đồ có aria-current="step" (T-27)', await ev(`document.querySelector('#stmap .st-node:nth-child(1) button').getAttribute('aria-current')`), 'step');
  check('trạm 1: "Bỏ qua trạm" là link (T-26)', await ev(`document.querySelector('[data-st=skip-station]').classList.contains('link')`));
  const checks = ['Tôi đã chú ý đến hơi thở', 'Tôi đã buông lỏng hai vai', 'Tôi đã thả lỏng mặt và hàm', 'Tôi đã quan sát suy nghĩ'];
  for (let s = 0; s < 4; s++) {
    has(`trạm ${s + 1}: tiêu đề`, await text('.st-head .s4-count'), `Trạm ${s + 1}/4`);
    for (let p = 0; p < 4; p++) {
      const name = ['Nhận biết', 'Trải nghiệm', 'Buông lỏng', 'Cảm nhận'][p];
      eq(`trạm ${s + 1} nhịp ${p + 1}: ${name}`, (await text('.st-phase-name')).trim(), name);
      if (s === 0 && p === 0) {
        eq('trạm 1: nút Tạm dừng', (await text('[data-st=toggle]')).trim(), '❚❚ Tạm dừng');
        await click('[data-st=toggle]');
        eq('trạm 1: → Tiếp tục', (await text('[data-st=toggle]')).trim(), '▶ Tiếp tục');
        await click('[data-st=toggle]');
        check('trạm 1: có "Bỏ qua trạm"', await exists('[data-st=skip-station]'));
      }
      if (s === 1 && p === 2) has('trạm 2 nhịp 3: ẩn dụ ba lô', await text('.st-say'), 'ba lô');
      await click('[data-st=skip-phase]');
    }
    has(`trạm ${s + 1}: nút xác nhận`, await text('[data-st=check]'), checks[s]);
    if (s === 0) await shot('stations-confirm');
    await click('[data-st=check]');
    if (s < 3) has(`sau trạm ${s + 1}: ${s + 1}/4`, await text('#stprog'), `${s + 1}/4 trạm`);
    if (s === 0) has('sang trạm 2: focus vào tiêu đề trạm (T-27)', await ev(`document.activeElement && document.activeElement.tagName + ' ' + document.activeElement.textContent`), 'H2');
  }
  has('kết: 4/4 trạm đã trải nghiệm', await text('.st-end .st-progress'), '4/4 trạm');
  eq('kết: 4 ✅', (await text('.st-checklist')).split('✅').length - 1, 4);
  await setRange('#st-after', 3);
  has('kết: nhãn mức sau là nhãn căng thẳng (T-16)', await text('#st-afterv'), '3 · Hơi căng');
  await click('[data-zone-pick="shoulders"]');
  await typeInto('#st-notice', 'lo cho BN Trần Văn Bình');
  await click('.st-end [data-act=finishExercise]');
  check('kết: ghi chú có tên → cảnh báo PII, chưa sang check-out (T-06)', (await screen()) === 'player' && (await exists('#st-pii .pii-panel')));
  await clearInput('#st-notice');
  await typeInto('#st-notice', 'mình hay siết hàm khi viết hồ sơ');
  has('kết: thông điệp "Bạn không cần phải thấy thư giãn hơn ngay"', await text('.st-end .gentle'), 'không cần phải thấy thư giãn hơn ngay');
  await shot('stations-end', true);
  await click('.st-end [data-act=finishExercise]');
  await expectScreen('checkout');
  has('checkout: điền sẵn mức sau = 3', await text('#main .distress-value'), '3 · Hơi căng');
  await clickText('Xong ✓');
  has('done: Trước 6 → Sau 3', await text('#main .delta'), 'Trước: 6 → Sau: 3');
  await clickText('Kết thúc & xóa dữ liệu tạm');

  // lần 2: bỏ qua cả 4 trạm
  await click('#main [data-act=startEx][data-id="RELAX_4STATIONS"]');
  await clickText('Bắt đầu trạm 1');
  for (let s = 0; s < 4; s++) await click('[data-st=skip-station]');
  has('bỏ qua hết: 0/4', await text('.st-end .st-progress'), '0/4 trạm');
  const cls = await ev(`[...document.querySelectorAll('#stmap .st-node')].map(n => n.classList.contains('skipped'))`);
  check('bản đồ trạm: 4 node mờ', cls.every(Boolean), cls);
  // nhảy trạm từ bản đồ
  await click('#stmap .st-node:nth-child(2) button');
  has('nhảy: trạm 2', await text('.st-head .s4-count'), 'Trạm 2/4');
}

/* =========================================================
   Kịch bản 5: an toàn — từ khóa, mức 9–10, trống rỗng, chóng mặt, cổng nín thở
   ========================================================= */
async function scSafety() {
  await fresh();
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]');
  const run = async (o) => {
    await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
    await goPause5FromHome(); await click('#pause-btn');
    await fillCheckin(o); await submitCheckin();
    return screen();
  };
  // 1. "mệt muốn chết" → khẩn
  eq('"mệt muốn chết" → màn hỗ trợ khẩn', await run({ text: 'hôm nay mệt muốn chết', distress: 5 }), 'urgent');
  check('urgent: có tel:115', await exists('#main a[href="tel:115"]'));
  check('urgent: không có câu kỹ thuật "chưa cấu hình" trong hộp khẩn (T-18)', !/chưa cấu hình|SUPPORT_CHANNELS/.test(await text('#main')));
  const btn = await ev(`(document.querySelector('[data-act=notUrgent]') || {}).textContent`);
  eq('urgent: nút "Tôi đang an toàn — đó chỉ là cách nói. Tiếp tục"', (btn || '').trim(), 'Tôi đang an toàn — đó chỉ là cách nói. Tiếp tục');
  has('urgent: ghi nhận không chắc chắn', await text('#main'), 'không thể biết chắc');
  await shot('urgent', true);
  await click('[data-act=notUrgent]');
  await expectScreen('result');
  check('sau "Tôi đang an toàn": vẫn có thẻ cần người hỗ trợ', await exists('#main .human-card'));
  eq('sau "Tôi đang an toàn": màn urgent bị thay thế trong stack (back không quay lại urgent)', (await stack()).includes('urgent'), false);
  await shot('result-human', true);
  // 2. "tu tu" không dấu — chủ đích không bắt
  eq('"tu tu" (không dấu) → routine (chủ đích, tranh luận)', await run({ text: 'hom nay toi nghi den tu tu', distress: 5 }), 'result');
  // 3. "từ từ" → routine
  eq('"từ từ" → không bị bắt nhầm', await run({ text: 'để mình làm từ từ', distress: 4 }), 'result');
  check('"từ từ" → không có thẻ cần hỗ trợ', !(await exists('#main .human-card')));
  // 4. "mệt quá chết đi được" → hiện tại không bắt
  eq('"mệt quá chết đi được" → hiện KHÔNG bắt (tranh luận, A7)', await run({ text: 'mệt quá chết đi được', distress: 5 }), 'result');
  // 5. "không muốn sống nữa", "tự tử" có dấu, "tự sát" không dấu
  eq('"không muốn sống nữa" → khẩn', await run({ text: 'không muốn sống nữa', distress: 5 }), 'urgent');
  eq('"tu sat" không dấu → khẩn', await run({ text: 'toi muon tu sat', distress: 5 }), 'urgent');
  eq('"Tự Tử" viết hoa → khẩn', await run({ text: 'Nghĩ đến Tự Tử', distress: 5 }), 'urgent');
  eq('"không thiết sống" → chỉ needs_human, KHÔNG khẩn (A7)', await run({ text: 'không thiết sống nữa', distress: 5 }), 'result');
  check('"không thiết sống" → ít nhất có thẻ cần người hỗ trợ', await exists('#main .human-card'));
  /* ---- Sửa bộ luật 28/10/2026 (T-02, T-07) và 29/10/2026 (review lần 2: C-1, N-01) ----
     Lần sửa 28/10 bỏ 'tu hai' / 'rach tay' trần nên câu tự hại GÕ KHÔNG DẤU từng bị lọt (C-1) — tức là ĐÃ nới chốt với chữ
     không dấu. Lượt sửa 2 thay bằng cụm liệt kê (vẫn lọt 8 câu tự nhiên — review lần 3). Lượt sửa 3 đổi sang "bắt từ gốc +
     loại trừ ngữ cảnh vô hại" (data.js urgent.patterns); bộ câu thử của code-reviewer (16 phải khẩn + 14 không khẩn) nằm bên dưới. ---- */
  eq('T-02: "Từ hai tuần nay mình khó ngủ" → KHÔNG ra màn khẩn', await run({ text: 'Từ hai tuần nay mình khó ngủ', distress: 5 }), 'result');
  eq('T-02: "tu hai tuan nay kho ngu" (không dấu) → KHÔNG khẩn', await run({ text: 'tu hai tuan nay kho ngu', distress: 5 }), 'result');
  eq('T-02: "bị rách tay khi mở ống thuốc" → KHÔNG khẩn', await run({ text: 'bị rách tay khi mở ống thuốc', distress: 4 }), 'result');
  eq('T-02 chốt: "mình muốn rạch tay" (có dấu) → vẫn khẩn', await run({ text: 'mình muốn rạch tay', distress: 5 }), 'urgent');
  eq('T-02 chốt: "nghĩ đến chuyện tự hại" → vẫn khẩn', await run({ text: 'nghĩ đến chuyện tự hại', distress: 5 }), 'urgent');
  eq('T-02 chốt: "chet cho xong" không dấu → vẫn khẩn', await run({ text: 'met qua chet cho xong', distress: 5 }), 'urgent');
  // Review lần 4: toàn bộ bộ câu của code-reviewer, gọi thẳng bộ luật trong trang (nhanh) — xem SAFETY_BANK ở đầu file
  const bankRes = await ev(`${J(SAFETY_BANK)}.map(([t]) => STOP4P_ENGINE.safetyCheck({ narrative: t }))`);
  // Câu đánh * là GIỚI HẠN ĐÃ BIẾT (khoảng trống an toàn hoặc bắt nhầm đã ghi ở 6.1): KHÔNG cộng vào số xanh (review lần 5, G-e).
  // Khớp hành vi đã ghi → chỉ đếm vào knownLimits; lệch → test đỏ, để ai đổi bộ luật phải cập nhật 6.1.
  SAFETY_BANK.forEach(([t, exp, src], i) => {
    const r = bankRes[i], m = r.support_mode, isLim = exp.endsWith('*');
    const ok = { urgent: m === 'urgent_or_uncertain', noturgent: m !== 'urgent_or_uncertain', human: m === 'needs_human_support', nothuman: m === 'routine', phys: r.physical_symptoms }[exp.replace('*', '')];
    if (isLim && ok) knownLimits.push({ text: t, behaviour: exp.replace('*', ''), src });
    else check(`bộ câu ${src}: "${t}" → ${exp.replace('*', '')}${isLim ? ' [giới hạn đã ghi 6.1 — hành vi ĐÃ ĐỔI, cập nhật 6.1]' : ''}`, ok, JSON.stringify(r));
  });
  // K-1 / K-2 / G-1 qua giao diện thật (vài câu đại diện)
  for (const t of ['da tu hai 2 lan', 'tu hai den chay mau', 'tu hai ca dem', 'rạch cổ tay', 'ko muốn sống nữa', 'muốn die'])
    eq(`K-2/K-1/G-1 (giao diện): "${t}" → khẩn`, await run({ text: t, distress: 5 }), 'urgent');
  for (const t of ['Áp lực từ hai phía', 'nhận ca từ hai khoa', 'mở ống thuốc rách tay', 'cắt tay áo cho bệnh nhân', 'mình lỡ cắt tay khi gọt táo'])
    eq(`K-1 (giao diện, có dấu): "${t}" → KHÔNG khẩn`, await run({ text: t, distress: 4 }), 'result');
  // C-1: câu tự hại / rạch tay gõ KHÔNG DẤU phải ra khẩn — 16 câu của code-reviewer + bản không dấu của từ khóa có dấu (G-2)
  for (const t of ['hom qua minh tu hai', 'toi da tu hai', 'minh hay tu hai', 'nghi den chuyen tu hai', 'co y nghi tu hai', 'toi rach tay', 'da rach tay roi', 'lay dao rach tay',
    'minh muon tu hai', 'toi muon rach tay', 'tu hai ban than', 'nghi toi tu hai minh', 'minh da tu rach tay', 'hom qua rach co tay', 'muon tu hai.', 'tu hai',
    'dang nghi den tu hai', 'tu lam hai ban than', 'muon cat tay', 'toi muon cat co tay', 'muon ket lieu ban than', 'uong thuoc de chet', 'muon bien mat mai mai', 'khong con ly do song'])
    eq(`C-1 chốt không dấu: "${t}" → khẩn`, await run({ text: t, distress: 5 }), 'urgent');
  // C-1: câu đời thường KHÔNG được ra khẩn — 14 câu của code-reviewer + câu thêm
  for (const t of ['Từ hai tuần nay mình khó ngủ', 'tu hai tuan nay kho ngu', 'da tu hai tuan nay minh kho ngu', 'tu hai gio sang da thuc', 'bi rach tay khi mo ong thuoc',
    'mo ong thuoc bi rach tay minh', 'Đã từ hai tuần nay mình khó ngủ', 'mình muốn từ hai tuần sau nghỉ phép', 'nghĩ tới từ hai năm trước', 'từ hai đến ba ca một tuần',
    'từ hai giờ sáng', 'mở ống thuốc bị rách cổ tay', 'rách tay khi mở ống', 'con từ hai tuổi',
    'từ hai đứa nhỏ cùng ốm', 'bị rách tay áo', 'mình bị rách tay'])
    eq(`C-1 không bắt nhầm: "${t}" → không khẩn`, await run({ text: t, distress: 4 }), 'result');
  eq('T-07: "Ca mổ kéo dài 5 tiếng" → result', await run({ text: 'Ca mổ kéo dài 5 tiếng', distress: 4 }), 'result');
  check('T-07: "Ca mổ kéo dài" → KHÔNG hiện thẻ cần người hỗ trợ', !(await exists('#main .human-card')));
  await run({ text: 'Máy hỏng, mang đi bảo hành', distress: 3 });
  check('T-07: "mang đi bảo hành" → KHÔNG hiện thẻ cần người hỗ trợ', !(await exists('#main .human-card')));
  await run({ text: 'Mình không thiệt gì cả', distress: 3 });
  check('T-07: "không thiệt" → KHÔNG hiện thẻ cần người hỗ trợ', !(await exists('#main .human-card')));
  // N-01: 'hoi hop' trở lại nhóm bỏ dấu → "hội họp" bị coi là triệu chứng (bắt nhầm CHẤP NHẬN được: chỉ thêm dòng nhắc, bớt bài nín thở)
  await run({ text: 'tim hoi hop qua, sap vao ca mo', distress: 4, minutes: 3 });
  has('N-01 chốt không dấu: "tim hoi hop" → vẫn là triệu chứng cơ thể', await text('#main .notes'), 'chóng mặt');
  let seenH0 = [];
  for (let i = 0; i < 3; i++) { seenH0 = seenH0.concat(await suggestionIds()); await clickText('đổi gợi ý'); }
  check('N-01 chốt không dấu: "tim hoi hop" → loại bài nín thở', !seenH0.some(i => ['BOX_4444', 'BREATHE_478'].includes(i)), seenH0);
  // N-01: "kéo dài" có ngữ cảnh, "bị bạo hành" / "không thiết sống" không dấu → thẻ cần người hỗ trợ
  // R-2 (review lần 3): 17 câu "kéo dài" cần thẻ hỗ trợ (mẫu của code-reviewer) + 0/10 câu đời thường bị bắt nhầm
  for (const t of ['căng thẳng kéo dài cả tháng', 'stress kéo dài', 'lo âu kéo dài', 'buồn bã kéo dài', 'tình trạng này kéo dài 3 tuần', 'bi bao hanh', 'khong thiet song nua',
    'mệt mỏi kéo dài', 'kéo dài mấy tháng nay', 'áp lực kéo dài', 'chán kéo dài', 'căng thẳng cứ kéo dài', 'kéo dài hơn một tháng', 'kéo dài hai tuần', 'kéo dài ba tháng nay',
    'kéo dài một năm', 'mất ngủ kéo dài nhiều tuần', 'kéo dài 2-3 tuần', 'buồn kéo dài cả năm']) {
    await run({ text: t, distress: 4 });
    check(`N-01/R-2 chốt: "${t}" → có thẻ cần người hỗ trợ`, await exists('#main .human-card'));
  }
  for (const t of ['Ca mổ kéo dài năm tiếng', 'ca mổ kéo dài gần năm tiếng', 'ca trực kéo dài tới năm giờ sáng', 'buổi họp kéo dài thẳng tới trưa', 'kéo dài thẳng',
    'lo kéo dài thời gian', 'cảm giác kéo dài thời gian', 'cơn đau kéo dài 2 giờ', 'ca mổ kéo dài năm tiếng rưỡi']) {
    await run({ text: t, distress: 3 });
    check(`R-2 không bắt nhầm: "${t}" → KHÔNG có thẻ cần người hỗ trợ`, !(await exists('#main .human-card')));
  }
  await run({ text: 'mình bị người nhà bạo hành', distress: 5 });
  check('T-07 chốt: "bạo hành" (có dấu) → vẫn có thẻ cần người hỗ trợ', await exists('#main .human-card'));
  await run({ text: 'mình mệt kéo dài cả tháng', distress: 5 });
  check('T-07 chốt: "mệt kéo dài" → vẫn có thẻ cần người hỗ trợ', await exists('#main .human-card'));
  await run({ text: 'dạo này tim hay hồi hộp, sắp vào ca mổ', distress: 4, minutes: 3 });
  has('T-07 chốt: "hồi hộp" (có dấu) → vẫn là triệu chứng cơ thể', await text('#main .notes'), 'chóng mặt');
  let seenH = [];
  for (let i = 0; i < 3; i++) { seenH = seenH.concat(await suggestionIds()); await clickText('đổi gợi ý'); }
  check('T-07 chốt: "hồi hộp" → vẫn loại bài nín thở', !seenH.some(i => ['BOX_4444', 'BREATHE_478'].includes(i)), seenH);
  // 6. mức 9–10
  eq('mức 9 không chữ → result', await run({ distress: 9 }), 'result');
  check('mức 9 → thẻ cần người hỗ trợ', await exists('#main .human-card'));
  eq('mức 10 → result', await run({ distress: 10 }), 'result');
  check('mức 10 → thẻ cần người hỗ trợ', await exists('#main .human-card'));
  check('mức 10 → không có bài nín thở', !(await suggestionIds()).some(i => ['BOX_4444', 'BREATHE_478'].includes(i)));
  // 7. trống rỗng + 7
  await run({ emotions: ['empty'], distress: 7 });
  check('trống rỗng + 7 → thẻ cần người hỗ trợ', await exists('#main .human-card'));
  has('trống rỗng + 7 → nhu cầu nghỉ & kết nối', await text('#main .need'), 'kết nối');
  // 8. chóng mặt + trước việc khó → loại nín thở qua mọi lần "đổi gợi ý"
  await run({ text: 'hơi chóng mặt, sắp vào ca mổ', distress: 4, minutes: 3 });
  has('chóng mặt: ghi chú kiểm tra sức khỏe', await text('#main .notes'), 'chóng mặt');
  check('chóng mặt: ghi chú dùng lời thường "dấu hiệu lạ", không "triệu chứng bất thường" (T-14 phần chữ)', (await text('#main .notes')).includes('dấu hiệu lạ') && !(await text('#main .notes')).includes('triệu chứng'));
  let seen = [];
  for (let i = 0; i < 5; i++) { seen = seen.concat(await suggestionIds()); await clickText('đổi gợi ý'); }
  check('chóng mặt: 5 lần đổi gợi ý không bao giờ ra BOX_4444/BREATHE_478', !seen.some(i => ['BOX_4444', 'BREATHE_478'].includes(i)), seen);
  // 9. mức 7 + trước việc khó
  await run({ distress: 7, contexts: ['before_difficult_task'], minutes: 3 });
  seen = [];
  for (let i = 0; i < 5; i++) { seen = seen.concat(await suggestionIds()); await clickText('đổi gợi ý'); }
  check('mức 7: không bao giờ gợi ý bài nín thở', !seen.some(i => ['BOX_4444', 'BREATHE_478'].includes(i)), seen);
  // 10. mức 5 + trước việc khó → BOX_4444 có thể xuất hiện khi đổi gợi ý, và có nhãn "có nín thở"
  await run({ distress: 5, contexts: ['before_difficult_task'], minutes: 3 });
  seen = [];
  for (let i = 0; i < 3; i++) { seen = seen.concat(await suggestionIds()); await clickText('đổi gợi ý'); }
  check('mức 5 + trước việc khó: BOX_4444 xuất hiện khi đổi gợi ý (đúng luật)', seen.includes('BOX_4444'), seen);
  // 11. đang làm việc cần tập trung → chỉ STOP_PAUSE
  await run({ distress: 6, focus: true, minutes: 1 });
  eq('focusTask: chỉ STOP_PAUSE', JSON.stringify(await suggestionIds()), '["STOP_PAUSE"]');
  has('focusTask: ghi chú an toàn người bệnh', await text('#main .notes'), 'an toàn người bệnh');
  // 12. mệt sau trực → MICRO_RECOVERY, không "thở cho tỉnh"
  await run({ emotions: ['tired'], text: 'trực đêm xong buồn ngủ quá', distress: 6, minutes: 5 });
  eq('mệt sau trực: gợi ý đầu là Nghỉ ngắn phục hồi', (await suggestionIds())[0], 'MICRO_RECOVERY');
  has('mệt sau trực: ghi chú không "cho tỉnh để trực tiếp"', await text('#main .notes'), 'cho tỉnh để trực tiếp');
  // 13. ca nặng → thẻ hỗ trợ + nhật ký
  await run({ text: 'ca băng huyết, mình thấy là lỗi của mình', distress: 6, minutes: 5 });
  check('ca nặng: thẻ cần người hỗ trợ', await exists('#main .human-card'));
  has('ca nặng: không đánh giá ca bệnh', await text('#main .notes'), 'không đánh giá ca bệnh');
  // 14. cổng nín thở khi mở từ thư viện (không qua check-in)
  for (const id of ['BOX_4444', 'BREATHE_478']) {
    await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
    await click(`#main [data-act=startEx][data-id="${id}"]`);
    check(id + ' từ thư viện: cổng xác nhận nín thở hiện', await visible('#gate'));
    check(id + ' từ thư viện: chưa hiện nút Bắt đầu thở', !(await visible('#bplay')));
    if (id === 'BOX_4444') await shot('gate-box');
  }
  // nút thay thế trên cổng → sang bài 4–6
  await click('#gate [data-act=startEx][data-id="BREATHE_46"]');
  has('cổng: "Chọn thở 4–6" → mở bài Thở 4 vào – 6 ra', await text('#main h1'), 'Thở 4 vào – 6 ra');
  // check-out "Khó chịu hơn"
  await clickText('Kết thúc → Check-out', '#main .player-foot');
  await click('[data-chip="fit"][data-code="worse"]');
  check('checkout "Khó chịu hơn": bảng dừng + tìm hỗ trợ', await exists('#worse-box .worse-panel [data-go=support]'));
  has('checkout "Khó chịu hơn": lời "quay lại thở tự nhiên"', await text('#worse-box'), 'thở tự nhiên');
  await click('#no-answer');
  await clickText('Xong ✓');
  check('done sau "khó chịu hơn": không ép thử thêm', (await text('#main')).includes('không cần thử thêm bài nào'));
  check('done: không có delta khi "không muốn trả lời"', !(await exists('#main .delta')));
  await shot('done-worse', true);
}

/* =========================================================
   Kịch bản 6: PII trong ô tự viết
   ========================================================= */
async function scPII() {
  await fresh();
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]'); await click('#pause-btn');
  await expectScreen('checkin');
  const cases = [
    ['giường 12', 'giường 12', 'số giường/phòng'],
    ['0912345678', '0912345678', 'số điện thoại'],
    ['BN Nguyễn Văn A', 'BN Nguyễn Văn A', 'có thể là tên người'],
    ['mã bệnh án 123456', '123456', 'mã hồ sơ'],
    ['chị Lan ở phòng 3', 'chị Lan', 'có thể là tên người'],
    ['liên hệ bs.thong@benhvien.vn', 'bs.thong@benhvien.vn', 'email'],
    ['sản phụ Trần Thị Hoa buồng 7B', 'sản phụ Trần Thị Hoa', 'có thể là tên người']
  ];
  const backToCheckin = async () => { if ((await screen()) !== 'checkin') { await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120); await goPause5FromHome(); await click('#pause-btn'); } };
  for (const [input, mark, why] of cases) {
    await backToCheckin();
    await fillCheckin({ text: input });
    await submitCheckin();
    const scr = await screen();
    eq(`PII "${input}": ở lại check-in và cảnh báo`, scr, 'checkin');
    if (scr !== 'checkin') continue; // lọt lưới → ghi nhận, sang ca kế
    const marks = await ev(`[...document.querySelectorAll('#pii-box mark')].map(m => m.textContent)`);
    check(`PII "${input}": đánh dấu "${mark}"`, marks.some(m => m.includes(mark)), marks);
    has(`PII "${input}": lý do "${why}"`, await text('#pii-box'), why);
  }
  // các biến thể tên mà regex hiện tại dễ bỏ sót (danh xưng 1 chữ + họ tên ≥ 2 chữ)
  for (const v of ['chị Trần Lan', 'BS Lê Minh', 'bé Nguyễn An', 'bác sĩ Lê Minh', 'anh Hùng', 'người nhà Phạm Văn Tèo',
    // thêm 28/10/2026 (T-03): danh xưng đứng đầu câu / viết hoa / tên có chữ cái lẻ
    'em Nguyễn Thị Hoa', 'Chị Lan Anh ở giường bên', 'BS Nguyễn Văn A la mình', 'cô Nguyễn Hoa', 'bạn Thảo Vy', 'hôm nay chị Nguyễn Lan la mình']) {
    await backToCheckin();
    await fillCheckin({ text: v }); await submitCheckin();
    const sc = await screen();
    eq(`PII tên "${v}": bị cảnh báo`, sc, 'checkin');
    if (sc === 'checkin') has(`PII tên "${v}": lý do "có thể là tên người"`, await text('#pii-box'), 'có thể là tên người');
  }
  // review lần 2: văn bản NFD (G-01), pid12345 (G-02), CCCD trùng đuôi SĐT (G-03), NBSP và "BS." (G-04)
  for (const [v, mark] of [['bệnh nhân Trần Văn Bình'.normalize('NFD'), 'Trần Văn Bình'], ['nằm giường 12'.normalize('NFD'), 'giường 12'], ['pid12345', 'pid12345'],
    ['gọi 0912345678 hoặc CCCD 912345678', '912345678'], ['anh\u00a0Nguyễn\u00a0Văn A', 'Nguyễn\u00a0Văn A'], ['BS. Lê Minh trực đêm', 'BS. Lê Minh'], ['ĐD. Hoa nói', 'ĐD. Hoa'], ['BN. Trần Văn A', 'BN. Trần Văn A']]) {
    await backToCheckin();
    await ev(`(() => { const t = document.querySelector('#narr'); t.value = ${J(v)}; t.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await submitCheckin();
    const sc = await screen();
    eq(`PII (lần 2) "${v.normalize('NFC').replace(/\u00a0/g, '⍽')}": bị cảnh báo`, sc, 'checkin');
    if (sc !== 'checkin') continue;
    const marks = await ev(`[...document.querySelectorAll('#pii-box mark')].map(m => m.textContent)`);
    const want = mark.normalize('NFC');
    if (mark === '912345678') check('G-03: báo cả CCCD 912345678 (không bị coi là một phần SĐT)', marks.includes('912345678') && marks.includes('0912345678'), marks);
    else check(`PII (lần 2): đánh dấu "${want.replace(/\u00a0/g, '⍽')}"`, marks.some(m => m.includes(want)), marks);
  }
  // không cảnh báo nhầm (T-03 gợi ý): "rapid" không phải "pid"; danh xưng cuối dòng không nối sang chữ hoa dòng sau
  // R-1 (review lần 3): dấu chấm chỉ được phép sau danh xưng viết tắt (BS., BN., ĐD.) — "em. Hôm", "chị. Lan", "mẹ. Hôm" không phải tên
  for (const v of ['test rapid xong rồi', 'nói với em\nHôm nay mệt quá', 'nói với em. Hôm nay mệt quá', 'gặp chị. Lan nói', 'mẹ. Hôm nay mệt', 'Cảm ơn chị. Hôm nay đỡ hơn',
    // G-2 (review lần 4): danh xưng viết tắt cuối câu, câu sau mở bằng từ mở câu thường gặp
    'Cảm ơn BS. Hôm nay đỡ', 'Đã báo ĐD. Hôm nay ổn', 'gặp BN. Sáng nay khỏe hơn']) {
    await backToCheckin();
    await fillCheckin({ text: v }); await submitCheckin();
    eq(`không PII "${v.replace('\n', '⏎')}": sang gợi ý`, await screen(), 'result');
  }
  await backToCheckin();
  await fillCheckin({ text: 'chị Lan ở phòng 3' }); await submitCheckin();
  has('PII: ghi rõ "Bộ lọc không thể phát hiện mọi thông tin"', await text('#pii-box'), 'không thể phát hiện mọi thông tin');
  check('PII: 3 lựa chọn sửa / xóa / gửi', (await exists('[data-act=piiEdit]')) && (await exists('[data-act=piiClear]')) && (await exists('[data-act=piiAck]')));
  await shot('pii', true);
  await click('[data-act=piiEdit]');
  check('PII: "Để tôi sửa lại" → focus ô viết', await ev(`document.activeElement && document.activeElement.id === 'narr'`));
  await page.type(' thêm');
  check('PII: gõ thêm → bảng cảnh báo ẩn', !(await exists('#pii-box .pii-panel')));
  await submitCheckin();
  await click('[data-act=piiClear]');
  eq('PII: "Xóa phần tự viết" → ô rỗng', await ev(`document.querySelector('#narr').value`), '');
  eq('PII: đếm ký tự về 0', (await text('#narr-count')).trim(), '0');
  await fillCheckin({ text: 'giường 12 trở nặng' });
  await submitCheckin();
  await click('[data-act=piiAck]');
  await expectScreen('result');
  check('PII: "Tôi đã kiểm tra, gửi tiếp" → sang gợi ý', true);
  // bỏ dấu, không phải PII thì không cảnh báo
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  await goPause5FromHome(); await click('#pause-btn');
  await fillCheckin({ text: 'Sắp tư vấn một ca khó ở Khoa Sanh, mình thấy lo' });
  await submitCheckin();
  eq('PII: câu thường (Khoa Sanh viết hoa) → không cảnh báo', await screen(), 'result');
}

/* =========================================================
   Kịch bản 7: ca biên
   ========================================================= */
async function scEdge() {
  await fresh();
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]'); await click('#pause-btn');
  // rỗng
  await submitCheckin();
  await expectScreen('result', 'check-in rỗng');
  has('rỗng: lời cảm ơn mặc định', await text('#main .summary'), 'Cảm ơn bạn đã dừng lại');
  // 2000+ ký tự
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  await goPause5FromHome(); await click('#pause-btn');
  const long = 'mệt '.repeat(520); // 2080 ký tự
  await ev(`(() => { const t = document.querySelector('#narr'); t.focus(); })()`);
  await page.type(long);
  const n = await ev(`document.querySelector('#narr').value.length`);
  check('2000+ ký tự: bị chặn ở maxlength 2000', n <= 2000, n);
  eq('2000+ ký tự: bộ đếm khớp', (await text('#narr-count')).trim(), String(n));
  await submitCheckin();
  await expectScreen('result', 'văn bản dài');
  // emoji
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  await goPause5FromHome(); await click('#pause-btn');
  await fillCheckin({ text: '😭😭 mệt 💀 <b>x</b> "quote" \'s', emotions: ['other'] });
  await submitCheckin();
  await expectScreen('result', 'emoji + ký tự đặc biệt');
  check('emoji/HTML: không chèn thẻ', !(await ev(`!!document.querySelector('#main .summary b')`)));
  // double-click nút gợi ý
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  await goPause5FromHome(); await click('#pause-btn');
  await fillCheckin({ distress: 4 });
  await ev(`(() => { const b = [...document.querySelectorAll('#main button')].find(b => b.textContent.includes('Xem gợi ý cho tôi')); b.setAttribute('data-qa', 'dbl'); })()`);
  await page.click('[data-qa="dbl"]', 2);
  await sleep(400);
  const st = await stack();
  eq('double-click "Xem gợi ý": chỉ 1 màn result trong stack (G-12)', st.filter(s => s === 'result').length, 1);
  eq('double-click "Xem gợi ý": cú thứ hai không đưa đi đâu khác, đang ở màn Gợi ý (T-21)', await screen(), 'result');
  // double-click Hoàn tất ở check-out
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  await click('#main [data-act=startEx][data-id="BREATHE_46"]');
  await clickText('Kết thúc → Check-out', '#main .player-foot');
  await ev(`(() => { const b = [...document.querySelectorAll('#main button')].find(b => b.textContent.trim() === 'Xong ✓'); b.setAttribute('data-qa', 'dbl2'); })()`);
  await page.click('[data-qa="dbl2"]', 2);
  await sleep(300);
  const scr2 = await screen();
  eq('double-click "Xong ✓": vẫn ở done, cú thứ hai không rơi trúng nút khác (T-21/N-07)', scr2, 'done');
  if (scr2 === 'result') check('double-click "Xong ✓": cú thứ hai trúng "Thử một bài khác" → quay lại gợi ý', false);
  // bấm đúp "Kết thúc → Check-out" không đẩy checkout hai lần vào stack (CR §6 gợi ý)
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  await click('#main [data-act=startEx][data-id="HUM"]');
  await ev(`document.querySelector('#main .player-foot [data-act=finishExercise]').click()`); await sleep(100);
  await ev(`STOP4P_APP.go('checkout')`); await sleep(100);
  eq('go() cùng màn hai lần → stack chỉ 1 checkout', (await stack()).filter(x => x === 'checkout').length, 1);
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  // Back của trình duyệt giữa bài
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  await click('#main [data-act=startEx][data-id="BREATHE_46"]');
  await click('#bplay');
  await sleep(500);
  await ev(`history.back()`);
  await sleep(400);
  eq('Back trình duyệt giữa bài → về thư viện', await screen(), 'library');
  await ev(`history.forward()`);
  await sleep(400);
  const afterFwd = await screen();
  eq('Forward trình duyệt sau Back → quay lại bài (T-20/N-06)', afterFwd, 'player');
  await ev(`history.back()`); await sleep(400);
  eq('Back lần nữa sau Forward → lại về thư viện (T-20)', await screen(), 'library');
  await ev(`history.back()`); await sleep(400);
  eq('Back tiếp → trang chính (stack và lịch sử khớp nhau)', await screen(), 'home');
  await ev(`history.forward()`); await sleep(400);
  eq('Forward → thư viện', await screen(), 'library');
  // nút ← của header
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  await click('#main [data-act=startEx][data-id="HUM"]');
  await click('#header [data-act=back]');
  await sleep(300);
  eq('nút ← header → về thư viện', await screen(), 'library');
  // tải lại trang giữa bài (ẩn danh) → mất phiên
  await click('#main [data-act=startEx][data-id="GROUND_54321"]');
  await page.navigate(APP_URL);
  await waitFor(`!!window.STOP4P_APP`, 8000);
  eq('tải lại giữa bài (ẩn danh) → về trang chào, mất phiên (đúng thiết kế)', await screen(), 'welcome');
  eq('tải lại: localStorage vẫn trống', (await storageKeys()).local.length, 0);
  // vào thư viện từ trang chào, chơi và hoàn tất mà chưa chọn ẩn danh/đăng nhập
  await click('#main [data-go=library]');
  await click('#main [data-act=startEx][data-id="STOP_PAUSE"]');
  check('chưa chọn chế độ: header không có dải chế độ', !(await exists('#header .mode-strip')));
  await clickText('Kết thúc → Check-out', '#main .player-foot');
  await clickText('Xong ✓');
  await clickText('Về trang chính');
  eq('chưa chọn chế độ: kết thúc → vào "home" không có chế độ (G-13)', await screen(), 'home');
  // ảnh bị chặn → emoji dự phòng ở trang chính/check-in
  check('ảnh chặn: capybara ở home thay bằng emoji', await exists('#main .greet .emoji-fallback'));
  // Hỗ trợ từ màn player
  await click('#main [data-act=startEx][data-id="BREATHE_46"]');
  await click('#header .pill-support');
  await expectScreen('support');
  await ev(`history.back()`); await sleep(300);
  eq('support → Back → về bài', await screen(), 'player');

  // T-12: ALLOW_DRAFT_CONTENT=false khi bài còn draft → gợi ý và thư viện có trạng thái rỗng giải thích, không trống trơn
  await ev(`STOP4P_CONFIG.ALLOW_DRAFT_CONTENT = false`);
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  // 29/10/2026: hai bài ngồi đã được anh Thông duyệt (approved) → vẫn hiện; mọi bài khác (draft) bị ẩn
  eq('ALLOW_DRAFT=false: thư viện chỉ còn 2 bài ngồi đã duyệt', JSON.stringify(await ev(`[...document.querySelectorAll('#main .ex-card [data-act=startEx]')].map(b => b.dataset.id)`)), '["SEATED_CALF","SOLEUS_PUSHUP"]');
  // giả lập chưa có bài nào được duyệt để giữ kiểm tra trạng thái rỗng của T-12
  await ev(`['SEATED_CALF', 'SOLEUS_PUSHUP'].forEach(id => { STOP4P_DATA.EXERCISES[id].status = 'draft'; })`);
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(100);
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  eq('T-12: thư viện (chưa bài nào duyệt) → 0 thẻ bài', await count('#main .ex-card'), 0);
  has('T-12: thư viện có lời giải thích "chờ hội đồng chuyên môn duyệt"', await text('#main .empty-content'), 'chờ hội đồng chuyên môn duyệt');
  await ev(`STOP4P_APP.state.mode = 'guest'`);
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  await goPause5FromHome(); await click('#pause-btn');
  await fillCheckin({ distress: 4 }); await submitCheckin();
  await expectScreen('result', 'gợi ý khi chưa duyệt');
  eq('T-12: gợi ý (chưa duyệt) → 0 thẻ bài', await count('#main .ex-card'), 0);
  check('T-12: gợi ý có trạng thái rỗng + nút Tìm hỗ trợ', await exists('#main .empty-content [data-go=support]'));
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  eq('N-05: trang chính (chưa duyệt) → không còn nút mở thẳng bài', await count('#main [data-act=startEx]'), 0);
  check('N-05: trang chính → ẩn khối "Cần nhanh?"', !(await visible('#main .quick')));
  await ev(`(() => { const b = document.createElement('button'); b.dataset.act = 'startEx'; b.dataset.id = 'BREATHE_46'; b.id = 'qa-fake'; document.querySelector('#main').appendChild(b); b.click(); })()`); await sleep(150);
  eq('N-05: startEx với bài chưa duyệt → không mở', await screen(), 'home');
  await ev(`STOP4P_APP.go('player', { id: 'BOX_4444' })`); await sleep(150);
  check('N-05: cổng nín thở không còn nút "Chọn thở 4–6" khi bài đó chưa duyệt', !(await exists('#gate [data-act=startEx]')));
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  // trả lại trạng thái đã duyệt của hai bài ngồi: trang chính chỉ còn chip bài đã duyệt, gợi ý sau ăn vẫn có bài chân
  await ev(`['SEATED_CALF', 'SOLEUS_PUSHUP'].forEach(id => { STOP4P_DATA.EXERCISES[id].status = 'approved'; })`);
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  eq('ALLOW_DRAFT=false: trang chính chỉ còn chip bài ngồi đã duyệt', JSON.stringify(await ev(`[...document.querySelectorAll('#main [data-act=startEx]')].map(b => b.dataset.id)`)), '["SOLEUS_PUSHUP"]');
  await goPause5FromHome(); await click('#pause-btn');
  await fillCheckin({ contexts: ['after_meal'], distress: 3 }); await submitCheckin();
  eq('ALLOW_DRAFT=false + Sau khi ăn → gợi ý 2 bài ngồi đã duyệt', JSON.stringify(await suggestionIds()), '["SOLEUS_PUSHUP","SEATED_CALF"]');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  await ev(`STOP4P_CONFIG.ALLOW_DRAFT_CONTENT = true`);

  // T-23: OTP chế độ server mà máy chủ lỗi → ở lại màn số điện thoại, có đường ẩn danh (không sang màn nhập mã)
  await ev(`(() => { window.__fetch = window.fetch; window.fetch = () => Promise.reject(new Error('offline')); STOP4P_CONFIG.OTP_MODE = 'server'; })()`);
  await ev(`STOP4P_APP.go('login')`); await sleep(150);
  await typeInto('#phone', '0912345678');
  await clickText('Gửi mã ›');
  await sleep(200);
  check('T-23: OTP server lỗi → vẫn ở màn số điện thoại', (await exists('#phone')) && !(await exists('#otp')));
  has('T-23: báo lỗi mềm, gợi ý ẩn danh', await text('#phone-err'), 'chế độ ẩn danh');
  check('T-23: có link "Tôi muốn tiếp tục ẩn danh"', await exists('#main [data-act=loginAsGuest]'));
  await ev(`(() => { window.fetch = window.__fetch; STOP4P_CONFIG.OTP_MODE = 'dev-mock'; })()`);
  await click('#main [data-act=loginAsGuest]');
  check('T-23: "Tôi muốn tiếp tục ẩn danh" (đang là khách) → quay lại, không xóa phiên', (await screen()) !== 'login' && (await ev(`STOP4P_APP.state.mode`)) === 'guest');

  // T-23: đang tìm gợi ý → nút đổi chữ, có dòng trạng thái (giả lập AI chậm)
  await ev(`(() => { window.__rec = STOP4P_ENGINE.recommendWithAI; STOP4P_ENGINE.recommendWithAI = i => new Promise(r => setTimeout(() => r(window.__rec(i)), 900)); })()`);
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  await goPause5FromHome(); await click('#pause-btn');
  await ev(`document.querySelector('#submit-btn').click()`); await sleep(200);
  has('T-23: đang chờ → nút "Đang tìm gợi ý…"', await text('#submit-btn'), 'Đang tìm gợi ý');
  has('T-23: đang chờ → dòng trạng thái', await text('#rec-wait'), 'đang chọn 1–2 bài');
  check('T-23: đang chờ → nút bị khóa', await ev(`document.querySelector('#submit-btn').disabled`));
  await sleep(1200);
  eq('T-23: chờ xong → sang gợi ý', await screen(), 'result');
  await ev(`STOP4P_ENGINE.recommendWithAI = window.__rec`);
}

/* =========================================================
   Kịch bản 8: prefers-reduced-motion
   ========================================================= */
async function scReduced() {
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await fresh();
  check('reduced: matchMedia báo reduce', await ev(`matchMedia('(prefers-reduced-motion: reduce)').matches`));
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]');
  check('reduced: pause-orb có class still', await ev(`document.querySelector('.pause-orb').classList.contains('still')`));
  eq('reduced: orb animation-name none', await ev(`getComputedStyle(document.querySelector('.pause-orb')).animationName`), 'none');
  await sleep(5300);
  eq('reduced: sau 5 s nút vẫn đổi "Tiếp tục check-in ›"', (await text('#pause-btn')).trim(), 'Tiếp tục check-in ›');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  await click('#main [data-act=startEx][data-id="STOP4P_FULL"]');
  await click('#s4next');
  check('reduced: garden.still (khỉ không nhảy)', await ev(`document.querySelector('#garden').classList.contains('still')`));
  eq('reduced: khỉ animation-name none', await ev(`getComputedStyle(document.querySelector('#garden .monkey')).animationName`), 'none');
  await click('#s4map .node:nth-child(7) button');
  check('reduced: sky.still', await ev(`document.querySelector('#sky').classList.contains('still')`));
  await typeInto('#cth', 'mây'); await click('#cgo');
  eq('reduced: mây dùng fadeOut thay drift', await ev(`getComputedStyle(document.querySelector('#sky .cloud')).animationName`), 'fadeOut');
  await click('#s4map .node:nth-child(3) button');
  await hold('#hold', 1300);
  check('reduced: rồng không bật gió', !(await ev(`document.querySelector('#wind').classList.contains('blowing')`)));
  await shot('reduced-dragon');
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  await click('#main [data-act=startEx][data-id="BREATHE_46"]');
  await click('#bplay'); await sleep(700);
  eq('reduced: orb thở không phóng to (scale cố định 0.8)', await ev(`document.querySelector('#orb').style.transform`), 'scale(0.8)');
  // bài ngồi: hình bàn chân không chuyển động mượt (class still, transition ≈ 0)
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  await click('#main [data-act=startEx][data-id="SOLEUS_PUSHUP"]');
  check('reduced: bài ngồi có class still', await ev(`document.querySelector('#sstage').classList.contains('still')`));
  check('reduced: bàn chân không có transition', await ev(`parseFloat(getComputedStyle(document.querySelector('.foot-rig')).transitionDuration) < 0.01`), await ev(`getComputedStyle(document.querySelector('.foot-rig')).transitionDuration`));
  await click('#splay'); await sleep(1800);
  check('reduced: vẫn đếm nhịp bằng số (không cần chuyển động)', +(await text('#scount')) >= 1);
  await click('#splay');
  await page.send('Emulation.setEmulatedMedia', { features: [] });
}

/* =========================================================
   Kịch bản 9: bố cục 768 (và ảnh thật nếu --images)
   ========================================================= */
async function scLayout() {
  await fresh(768, 1024);
  await shot('768-welcome', true);
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  await shot('768-home', true);
  await goPause5FromHome(); await click('#pause-btn');
  check('768: không tràn ngang', await ev(`document.documentElement.scrollWidth <= 768`));
  await shot('768-checkin', true);
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  await shot('768-library', true);
  await click('#main [data-act=startEx][data-id="STOP4P_FULL"]');
  await click('#s4next');
  await shot('768-journey', true);
  // 375 không tràn ngang trên vài màn
  await fresh(375, 812);
  for (const s of ['welcome']) check('375: ' + s + ' không tràn ngang', await ev(`document.documentElement.scrollWidth <= 375`));
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]'); await click('#pause-btn');
  check('375: check-in không tràn ngang', await ev(`document.documentElement.scrollWidth <= 375`));
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  await click('#main [data-act=startEx][data-id="STOP4P_FULL"]'); await click('#s4next');
  check('375: hành trình không tràn ngang', await ev(`document.documentElement.scrollWidth <= 375`));
  // T-25: mọi nút / chip / link / thanh trượt ở check-in cao ≥ 44px; nút "Hỗ trợ" ở header ≥ 44px
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  await goPause5FromHome(); await click('#pause-btn');
  const small = await ev(`[...document.querySelectorAll('#main button, #main input[type=range]')].filter(b => { const r = b.getBoundingClientRect(); return r.height > 0 && r.height < 44; }).map(b => (b.textContent || b.id).trim().slice(0, 30) + ' ' + Math.round(b.getBoundingClientRect().height) + 'px')`);
  check('375: nút, chip, link, thanh trượt ở check-in cao ≥ 44px (T-25)', small.length === 0, small);
  check('375: nút "Hỗ trợ" header cao ≥ 44px (T-25)', await ev(`document.querySelector('#header .pill-support').getBoundingClientRect().height >= 44`));
  // T-04: tương phản AA
  await ev(CONTRAST_JS);
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  const tile = await ev(`(() => { const t = document.querySelector('.tile.main'); const cs = getComputedStyle(document.documentElement); return __ratio('#ffffff', cs.getPropertyValue('--teal-strong')); })()`);
  check('T-04: chữ trắng trên --teal-strong ≥ 4,5:1', tile >= 4.5, tile);
  const ink = await ev(`(() => { const cs = getComputedStyle(document.documentElement); return [__ratio(cs.getPropertyValue('--warm-ink'), cs.getPropertyValue('--bg')), __ratio(cs.getPropertyValue('--warm-ink'), '#ffffff'), __ratio(cs.getPropertyValue('--focus'), cs.getPropertyValue('--bg'))]; })()`);
  check('T-04: --warm-ink trên kem và trắng ≥ 4,5:1; --focus trên kem ≥ 3:1', ink[0] >= 4.5 && ink[1] >= 4.5 && ink[2] >= 3, ink);
  await click('#main [data-act=startEx][data-id="STOP4P_FULL"]');
  const cnt = await ev(`__ratio(getComputedStyle(document.querySelector('.s4-count')).color, '#ffffff')`);
  check('T-04: "CHẶNG 1/9" đạt ≥ 4,5:1 trên nền trắng', cnt >= 4.5, cnt);
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(120);
  await ev(`document.querySelector('#header [data-act=endGuest]').click()`); await sleep(150);
  await ev(CONTRAST_JS);
  const teal = await ev(`(() => { const b = document.querySelector('#main .btn.teal'); if (!b) return -1; const cs = getComputedStyle(b); return __ratio(cs.color, cs.backgroundColor); })()`);
  check('T-04: nút teal "Đăng nhập bằng số điện thoại" ≥ 4,5:1', teal >= 4.5, teal);
  const focusOutline = await ev(`(() => { const cs = getComputedStyle(document.documentElement); return cs.getPropertyValue('--focus').trim(); })()`);
  check('T-04: vòng focus dùng --focus (không còn cam --warm 2,0:1)', focusOutline.toUpperCase() === '#B86A1E', focusOutline);
}

/* =========================================================
   Kịch bản 10: quyền riêng tư của member — T-06 (soát PII trước khi lưu phần tự viết), T-08, T-10, T-11
   ========================================================= */
async function scPrivacy() {
  await fresh();
  await click('[data-go=login]');
  await typeInto('#phone', '0911222333'); await clickText('Gửi mã ›');
  await waitFor(`!!document.querySelector('.otp-code')`, 3000);
  await typeInto('#otp', (await text('.otp-code')).trim()); await clickText('Xác minh mã');
  await expectScreen('consent');
  eq('T-08: tới màn đồng ý mà localStorage vẫn trống', (await storageKeys()).local.length, 0);
  // tải lại ở màn đồng ý (giống đóng tab) → không còn gì, về trang chào
  await page.navigate(APP_URL); await waitFor(`!!window.STOP4P_APP`, 8000);
  eq('T-08: tải lại ở màn đồng ý → về trang chào', await screen(), 'welcome');
  eq('T-08: tải lại ở màn đồng ý → localStorage trống', (await storageKeys()).local.length, 0);
  eq('N-02: tải lại ở màn đồng ý → sessionStorage cũng trống (không còn mã băm SĐT)', (await storageKeys()).session.length, 0);
  await click('[data-go=login]');
  await typeInto('#phone', '0911222333'); await clickText('Gửi mã ›');
  await waitFor(`!!document.querySelector('.otp-code')`, 3000);
  await typeInto('#otp', (await text('.otp-code')).trim()); await clickText('Xác minh mã');
  await expectScreen('consent');
  await click('#c-text'); await clickText('Tiếp tục');
  eq('consent xong → có 1 khóa member', (await storageKeys()).local.length, 1);
  await click('input[name=wp][value=other]'); await clickText('Lưu & tiếp tục');
  await expectScreen('pause5');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);

  // T-06: 3 lời biết ơn có tên người, người dùng nhảy sang chặng khác (không qua nút Hoàn tất) rồi kết thúc
  await click('#main [data-act=startEx][data-id="STOP4P_FULL"]');
  await click('#s4map .node:nth-child(9) button');
  await typeInto('#g0', 'Cảm ơn chị Lan giường 5 đã đỡ mình');
  await click('#s4map .node:nth-child(1) button');
  await click('#main [data-act=natural]');
  await click('#natural [data-act=finishExercise]');
  await expectScreen('checkout');
  await clickText('Xong ✓');
  eq('T-06: check-out có phần tự viết chứa tên → ở lại check-out', await screen(), 'checkout');
  check('T-06: hiện bảng PII ở check-out', await exists('#pii-gate .pii-panel'));
  has('T-06: bảng nêu "chị Lan"', await text('#pii-gate'), 'chị Lan');
  await clickText('Bỏ phần tự viết, lưu tiếp');
  await expectScreen('done');
  has('T-06: vẫn lưu hành trình', await text('#main .ok'), 'Đã lưu');
  check('T-06: "Bỏ phần tự viết" → không có tên trong localStorage', !(await ev(`JSON.stringify(localStorage).includes('Lan')`)));
  await clickText('Về trang chính');

  // lần 2: chọn "Tôi đã kiểm tra, lưu tiếp" → lưu nguyên văn (người dùng đã quyết)
  await click('#main [data-act=startEx][data-id="STOP4P_FULL"]');
  await click('#s4map .node:nth-child(9) button');
  await typeInto('#g0', 'Cảm ơn anh Tuấn');
  await click('#s4next');
  check('T-06: bấm "Hoàn tất" ở chặng biết ơn có tên → cảnh báo tại chỗ', await exists('#grat-pii .pii-panel'));
  await click('#s4next');
  has('T-06: bấm lần nữa → kết hành trình', await text('.s4-end h2'), 'Bạn đã đi hết hành trình');
  await click('.s4-end [data-act=finishExercise]');
  await clickText('Xong ✓');
  eq('T-06: đã xác nhận tại chỗ → check-out không hỏi lại', await screen(), 'done');
  check('T-06: đã xác nhận → lời biết ơn được lưu', await ev(`JSON.stringify(localStorage).includes('anh Tuấn')`));
  await clickText('Về trang chính');

  // T-10: bản ghi hỏng / có mã độc trong localStorage → màn Hành trình vẫn hiện, không chạy script, còn nút xóa
  await ev(`(() => { const k = Object.keys(localStorage).find(k => k.startsWith('stop4p_member_')); const a = JSON.parse(localStorage[k]);
    a.checkins.push({ id: 'bad1', created_at: 'không phải ngày', distress_before: '</title><img src=x onerror="window.__xss=1">', distress_after: 99, exercise_ids: 'BREATHE_46', emotion_codes: null });
    a.checkins.push({ id: 'bad2', created_at: new Date().toISOString(), distress_before: 3, distress_after: 2, exercise_ids: ['KHONG_CO'], emotion_codes: ['sad'], context_codes: [], helpfulness: 'fit', narrative: '=HYPERLINK("http://x","bấm")' });
    a.checkins.push('rác'); localStorage[k] = JSON.stringify(a); })()`);
  await page.navigate(APP_URL); await waitFor(`!!window.STOP4P_APP`, 8000);
  await expectScreen('home');
  await click('#main [data-go=journey]');
  await expectScreen('journey');
  check('T-10: bản ghi hỏng → màn Hành trình vẫn có khối "Dữ liệu của bạn" và nút xóa', (await exists('#main .data-tools [data-act=askDeleteAll]')) && (await exists('#main .data-tools [data-act=askDeleteAccount]')));
  check('T-10: chuỗi HTML trong distress_before không thành thẻ, không chạy script', !(await ev(`!!document.querySelector('#main img[src="x"]') || !!window.__xss`)));
  eq('T-10: 4 mục hợp lệ được hiện (2 lần lưu + 2 bản ghi lạ đã chuẩn hóa; chuỗi rác bị bỏ)', await count('#main .j-item'), 4);
  has('T-10: bản ghi không rõ ngày gom vào "Không rõ ngày"', await text('#main'), 'Không rõ ngày');
  // T-11: xuất CSV chặn công thức
  await ev(`(() => { window.__blobs = []; URL.createObjectURL = b => { window.__blobs.push(b); return 'blob:qa'; }; HTMLAnchorElement.prototype.click = function () {}; })()`);
  await clickText('Xuất CSV');
  const csv = await ev(`window.__blobs[0].text()`);
  check('T-11: ô bắt đầu bằng "=" được chèn dấu nháy đơn', csv.includes(`"'=HYPERLINK(`) && !csv.includes(`,"=HYPERLINK(`), csv.split('\n').find(l => l.includes('HYPERLINK')));
  // dọn
  await click('[data-act=askDeleteAccount]');
  await clickText('Tôi hiểu, xóa tài khoản');
  eq('privacy: xóa tài khoản → localStorage trống', (await storageKeys()).local.length, 0);
}

/* =========================================================
   Kịch bản 11: bản công khai (không phải localhost) — T-01 phương án (a): tắt đăng nhập, chỉ còn ẩn danh
   ========================================================= */
async function scPublic() {
  await page.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await page.navigate(PUBLIC_URL);
  await ev(`(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} })()`);
  // giả lập dữ liệu đăng nhập thử còn sót từ bản demo cũ (dev-mock) trên máy dùng chung
  await ev(`(() => { localStorage.setItem('stop4p_member_' + 'a'.repeat(32), JSON.stringify({ created_at: new Date().toISOString(), phone_masked: '+849 ••• ••678', consents: [{ purpose: 'store_journal' }], profile: null, checkins: [] })); sessionStorage.setItem('stop4p_active_member', 'a'.repeat(32)); })()`);
  await page.navigate(PUBLIC_URL);
  await waitFor(`!!window.STOP4P_APP && document.querySelector('#main').dataset.screen`, 8000, 'app khởi động (bản công khai)');
  eq('public: OTP_MODE = disabled khi không phải localhost', await ev(`STOP4P_CONFIG.OTP_MODE`), 'disabled');
  eq('public: có phiên member cũ trong sessionStorage nhưng KHÔNG tự đăng nhập', await screen(), 'welcome');
  eq('N-02: bản công khai bỏ phiên cũ → sessionStorage trống', (await storageKeys()).session.length, 0);
  check('public: trang chào không có nút đăng nhập', !(await exists('#main [data-go=login]')));
  has('public: trang chào ghi "Bản demo công khai chưa có đăng nhập"', await text('#main'), 'Bản demo công khai chưa có đăng nhập');
  check('public: vẫn có "Tiếp tục ẩn danh"', await exists('#main [data-act=startGuest]'));
  await shot('public-welcome', true);
  // vào thẳng màn đăng nhập (link cũ, gõ tay) → không có ô số điện thoại
  await ev(`STOP4P_APP.go('login')`); await sleep(150);
  check('public: màn đăng nhập không có ô số điện thoại / OTP', !(await exists('#phone')) && !(await exists('#otp')) && !(await exists('.otp-code')));
  has('public: màn đăng nhập giải thích', await text('#main'), 'Bản demo công khai chưa có đăng nhập');
  await click('#main [data-act=loginAsGuest]');
  await expectScreen('profile');
  await click('[data-act=skipProfile]');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  check('public: trang chính không có tile "Muốn lưu hành trình?"', !(await exists('#main [data-go=login]')));
  await click('#main [data-act=startEx][data-id="STOP_PAUSE"]');
  await finishViaCheckout(2, 'fit');
  check('public: màn Hoàn tất không có nút "Lưu hành trình bằng số điện thoại"', !(await exists('[data-act=saveAsMember]')));
  await ev(`STOP4P_APP.go('journey')`); await sleep(150);
  check('public: Hành trình (ẩn danh) không có nút đăng nhập', !(await exists('#main [data-go=login]')));
  // màn Quyền riêng tư: cho xóa dữ liệu demo cũ còn sót
  await ev(`document.querySelector('#header [data-go=about]').click()`); await sleep(150);
  check('public: about không có banner OTP giả lập', !(await exists('#main .dev-banner')));
  check('public: about có nút xóa dữ liệu demo cũ', await exists('#main [data-act=clearDemoData]'));
  await click('#main [data-act=clearDemoData]');
  eq('public: bấm 1 lần → chưa xóa', (await storageKeys()).local.length, 1);
  eq('G-05: nhãn bấm lần 2 đọc như lời người dùng', (await text('#main [data-act=clearDemoData]')).trim(), 'Tôi hiểu, xóa hết dữ liệu demo cũ');
  await click('#main [data-act=clearDemoData]');
  has('public: toast đã xóa', await toast(), 'Đã xóa dữ liệu demo cũ');
  // (nhãn lần bấm thứ hai được kiểm trước khi bấm, xem dưới)
  const ks = await storageKeys();
  eq('public: localStorage trống sau khi xóa', ks.local.length, 0);
  eq('public: sessionStorage trống sau khi xóa', ks.session.length, 0);
  check('public: hết dữ liệu → nút xóa biến mất', !(await exists('#main [data-act=clearDemoData]')));
}


/* =========================================================
   Kịch bản 12: hai bài ngồi cho đôi chân (thiết kế mới 29/10/2026) — nhón gót / nâng gót cơ dép
   ========================================================= */
async function scSeated() {
  await fresh();
  await click('[data-act=startGuest]'); await click('[data-act=skipProfile]');
  const home = async () => { await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150); };
  await home();
  check('home: có chip "Nâng gót khi ngồi"', await exists('#main .quick [data-id="SOLEUS_PUSHUP"]'));
  // ---- Nhón gót khi ngồi, mở từ thư viện (không bối cảnh) ----
  await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
  check('library: có thẻ "Nhón gót khi ngồi" và "Nâng gót cơ dép khi ngồi"', (await exists('#main [data-act=startEx][data-id="SEATED_CALF"]')) && (await exists('#main [data-act=startEx][data-id="SOLEUS_PUSHUP"]')));
  has('library: thẻ bài ngồi có dòng an toàn riêng', await ev(`document.querySelector('[data-id="SEATED_CALF"]').closest('.ex-card').textContent`), 'Dừng ngay nếu đau bắp chân');
  has('library: bài ngồi đã duyệt (anh Thông, 29/10/2026)', await ev(`document.querySelector('[data-id="SEATED_CALF"]').closest('.ex-card').textContent`), 'Nội dung 1.0 · BS Thông (chủ dự án) duyệt theo đề xuất');
  eq('data: hai bài ngồi status approved, ngày duyệt 2026-10-29', await ev(`['SEATED_CALF', 'SOLEUS_PUSHUP'].map(id => STOP4P_DATA.EXERCISES[id].status + '@' + STOP4P_DATA.EXERCISES[id].reviewedAt).join()`), 'approved@2026-10-29,approved@2026-10-29');
  check('mô tả bài cơ dép không còn chữ tiếng Anh "soleus push-up"', !(await ev(`STOP4P_DATA.EXERCISES.SOLEUS_PUSHUP.goal`)).includes('soleus'));
  await click('#main [data-act=startEx][data-id="SEATED_CALF"]');
  await checkPlayerChrome('SEATED_CALF');
  has('CALF: dòng an toàn nêu chuột rút, đau ngực, khó thở', await text('#main .ex-safety'), 'chuột rút');
  has('CALF: nhắc tim mạch / huyết khối / chấn thương chân', await text('#main .ex-safety'), 'huyết khối');
  has('CALF: nhắc giãn tĩnh mạch nặng, đang mang thai (duyệt 29/10)', await text('#main .ex-safety'), 'giãn tĩnh mạch nặng, chấn thương chân hoặc đang mang thai');
  eq('CALF: không bối cảnh → chọn sẵn "1 hiệp"', await ev(`document.querySelector('[data-variant][aria-pressed="true"]').dataset.variant`), 'one');
  has('CALF: 1 hiệp còn 0:36', await text('#sleft'), '0:36');
  eq('CALF: chưa bắt đầu thì đếm 0', (await text('#scount')).trim(), '0');
  check('CALF: không có thẻ audio/âm thanh tự phát', !(await exists('#main audio')));
  await click('#splay');
  eq('CALF: bắt đầu → nút "❚❚ Tạm dừng"', (await text('#splay')).trim(), '❚❚ Tạm dừng');
  await sleep(3500);
  const c1 = +(await text('#scount'));
  check('CALF: sau ~3,5 s đếm được 1 lần nhón (nhịp 3 s)', c1 === 1, c1);
  const leftNow = (await text('#sleft')).trim();
  check('CALF: đồng hồ thật sự giảm (khác 0:36 ban đầu)', leftNow !== '0:36' && /^0:3[0-5]$/.test(leftNow), leftNow);
  // G-1: lấy mẫu trạng thái hình bàn chân trong hơn một nhịp 3 s → phải thấy cả "nâng" lẫn "hạ"
  const ups = [];
  for (let k = 0; k < 8; k++) { ups.push(await ev(`document.querySelector('#sstage').classList.contains('up')`)); await sleep(450); }
  check('CALF: hình bàn chân đổi trạng thái nâng ↔ hạ theo nhịp (thấy cả hai)', ups.includes(true) && ups.includes(false), JSON.stringify(ups));
  await click('#splay');
  eq('CALF: tạm dừng → "▶ Tiếp tục"', (await text('#splay')).trim(), '▶ Tiếp tục');
  const left1 = await text('#sleft'); await sleep(1200);
  eq('CALF: tạm dừng thì đồng hồ đứng yên', await text('#sleft'), left1);
  // dừng an toàn
  await click('#sstop');
  check('CALF: "Thấy khó chịu? Dừng ngay" → bảng dừng an toàn', await exists('#sstoppanel .seated-stop[role=alert]'));
  has('CALF: bảng dừng nhắc tìm hỗ trợ y tế khi đau ngực/khó thở', await text('#sstoppanel'), 'đau ngực');
  check('CALF: bảng dừng có "Tìm hỗ trợ" và "Kết thúc → Check-out"', (await exists('#sstoppanel [data-go=support]')) && (await exists('#sstoppanel [data-act=finishExercise]')));
  eq('CALF: sau khi dừng, đồng hồ không chạy', (await text('#splay')).trim(), '▶ Tiếp tục');
  // đổi sang 2 hiệp → reset, có đoạn nghỉ, "Bỏ qua đoạn này" đi hết bài
  await click('[data-variant="two"]');
  has('CALF: 2 hiệp → 0:36 × 2 + nghỉ 20 s = 1:32', await text('#sleft'), '1:32');
  eq('CALF: đổi phiên bản → đếm về 0', (await text('#scount')).trim(), '0');
  await click('#splay'); await sleep(300);
  has('CALF: "Hiệp 1/2"', await text('#sseg'), 'Hiệp 1/2');
  check('CALF: có "Bỏ qua đoạn này"', await visible('#sskip'));
  await click('#sskip');
  has('CALF: bỏ qua → đoạn nghỉ', await text('#scue'), 'Nghỉ');
  await click('#sskip');
  has('CALF: bỏ qua nghỉ → "Hiệp 2/2"', await text('#sseg'), 'Hiệp 2/2');
  await click('#sskip');
  has('CALF: hết bài → "Xong rồi"', await text('#scue'), 'Xong rồi');
  check('CALF: có nút "Xong → Check-out"', await exists('#sstoppanel .seated-done [data-act=finishExercise]'));
  await click('#sstoppanel [data-act=finishExercise]');
  await expectScreen('checkout');
  await clickText('Xong ✓');
  await expectScreen('done');
  // "Bỏ qua bài này" → check-out
  await home();
  await click('#main .quick [data-id="SOLEUS_PUSHUP"]');
  check('SOLEUS: có link "Bỏ qua bài này"', await exists('#main .player-body .link[data-act=finishExercise]'));
  eq('SOLEUS: không bối cảnh → "Giữa 2 ca" (2 phút)', await ev(`document.querySelector('[data-variant][aria-pressed="true"]').dataset.variant`), 'shift');
  has('SOLEUS: còn 2:00', await text('#sleft'), '2:00');
  await click('[data-beat="2"]');
  eq('SOLEUS: chọn nhịp 2 giây/lần', await ev(`document.querySelector('[data-beat][aria-pressed="true"]').dataset.beat`), '2');
  await click('[data-beat="1.5"]');
  await click('#splay'); await sleep(3300);
  const c2 = +(await text('#scount'));
  check('SOLEUS: nhịp 1,5 s → sau ~3,3 s đếm 2 lần nâng', c2 === 2, c2);
  // "Trở về thở tự nhiên" tạm dừng bài
  await click('#main [data-act=natural]');
  eq('SOLEUS: mở "Trở về thở tự nhiên" → bài tạm dừng', (await text('#splay')).trim(), '▶ Tiếp tục');
  await page.key('Escape'); await sleep(100);
  await click('.player-body .link[data-act=finishExercise]');
  await expectScreen('checkout');
  // ---- Gợi ý theo bối cảnh ----
  const runCk = async (o) => { await home(); await goPause5FromHome(); await click('#pause-btn'); await fillCheckin(o); await submitCheckin(); return screen(); };
  eq('bối cảnh "Sau khi ăn" → màn Gợi ý', await runCk({ contexts: ['after_meal'], distress: 3 }), 'result');
  const idsMeal = await suggestionIds();
  eq('Sau khi ăn: gợi ý đầu là Nâng gót cơ dép', idsMeal[0], 'SOLEUS_PUSHUP');
  has('Sau khi ăn: lý do nêu 10 phút', await ev(`document.querySelector('[data-id="SOLEUS_PUSHUP"]').closest('.ex-card').textContent`), '10 phút');
  has('Sau khi ăn: ghi chú an toàn bài chân', await text('#main .notes'), 'huyết khối');
  await click('#main .ex-list [data-act=startEx][data-id="SOLEUS_PUSHUP"]');
  eq('Sau khi ăn: player chọn sẵn "Sau khi ăn"', await ev(`document.querySelector('[data-variant][aria-pressed="true"]').dataset.variant`), 'meal');
  has('Sau khi ăn: tổng 10:00 (4 đoạn × 2 phút + 3 lần nghỉ 40 s)', await text('#sleft'), '10:00');
  await click('#splay'); await sleep(250);
  has('Sau khi ăn: "Đoạn 1/4"', await text('#sseg'), 'Đoạn 1/4');
  await shot('seated-soleus-meal', true);
  await click('#splay');
  eq('bối cảnh "Giữa 2 ca" → màn Gợi ý', await runCk({ contexts: ['between_shifts'], distress: 3, minutes: 3 }), 'result');
  const idsShift = await suggestionIds();
  eq('Giữa 2 ca: gợi ý đầu là Nhón gót khi ngồi', idsShift[0], 'SEATED_CALF');
  has('Giữa 2 ca: lý do nêu 1–2 phút', await ev(`document.querySelector('[data-id="SEATED_CALF"]').closest('.ex-card').textContent`), '1–2 phút');
  await click('#main .ex-list [data-act=startEx][data-id="SEATED_CALF"]');
  eq('Giữa 2 ca: player chọn sẵn "2 hiệp"', await ev(`document.querySelector('[data-variant][aria-pressed="true"]').dataset.variant`), 'two');
  await ev(`document.querySelector('#header [data-act=home]').click()`); await sleep(150);
  eq('văn bản "vừa ăn trưa xong" → tự nhận bối cảnh sau ăn', await runCk({ text: 'vừa ăn trưa xong, ngồi mãi mỏi chân', distress: 3 }), 'result');
  eq('văn bản sau ăn: gợi ý Nâng gót cơ dép', (await suggestionIds())[0], 'SOLEUS_PUSHUP');
  // luật an toàn: triệu chứng cơ thể → không gợi ý bài chân; đang làm việc cần tập trung → chỉ STOP_PAUSE
  await runCk({ contexts: ['after_meal'], text: 'hơi chóng mặt', distress: 3 });
  let seen = [];
  for (let i = 0; i < 4; i++) { seen = seen.concat(await suggestionIds()); await clickText('đổi gợi ý'); }
  check('Sau ăn + chóng mặt: không bao giờ gợi ý bài chân', !seen.some(i => ['SEATED_CALF', 'SOLEUS_PUSHUP'].includes(i)), seen);
  await runCk({ contexts: ['after_meal'], distress: 3, focus: true });
  eq('Sau ăn + đang làm việc cần tập trung: chỉ STOP_PAUSE', JSON.stringify(await suggestionIds()), '["STOP_PAUSE"]');
  await runCk({ contexts: ['after_meal'], distress: 3, minutes: 3 });
  has('Sau ăn + chỉ có 3 phút: lý do không hứa 10 phút', await ev(`document.querySelector('[data-id="SOLEUS_PUSHUP"]').closest('.ex-card').textContent`), '1–2 phút');
  await click('#main .ex-list [data-act=startEx][data-id="SOLEUS_PUSHUP"]');
  eq('Sau ăn + 3 phút: player chọn "Giữa 2 ca" (2 phút), không phải 10 phút', await ev(`document.querySelector('[data-variant][aria-pressed="true"]').dataset.variant`), 'shift');
  // ---- S-2: bối cảnh tự nhận từ văn bản tới được player ----
  eq('S-2: "an com xong…" + 15 phút → màn Gợi ý', await runCk({ text: 'an com xong ngoi mai moi chan', distress: 3, minutes: 15 }), 'result');
  has('S-2: lý do nêu 10 phút', await ev(`document.querySelector('[data-id="SOLEUS_PUSHUP"]').closest('.ex-card').textContent`), '10 phút');
  await click('#main .ex-list [data-act=startEx][data-id="SOLEUS_PUSHUP"]');
  eq('S-2: player chọn sẵn bản "Sau khi ăn" (bối cảnh suy từ văn bản)', await ev(`document.querySelector('[data-variant][aria-pressed="true"]').dataset.variant`), 'meal');
  has('S-2: còn 10:00', await text('#sleft'), '10:00');
  eq('S-2: "nghỉ giữa ca…" → màn Gợi ý', await runCk({ text: 'nghỉ giữa ca, chân mỏi', distress: 3 }), 'result');
  await click('#main .ex-list [data-act=startEx][data-id="SEATED_CALF"]');
  eq('S-2: "nghỉ giữa ca" → Nhón gót chọn sẵn "2 hiệp"', await ev(`document.querySelector('[data-variant][aria-pressed="true"]').dataset.variant`), 'two');
  // ---- G-2: rời tab thì tự tạm dừng ----
  await click('#splay'); await sleep(300);
  eq('G-2: đang chạy', (await text('#splay')).trim(), '❚❚ Tạm dừng');
  await ev(`(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
  eq('G-2: tab ẩn → tự tạm dừng', (await text('#splay')).trim(), '▶ Tiếp tục');
  await ev(`(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); })()`);
  eq('G-2: quay lại tab → vẫn tạm dừng, chờ người dùng bấm', (await text('#splay')).trim(), '▶ Tiếp tục');
  // ---- S-3: "an tâm / an ủi / an toàn" không phải "sau ăn" ----
  const mealCtx = await ev(`${J(['mình vừa an tâm', 'minh vua an tam mot chut', 'vừa an ủi đồng nghiệp xong', 'vua an ui dong nghiep xong', 'đã an toàn', 'sau an toan nguoi benh la uu tien', 'sâu ăn lá', 'chưa ăn trưa', 'chua an trua'])}.map(t => [t, STOP4P_ENGINE.recommend({ narrative: t }).interpreted_contexts.includes('after_meal')])`);
  mealCtx.forEach(([t, m]) => check(`S-3: "${t}" → KHÔNG ra bối cảnh sau ăn`, !m));
  // G-a / G-b / G-c (review lần 2, duyệt 29/10/2026): phủ định có chữ chen giữa, câu hỏi, cách nói "sau ăn" tự nhiên, "không được nghỉ giữa ca"
  const ctxOf = async (list, code) => ev(`${J(list)}.map(t => [t, STOP4P_ENGINE.recommend({ narrative: t }).interpreted_contexts.includes(${J(code)})])`);
  (await ctxOf(['không kịp ăn sáng rồi', 'chưa kịp ăn trưa xong ca', 'an trua chua', 'ăn trưa chưa', 'khong kip an sang roi', 'chua kip an trua xong ca'], 'after_meal'))
    .forEach(([t, m]) => check(`G-a: "${t}" → KHÔNG ra bối cảnh sau ăn`, !m));
  (await ctxOf(['ăn vội xong', 'ăn tạm hộp cơm xong', 'ăn bánh mì xong', 'bữa trưa xong', 'sau giờ ăn trưa', 'an voi xong', 'an banh mi xong', 'bua trua xong', 'sau gio an trua'], 'after_meal'))
    .forEach(([t, m]) => check(`G-b: "${t}" → bối cảnh sau ăn`, m));
  (await ctxOf(['không được nghỉ giữa ca', 'khong duoc nghi giua ca', 'chưa được nghỉ giữa ca', 'đang giữa ca trực', 'dang giua ca truc'], 'between_shifts'))
    .forEach(([t, m]) => check(`G-c / câu 4: "${t}" → KHÔNG ra bối cảnh giữa 2 ca`, !m));
  (await ctxOf(['nghỉ giữa ca, chân mỏi', 'giữa hai ca', 'nghi giua 2 ca', 'giữa các ca'], 'between_shifts'))
    .forEach(([t, m]) => check(`giữa 2 ca: "${t}" → bối cảnh giữa 2 ca`, m));
  const mealYes = await ev(`${J(['vừa ăn trưa xong', 'ăn cơm xong', 'sau bữa trưa', 'an com xong', 'vua an xong', 'an trua roi'])}.map(t => [t, STOP4P_ENGINE.recommend({ narrative: t }).interpreted_contexts.includes('after_meal')])`);
  mealYes.forEach(([t, m]) => check(`S-3: "${t}" → bối cảnh sau ăn`, m));
  // ---- S-1: chế độ khẩn không bao giờ gợi ý bài chân ----
  await home(); await goPause5FromHome(); await click('#pause-btn');
  await fillCheckin({ text: 'hom qua minh tu hai', contexts: ['after_meal'], distress: 4 }); await submitCheckin();
  eq('S-1: "hom qua minh tu hai" + Sau khi ăn → màn khẩn', await screen(), 'urgent');
  await click('[data-act=notUrgent]');
  await expectScreen('result');
  const idsU = await suggestionIds();
  check('S-1: sau "Tôi đang an toàn" → không có bài chân', !idsU.some(i => ['SEATED_CALF', 'SOLEUS_PUSHUP'].includes(i)), idsU);
  check('S-1: không có lời "sau bữa ăn"', !((await text('#main .need')) || '').includes('bữa ăn'), await text('#main .need'));
  let seenU = [];
  for (let k = 0; k < 4; k++) { await clickText('đổi gợi ý'); seenU = seenU.concat(await suggestionIds()); }
  check('S-1: đổi gợi ý 4 lần vẫn không có bài chân', !seenU.some(i => ['SEATED_CALF', 'SOLEUS_PUSHUP'].includes(i)), seenU);
  const sweep = await ev(`(() => { let n = 0, legs = 0; for (const [t] of ${J(SAFETY_BANK)}) { if (STOP4P_ENGINE.safetyCheck({ narrative: t }).support_mode !== 'urgent_or_uncertain') continue;
    for (const c of ['after_meal', 'between_shifts']) for (const m of [null, 3, 15]) for (let a = 0; a < 5; a++) { n++; legs += STOP4P_ENGINE.recommend({ narrative: t, contexts: [c], minutes: m, distress: 3 }, a).suggestions.filter(s => ['SEATED_CALF', 'SOLEUS_PUSHUP'].includes(s.exercise_id)).length; } }
    return [n, legs]; })()`);
  check(`S-1: quét mọi câu khẩn của SAFETY_BANK × 2 bối cảnh × 3 mức thời gian × 5 lần đổi (${sweep[0]} lượt) → 0 lần gợi ý bài chân`, sweep[0] > 0 && sweep[1] === 0, JSON.stringify(sweep));
  // ---- G-3: gợi ý từ AI (giả) qua cùng bộ lọc ----
  const ai = await ev(`(async () => {
    const C = STOP4P_CONFIG, f0 = window.fetch, e0 = C.AI_RECOMMEND_ENDPOINT;
    C.AI_RECOMMEND_ENDPOINT = '/api/fake-ai';
    window.fetch = async () => ({ ok: true, json: async () => ({ summary: 'AI giả', suggestions: [{ exercise_id: 'BOX_4444', reason: 'x' }, { exercise_id: 'SOLEUS_PUSHUP', reason: 'y' }] }) });
    try {
      const run = async i => { const r = await STOP4P_ENGINE.recommendWithAI(i); return { src: r.source, ids: r.suggestions.map(s => s.exercise_id) }; };
      return {
        clean: await run({ contexts: ['after_meal'], distress: 3 }),
        dizzy: await run({ narrative: 'hơi chóng mặt', contexts: ['after_meal'], distress: 3 }),
        high: await run({ contexts: ['after_meal'], distress: 8 }),
        human: await run({ contexts: ['after_meal'], distress: 9 }),
        focus: await run({ contexts: ['after_meal'], distress: 3, focusTask: true }),
        urgent: await run({ narrative: 'hom qua minh tu hai', contexts: ['after_meal'], distress: 3 })
      };
    } finally { window.fetch = f0; C.AI_RECOMMEND_ENDPOINT = e0; }
  })()`);
  check('G-3: AI giả, đầu vào bình thường → giữ cả 2 gợi ý của AI', ai.clean.src === 'ai' && ai.clean.ids.join() === 'BOX_4444,SOLEUS_PUSHUP', JSON.stringify(ai.clean));
  check('G-3: AI + chóng mặt → bỏ bài nín thở và bài chân (rơi về luật)', !ai.dizzy.ids.some(i => ['BOX_4444', 'SOLEUS_PUSHUP', 'SEATED_CALF'].includes(i)), JSON.stringify(ai.dizzy));
  check('G-3: AI + mức 8 → bỏ bài nín thở, giữ bài chân', !ai.high.ids.includes('BOX_4444') && ai.high.ids.includes('SOLEUS_PUSHUP'), JSON.stringify(ai.high));
  check('G-3: AI + cần người hỗ trợ (mức 9) → bỏ bài chân', !ai.human.ids.some(i => ['SOLEUS_PUSHUP', 'SEATED_CALF'].includes(i)), JSON.stringify(ai.human));
  check('G-3: AI + đang tập trung → không nhận gợi ý ngoài "Dừng 5 giây"', ai.focus.ids.every(i => i === 'STOP_PAUSE'), JSON.stringify(ai.focus));
  check('G-3: AI + khẩn → không gọi AI, không bài chân', ai.urgent.src === 'rules' && !ai.urgent.ids.some(i => ['SOLEUS_PUSHUP', 'SEATED_CALF'].includes(i)), JSON.stringify(ai.urgent));
  // ---- 320 px và 375 px ----
  for (const w of [320, 375]) {
    await page.send('Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 1, mobile: true });
    await sleep(200);
    for (const id of ['SEATED_CALF', 'SOLEUS_PUSHUP']) {
      await ev(`document.querySelector('#header [data-go=library]').click()`); await sleep(150);
      await click(`#main [data-act=startEx][data-id="${id}"]`);
      check(`${w}px ${id}: không tràn ngang`, await ev(`document.documentElement.scrollWidth <= ${w}`), await ev(`document.documentElement.scrollWidth`));
      const small = await ev(`[...document.querySelectorAll('#main .player-body button')].filter(b => { const r = b.getBoundingClientRect(); return r.height > 0 && r.height < 44; }).map(b => b.textContent.trim().slice(0, 24) + ' ' + Math.round(b.getBoundingClientRect().height))`);
      check(`${w}px ${id}: mọi nút trong bài cao ≥ 44px`, small.length === 0, small);
    }
  }
  await page.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  // ---- tương phản chữ nhịp và số đếm ----
  await ev(CONTRAST_JS);
  const cr = await ev(`(() => { const st = getComputedStyle(document.querySelector('#sstage')).backgroundColor; return [__ratio(getComputedStyle(document.querySelector('.seated-cue')).color, st), __ratio(getComputedStyle(document.querySelector('.seated-count b')).color, st)]; })()`);
  check('tương phản chữ nhịp và số đếm trên nền bài ≥ 4,5:1', cr[0] >= 4.5 && cr[1] >= 4.5, cr);
}

/* ===== Chạy ===== */
const SCENARIOS = { guest: scGuest, member: scMember, privacy: scPrivacy, journey: scJourney, stations: scStations, safety: scSafety, pii: scPII, edge: scEdge, reduced: scReduced, layout: scLayout, public: scPublic, seated: scSeated };
(async () => {
  // server tĩnh phải có sẵn
  try { const r = await fetch(APP_URL); if (!r.ok) throw new Error('HTTP ' + r.status); } catch (e) { console.error('Không thấy server tĩnh ở ' + APP_URL + ': ' + e.message); process.exit(2); }
  const ud = path.join(OUT, 'chrome-profile');
  const { page: p, kill } = await launch({ userDataDir: ud, width: 375, height: 812, extraArgs: ['--host-resolver-rules=MAP ' + PUBLIC_HOST + ' 127.0.0.1'] });
  page = p;
  wireLogs(page);
  if (!ALLOW_IMAGES) await page.send('Network.setBlockedURLs', { urls: BLOCKED });
  const t0 = Date.now();
  try {
    for (const [name, fn] of Object.entries(SCENARIOS)) {
      if (ONLY && !ONLY.includes(name)) continue;
      scenario = name;
      console.log('\n=== ' + name + ' ===');
      try { await fn(); } catch (e) { check('kịch bản ' + name + ' chạy trọn', false, e.stack || e.message); try { await shot('CRASH', true); } catch (e2) { /* bỏ qua */ } }
    }
  } finally {
    kill();
  }
  scenario = 'console';
  const realConsole = consoleLog.filter(c => !/Failed to load resource|net::ERR_BLOCKED_BY_CLIENT/.test(c.text));
  check('không có console.error / exception / warning JS trong suốt bộ test', realConsole.length === 0, JSON.stringify(realConsole.slice(0, 5)));
  check('không có tài nguyên 404 / lỗi tải cùng nguồn', httpErrors.length === 0, JSON.stringify(httpErrors.slice(0, 5)));
  const total = results.length, ok = total - fails;
  const summary = { ran_at: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), total, ok, fails, known_limits: knownLimits.length, images: ALLOW_IMAGES, results, knownLimits, consoleLog, httpErrors };
  fs.writeFileSync(path.join(OUT, 'e2e-results.json'), JSON.stringify(summary, null, 2));
  console.log('\n==== KẾT QUẢ: ' + ok + ' xanh / ' + fails + ' đỏ / ' + total + ' test (' + summary.seconds + ' s) ====');
  if (knownLimits.length) console.log('Giới hạn đã biết (không tính vào số xanh, đúng như mục 6.1 bản gộp): ' + knownLimits.length + ' câu — xem knownLimits trong JSON.');
  console.log('Ảnh: ' + SHOTS + '\nJSON: ' + path.join(OUT, 'e2e-results.json'));
  if (fails) { console.log('\nTest đỏ:'); results.filter(r => !r.ok).forEach(r => console.log(' - [' + r.scenario + '] ' + r.name + ' → ' + r.detail)); }
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
