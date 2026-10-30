/*
 * Danh mục nội dung (thư viện hoạt động, cảm xúc, tình huống) và từ khóa cho bộ luật an toàn.
 * Nội dung chuyên môn cần chủ sở hữu, nguồn, ngày rà soát và phiên bản trước khi phát hành.
 */
window.STOP4P_DATA = (() => {
  const REVIEW = { version: '0.1-draft', owner: 'Nhóm STOP-4P', reviewedBy: 'Chờ hội đồng chuyên môn duyệt', reviewedAt: null, status: 'draft' };

  const EXERCISES = {
    STOP4P_FULL: {
      title: 'Hành trình STOP-4P', icon: '🗺️', min: 8, max: 10, type: 'journey',
      goal: 'Chuỗi 9 chặng: check-in → bầy khỉ → rồng thổi chong chóng → điểm đau → thư giãn → gọi tên cảm xúc → đám mây → kết nối bản thân → 3 lời biết ơn.',
      safety: 'Có thể bỏ qua bất kỳ chặng nào. Lời biết ơn không bắt buộc, nhất là khi đang buồn hay giận.'
    },
    RELAX_4STATIONS: {
      title: '4 trạm – 1 phút bình an', icon: '🧘', min: 8, max: 10, type: 'stations',
      goal: 'Lần lượt thả lỏng hơi thở → vai gáy → mặt và hàm → tâm trí, mỗi trạm đi qua 4 nhịp: nhận biết → trải nghiệm → buông lỏng → cảm nhận.',
      safety: 'Không có thắng thua, không cần làm đúng. Mọi động tác đều nhẹ nhàng, không gây đau; có thể mở mắt và bỏ qua động tác nào không thoải mái.'
    },
    STOP_PAUSE: {
      title: 'Dừng 5 giây', icon: '✋', min: 0.5, max: 1, type: 'steps',
      goal: 'Dừng lại, thả lỏng vai và hàm, rồi chọn bước tiếp theo.',
      safety: 'Chỉ thực hiện khi có thể dừng an toàn.'
    },
    BREATHE_46: {
      title: 'Thở 4 vào – 6 ra', icon: '🌬️', min: 2, max: 5, type: 'breath',
      goal: 'Thở ra dài hơn hít vào giúp cơ thể dịu lại.',
      safety: 'Nhịp chỉ là gợi ý, không gắng sức. Bạn luôn có thể chọn thở tự nhiên.'
    },
    BOX_4444: {
      title: 'Thở hộp 4–4–4–4', icon: '⬜', min: 1, max: 3, type: 'breath', holdsBreath: true,
      goal: 'Nhịp đều giúp tập trung lại trước nhiệm vụ.',
      safety: 'Có nín thở. Chỉ chọn nếu thoải mái; không thực hành khi chóng mặt, khó thở.'
    },
    BREATHE_478: {
      title: 'Thở 4–7–8', icon: '🌙', min: 2, max: 4, type: 'breath', holdsBreath: true,
      goal: 'Nhịp thở chậm, có thể dùng lúc thư giãn trước khi nghỉ.',
      safety: 'Có nín thở; tùy chọn và không phải là cách điều trị mất ngủ. Có thể bỏ qua bất cứ lúc nào.'
    },
    HUM: {
      title: 'Ngân nga HUM', icon: '🎵', min: 1, max: 3, type: 'breath',
      goal: 'Ngân khẽ "hừmmm" theo hơi thở ra để làm chậm nhịp thở.',
      safety: 'Chỉ nên làm ở nơi riêng tư, không ảnh hưởng giao tiếp hay chăm sóc người bệnh.'
    },
    GROUND_54321: {
      title: 'Grounding 5-4-3-2-1', icon: '🌿', min: 2, max: 5, type: 'grounding',
      goal: 'Đưa sự chú ý trở về hiện tại qua các giác quan.',
      safety: 'Không cần tìm mùi/vị bằng mọi giá; có thể thay bằng nhận biết một cảm giác trong cơ thể.'
    },
    PMR_SHORT: {
      title: 'Thư giãn cơ tiến triển (ngắn)', icon: '💆', min: 5, max: 8, type: 'pmr',
      goal: 'Lần lượt siết nhẹ rồi thả lỏng từng nhóm cơ.',
      safety: 'Bỏ qua vùng đang đau hay mới bị thương; có thể chỉ thả lỏng thay cho gồng.'
    },
    JOURNAL: {
      title: 'Nhật ký ngắn', icon: '📝', min: 3, max: 7, type: 'journal',
      goal: 'Chuyện gì đã xảy ra – mình cảm thấy gì – mình cần gì.',
      safety: 'Không ghi tên, số hồ sơ hay chi tiết nhận diện người bệnh/đồng nghiệp. Chế độ ẩn danh không lưu.'
    },
    GRATITUDE_3: {
      title: 'Ba điều biết ơn', icon: '🌱', min: 2, max: 3, type: 'gratitude',
      goal: 'Nhận ra ba điều nhỏ đã nâng đỡ mình, nếu thấy phù hợp.',
      safety: 'Luôn có thể bỏ qua. Không cần phải tích cực.'
    },
    AUDIO_CALM: {
      title: 'Âm thanh thư giãn', icon: '🎧', min: 5, max: 15, type: 'audio',
      goal: 'Âm nền dịu đều, không lời, để nghỉ ngơi.',
      safety: 'Không dùng khi đang làm nhiệm vụ cần nghe tín hiệu hay cảnh báo.'
    },
    MICRO_RECOVERY: {
      title: 'Nghỉ ngắn phục hồi', icon: '☕', min: 1, max: 10, type: 'recovery',
      goal: 'Nghỉ thật: nước, ăn nhẹ, vận động nhẹ, liên hệ hỗ trợ khi cần.',
      safety: 'Bài tập không thay thế cho giấc ngủ. Nếu mệt ảnh hưởng an toàn người bệnh, hãy báo người phụ trách.'
    },
    /* ----- Bài ngồi cho đôi chân (thiết kế mới 29/10/2026, đặc tả docs/specs/stop-4p-hs-bai-ngoi-calf-soleus.md) -----
     * legMove: bài có cử động chân → bị loại khi có triệu chứng cơ thể (chóng mặt, khó thở, đau ngực…).
     * variants: các phiên bản thời lượng; player chọn sẵn theo bối cảnh check-in (giữa 2 ca / sau khi ăn). */
    SEATED_CALF: {
      title: 'Nhón gót khi ngồi', icon: '🦶', min: 1, max: 2, type: 'seated', move: 'calf', legMove: true,
      goal: 'Ngồi vững, nhón hai gót lên rồi hạ xuống chậm. Giúp máu ở bắp chân lưu thông khi bạn đứng hay ngồi lâu.',
      safety: 'Dừng ngay nếu đau bắp chân, chuột rút, chóng mặt, đau ngực hay khó thở. Có bệnh tim mạch, từng bị huyết khối, giãn tĩnh mạch nặng, chấn thương chân hoặc đang mang thai thì hỏi bác sĩ trước nhé.',
      variants: [
        { code: 'one', label: '1 hiệp', sub: '12 lần · khoảng 1 phút', segments: 1, segSec: 36, restSec: 0, beat: 3 },
        { code: 'two', label: '2 hiệp', sub: '12 lần × 2 · khoảng 2 phút', segments: 2, segSec: 36, restSec: 20, beat: 3, contexts: ['between_shifts'] }
      ]
    },
    SOLEUS_PUSHUP: {
      title: 'Nâng gót cơ dép khi ngồi', icon: '🦵', min: 1, max: 10, type: 'seated', move: 'soleus', legMove: true,
      goal: 'Mũi chân giữ trên sàn, nâng gót lên hết tầm rồi thả xuống, nhịp đều. Làm được lâu, hợp lúc giữa ca hoặc sau bữa ăn.',
      safety: 'Dừng ngay nếu đau bắp chân, chuột rút, chóng mặt, đau ngực hay khó thở. Có bệnh tim mạch, từng bị huyết khối, giãn tĩnh mạch nặng, chấn thương chân hoặc đang mang thai thì hỏi bác sĩ trước nhé.',
      variants: [
        { code: 'shift', label: 'Giữa 2 ca', sub: '2 phút liền', segments: 1, segSec: 120, restSec: 0, beat: 1.5, contexts: ['between_shifts'] },
        { code: 'meal', label: 'Sau khi ăn', sub: '10 phút · 4 đoạn, nghỉ ngắn giữa đoạn', segments: 4, segSec: 120, restSec: 40, beat: 1.5, contexts: ['after_meal'] }
      ]
    }
  };
  Object.keys(EXERCISES).forEach(id => Object.assign(EXERCISES[id], { id }, REVIEW));
  // Hai bài ngồi: anh Thông (BS, chủ dự án) duyệt "theo đề xuất hết" ngày 29/10/2026 → trạng thái approved,
  // hiện cả khi ALLOW_DRAFT_CONTENT = false. Các bài khác vẫn chờ hội đồng chuyên môn.
  const APPROVED_SEATED = { version: '1.0', owner: 'Nhóm STOP-4P', reviewedBy: 'BS Thông (chủ dự án) duyệt theo đề xuất', reviewedAt: '2026-10-29', status: 'approved' };
  ['SEATED_CALF', 'SOLEUS_PUSHUP'].forEach(id => Object.assign(EXERCISES[id], APPROVED_SEATED));

  // Ảnh từ repo nhatkymebau; emoji dùng khi không tải được ảnh.
  const EMOTIONS = [
    { code: 'worried', label: 'Lo lắng', img: 'hoang_hot.jpg', emoji: '😟' },
    { code: 'sad', label: 'Buồn', img: 'buon.jpg', emoji: '😢' },
    { code: 'irritated', label: 'Bực bội', img: 'tuc.jpg', emoji: '😠' },
    { code: 'tired', label: 'Mệt mỏi', img: 'kho_chiu.jpg', emoji: '😩' },
    { code: 'empty', label: 'Trống rỗng', img: null, emoji: '😶' },
    { code: 'calm', label: 'Bình ổn', img: 'vui.jpg', emoji: '🙂' },
    { code: 'other', label: 'Khác', img: null, emoji: '💭' }
  ];

  const CONTEXTS = [
    { code: 'sleep', label: 'Khó ngủ' },
    { code: 'before_difficult_task', label: 'Trước tình huống khó' },
    { code: 'after_shift', label: 'Sau trực' },
    { code: 'conflict', label: 'Xung đột' },
    { code: 'severe_case', label: 'Sau ca bệnh nặng' },
    { code: 'work_family', label: 'Công việc / gia đình' },
    { code: 'between_shifts', label: 'Giữa 2 ca' },
    { code: 'after_meal', label: 'Sau khi ăn' },
    { code: 'other', label: 'Khác' }
  ];

  const MINUTES = [1, 3, 5, 10, 15];

  // Mức khó chịu 0–10 → ảnh capybara (0 = dễ chịu nhất → level 10).
  const DISTRESS_LABELS = [
    'Rất dễ chịu', 'Dễ chịu', 'Khá ổn', 'Hơi căng', 'Hơi khó chịu', 'Khó chịu vừa',
    'Khá khó chịu', 'Khó chịu nhiều', 'Rất khó chịu', 'Cực kỳ khó chịu', 'Khó chịu nhất'
  ];
  // Mức căng thẳng 0–10 của module 4 trạm (hai đầu thang "rất nhẹ nhõm ↔ rất căng") — T-16.
  const TENSION_LABELS = [
    'Rất nhẹ nhõm', 'Nhẹ nhõm', 'Khá thả lỏng', 'Hơi căng', 'Căng nhẹ', 'Căng vừa',
    'Khá căng', 'Căng nhiều', 'Rất căng', 'Cực kỳ căng', 'Căng nhất'
  ];

  // Từ khóa minh họa cho bộ luật. Mọi bộ lọc đều có thể sai: luôn cho người dùng sửa/từ chối.
  // "strict" so khớp có dấu (vì "tự tử" bỏ dấu trùng "từ từ"); "loose" so khớp sau khi bỏ dấu.
  const KEYWORDS = {
    urgent: {
      // 'rạch tay', 'cắt tay' chuyển sang strictPatterns (có loại trừ) — review lần 4, K-1.
      strict: ['tự tử', 'tự sát', 'muốn chết', 'không muốn sống', 'kết thúc cuộc đời', 'kết liễu', 'tự hại', 'tự làm hại', 'làm hại bản thân',
        'nhảy lầu', 'chết cho xong', 'không còn lý do để sống', 'biến mất mãi mãi', 'làm hại người khác', 'uống thuốc để chết'],
      // Bản KHÔNG DẤU của chính các từ có dấu ở trên (không thêm khái niệm mới — review lần 3, G-2).
      // "tự tử" cố ý không có bản không dấu vì "tu tu" trùng "từ từ".
      loose: ['tu sat', 'muon chet', 'khong muon song', 'ket thuc cuoc doi', 'ket lieu', 'tu lam hai ban than', 'tu lam hai minh', 'lam hai ban than',
        'nhay lau', 'chet cho xong', 'khong con ly do de song', 'khong con ly do song', 'bien mat mai mai', 'lam hai nguoi khac', 'uong thuoc de chet'],
      // CÓ DẤU, có loại trừ (review lần 4, K-1): "rạch/cắt (cổ) tay" — trừ khi đứng sau "bị" hoặc theo sau là
      // "khi/lúc/do/vì/trong/tại/vào/ở/áo" (tai nạn khi làm việc, "cắt tay áo"). So trên chuỗi NFC chữ thường, tách từ.
      strictPatterns: [
        / (?<!bị )(?:rạch|cắt) (?:cổ )?tay (?!(?:khi|lúc|do|vì|trong|tại|vào|ở|áo) )/
      ],
      // KHÔNG DẤU, bắt từ gốc + loại trừ ngữ cảnh vô hại (review lần 3 C-1, lần 4 K-1/K-2 — theo bản mẫu proto4 của code-reviewer).
      // Chạy trên chuỗi NFC chữ thường KHÔNG bỏ dấu → chỉ khớp khi người dùng GÕ KHÔNG DẤU. Câu có dấu "Áp lực từ hai phía"
      // không bao giờ bị coi là "tự hại"; câu có dấu đã có strict / strictPatterns lo.
      // Bắt nhầm (chỉ với chữ không dấu mơ hồ, vd "ap luc tu hai phia") chỉ tốn một lần bấm "Tôi đang an toàn — đó chỉ là cách nói".
      //  1) "tu hai" — mẫu của code-reviewer (review lần 5, K-2), chỉnh theo quyết định của anh Thông 29/10/2026 (lượt sửa 6):
      //     "bắt '… nay' gần, bỏ qua khứ". Loại trừ (= coi là "từ hai…") khi ngay sau là:
      //     • giờ/phút/tiếng/tuổi/mười/trăm/nghìn/ngàn/triệu;
      //     • tuần/tháng/năm/ngày/buổi — trừ khi kèm "qua/ngoái" ("tu hai tuan nay", "tu hai thang truoc" KHÔNG khẩn);
      //     • hôm/đêm — trừ khi kèm "qua/ngoái/NAY" ("tự hại hôm nay / đêm nay / hôm qua" BẮT);
      //     • sáng — trừ khi kèm "nay/qua" HOẶC đứng cuối câu / trước dấu câu ("tu hai sang." BẮT, "tu hai sang roi" không);
      //       chiều/tối/trưa — trừ khi kèm "nay/qua";
      //     • số VIẾT BẰNG CHỮ + đơn vị thời gian, có thể có dấu phẩy trước ("tu hai, ba hom nay", "tu hai ba ngay" KHÔNG khẩn).
      //       CHỮ SỐ không được miễn: "tu hai 3 hom nay", "da tu hai 3 dem lien" vẫn khẩn (review lần 6, K-3);
      //     • đến/tới/hoặc/và/hay + SỐ ("từ hai đến ba");
      //     • người/đứa/lần — trừ khi kèm "rồi/nữa/đêm"; "cả" — trừ khi kèm "rồi/nữa/đêm/tuần/ngày/tháng/năm/buổi".
      //     Chạy trên chuỗi NFC giữ dấu câu ("." cho . ! ? ; …, "," cho dấu phẩy) để nhận ra "cuối câu".
      //  2) "rach/cat (co) tay" — trừ khi đứng sau "bi" hoặc theo sau là "khi/luc/do/vi/trong/tai/vao/o/ao", kể cả có dấu phẩy
      //     chen giữa ("cat tay, luc got tao" — review lần 6, R-3).
      patterns: [
        / tu hai (?!(?:gio|phut|tieng|tuoi|muoi|tram|nghin|ngan|trieu) |(?:tuan|thang|nam|ngay|buoi) (?!qua |ngoai )|(?:hom|dem) (?!qua |ngoai |nay )|sang (?=[^\s.,])(?!nay |qua )|(?:chieu|toi|trua) (?!nay |qua )|(?:, )?(?:mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi) (?:tuan|thang|nam|ngay|hom|buoi|dem|gio|phut|tieng) |(?:den|toi|hoac|va|hay) (?:mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|\d+) |(?:nguoi|dua|lan) (?!roi |nua |dem )|ca (?!roi |nua |dem |tuan |ngay |thang |nam |buoi ))/,
        / (?<!bi )(?:rach|cat) (?:co )?tay (?!(?:, )?(?:khi|luc|do|vi|trong|tai|vao|o|ao) )/
      ],
      // Cách viết tắt / teen code của CHÍNH các từ đã duyệt (review lần 4, G-1) — chỉ dùng khi so nhóm khẩn, không thêm khái niệm mới.
      // Thay từng từ trên chuỗi CÓ DẤU (NFC, chữ thường) TRƯỚC khi so strict và trước khi bỏ dấu cho nhóm loose.
      // Khóa giữ dấu để không nhầm: "mún" → "muốn" nhưng "mụn" (nặn mụn) thì không đổi. "mun"/"hong" không dấu vẫn đổi
      // (người gõ không dấu) — chấp nhận "nan mun chet" bắt nhầm, có nút "Tôi đang an toàn".
      teen: {
        ko: 'không', k: 'không', kh: 'không', khg: 'không', hok: 'không', 'hông': 'không', hong: 'không', hk: 'không',
        'mún': 'muốn', mun: 'muốn', 'chít': 'chết', chit: 'chết', die: 'chết',
        'tữ': 'tử', 'tựtử': 'tự tử', 'tựtữ': 'tự tử'
      }
    },
    // T-07: 'keo dai' đứng một mình bắt cả "ca mổ kéo dài" → chỉ giữ cụm có ngữ cảnh (xem humanPatterns).
    // 'bao hanh' (trùng "bảo hành") và 'khong thiet' (trùng "không thiệt") chuyển sang humanStrict có dấu,
    // nhóm bỏ dấu giữ cụm có ngữ cảnh 'bi bao hanh', 'khong thiet song' (review lần 2, N-01).
    human: ['kiet suc', 'suy sup', 'mat hung thu', 'khong chiu noi', 'tuyet vong', 'vo vong', 'nhieu tuan', 'may tuan', 'hang thang',
      'met keo dai', 'kiet suc keo dai', 'buon keo dai', 'khong ngu keo dai', 'mat ngu keo dai',
      'bi bao hanh', 'khong thiet song', 'chang thiet song',
      'bi danh', 'quay roi', 'de doa', 'khong ai hieu', 'mot minh qua', 'bat luc'],
    humanStrict: ['bạo hành', 'không thiết'],
    // "kéo dài" có ngữ cảnh, so trên chuỗi đã bỏ dấu và tách từ (review lần 3, R-2 — mẫu của code-reviewer, 17/17 bắt, 0/10 nhầm):
    //  1) trạng thái/cảm xúc (+ "này/đó/ấy/cứ/vẫn") + kéo dài: "áp lực kéo dài", "căng thẳng cứ kéo dài", "chán kéo dài"…;
    //     trừ "kéo dài thời gian" ("lo kéo dài thời gian").
    //  2) kéo dài + ÍT NHẤT MỘT lượng từ (chữ hoặc số) + tuần/tháng/năm: "kéo dài hai tuần", "kéo dài ba tháng nay", "kéo dài 3 tuần".
    //     Bỏ dấu thì "năm" (5) trùng "năm" (12 tháng), "thang" trùng "thẳng" → bắt buộc lượng từ, và loại "năm" đi với
    //     tiếng/giờ/phút/giây/rưỡi: KHÔNG bắt "Ca mổ kéo dài năm tiếng", "tới năm giờ sáng", "kéo dài thẳng tới trưa".
    humanPatterns: [
      / (?:met|met moi|kiet suc|buon|buon ba|chan|cang|cang thang|stress|ap luc|lo|lo au|lo lang|chan nan|so hai|khong ngu|mat ngu|kho ngu|tinh trang|cam giac|tam trang)(?: nay| do| ay| cu| van)? keo dai (?!thoi gian )/,
      / keo dai (?:(?:ca|nhieu|may|vai|hang|hon|gan|suot|den|toi|mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|\d+) )+(?:tuan|thang|nam)(?! (?:tieng|gio|phut|giay|ruoi) )/
    ],
    fatigue: ['buon ngu', 'ngu gat', 'thieu ngu', 'truc dem', 'truc 24', 'thuc trang', 'diu mat', 'lo mo', 'kiet suc', 'khong tinh tao', 'mat tap trung'],
    // Bối cảnh bài ngồi (không phải từ khóa an toàn): chỉ để gợi ý bài, người dùng sửa nhãn được
    // "Giữa 2 ca" (duyệt 29/10/2026 theo phương án an toàn hơn): KHÔNG nhận "giữa ca" trần — "đang giữa ca trực" là đang làm việc,
    // không phải lúc nghỉ giữa hai ca. So trên chuỗi bỏ dấu, tách từ; bỏ khi có phủ định ngay trước, kể cả một chữ chen giữa
    // ("không được nghỉ giữa ca" — review lần 2, G-c).
    betweenShiftPatterns: [
      / (?<!(?:khong|chua|chang|cha|ko|k)(?: \S+)? )(?:nghi giua ca|giua hai ca|giua 2 ca|giua cac ca|giua 2 ca truc|giua hai ca truc) /
    ],
    // "Sau khi ăn" (review bài ngồi, S-3): KHÔNG so trên chuỗi bỏ dấu (bỏ dấu thì "vừa an tâm", "an ủi", "an toàn" thành "vua an…").
    // So trên chuỗi NFC chữ thường giữ dấu, tách từ:
    //  1) có dấu: vừa/mới/đã ăn, sau (khi) ăn, ăn xong, sau bữa/buổi ăn|trưa|tối|sáng, ăn cơm/trưa/tối/sáng/no + xong/rồi;
    //  2) không dấu (chỉ khớp khi gõ không dấu): chỉ cụm có ngữ cảnh — an xong, an com/trua/toi/sang (+ xong/roi), sau bua an,
    //     vua/moi/da an + com/trua/toi/sang/xong/no. "an tam/an ui/an toan/an nhien/an khang/an binh" không bao giờ khớp.
    //  Cả hai: bỏ khi có phủ định ngay trước, kể cả một chữ chen giữa ("chưa kịp ăn trưa", "không kịp ăn sáng rồi" — G-a),
    //  và khi theo sau là "chưa/không" (câu hỏi "an trua chua").
    //  Thêm (G-b): "ăn … xong" với tối đa 3 chữ chen giữa ("ăn vội xong", "ăn tạm hộp cơm xong", "ăn bánh mì xong"),
    //  "bữa trưa/tối/sáng/ăn xong", "sau giờ ăn (trưa/tối/sáng)". Duyệt 29/10/2026 theo đề xuất.
    //  Mẫu không dấu chỉ cho chữ không dấu chen giữa ([a-z0-9]), để "vừa an ủi đồng nghiệp xong" có dấu không lọt vào.
    afterMealPatterns: [
      / (?<!(?:chưa|không|chẳng|chả)(?: \S+)? )(?:(?:vừa|mới|đã) ăn|sau (?:khi )?ăn|ăn (?:\S+ ){0,3}xong|sau (?:bữa|buổi) (?:ăn|trưa|tối|sáng)|bữa (?:trưa|tối|sáng|ăn) xong|sau giờ ăn(?: trưa| tối| sáng)?|ăn (?:cơm|trưa|tối|sáng|no) rồi) (?!chưa |không )/,
      / (?<!(?:chua|khong|chang|cha|ko|k)(?: \S+)? )(?:an (?!tam |ui |toan |nhien |khang |binh |ninh |lanh )(?:[a-z0-9]+ ){0,3}xong|an (?:com|trua|toi|sang)(?: roi)?|sau bua an|bua (?:trua|toi|sang|an) xong|sau gio an(?: trua| toi| sang)?|(?:vua|moi|da) an (?:com|trua|toi|sang|xong|no)) (?!chua |khong )/
    ],
    sleep: ['kho ngu', 'mat ngu', 'tran troc', 'khong ngu duoc', 'nam mai khong ngu', 'thuc giac'],
    task: ['ca mo', 'vao mo', 'phong mo', 'mo lay thai', 'phau thuat', 'tu van', 'bao tin xau', 'thuyet trinh', 'bao cao', 'trinh benh', 'hoi chan',
      'thu thuat', 'do sanh', 'do de', 'sanh kho', 'ca kho', 'phong van', 'di thi', 'kiem tra tay nghe'],
    conflict: ['cai nhau', 'cai lai', 'xung dot', 'bi mang', 'mang chui', 'bi la', 'khieu nai', 'nguoi nha', 'to tieng', 'bat cong', 'uc che', 'buc minh'],
    severe: ['tu vong', 'mat be', 'mat con', 'ca nang', 'bien chung', 'loi cua minh', 'tu trach', 'day dut', 'bang huyet', 'khong cuu duoc', 'sai sot', 'ay nay'],
    // Review lần 2 (N-01): trả 'hoi hop' về nhóm bỏ dấu. Bắt nhầm "hội họp" chỉ thêm một dòng nhắc và bớt bài nín thở
    // (vô hại); bỏ sót "tim hoi hop" gõ không dấu thì có thể gợi ý bài nín thở cho người đang hồi hộp.
    physical: ['chong mat', 'kho tho', 'tuc nguc', 'dau nguc', 'hoi hop', 'tim dap nhanh', 'ngat xiu', 'choang vang'],
    physicalStrict: ['hồi hộp']
  };

  return { EXERCISES, EMOTIONS, CONTEXTS, MINUTES, DISTRESS_LABELS, TENSION_LABELS, KEYWORDS };
})();
