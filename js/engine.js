/*
 * Bộ luật gợi ý + kiểm tra an toàn + phát hiện thông tin nhạy cảm.
 * Nguyên tắc (đặc tả mục 5–6): kiểm tra an toàn bằng luật TRƯỚC; chỉ gợi ý ID trong danh mục; tối đa 2 bài;
 * không chẩn đoán; risk "none_detected" không có nghĩa là đã chứng minh an toàn.
 */
window.STOP4P_ENGINE = (() => {
  const { EXERCISES, KEYWORDS, EMOTIONS, CONTEXTS } = window.STOP4P_DATA;
  const C = window.STOP4P_CONFIG;

  const stripMarks = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const tokens = s => ' ' + s.replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';

  function hasAny(text, list, loose = true) {
    const t = tokens(loose ? stripMarks(text) : String(text || '').toLowerCase().normalize('NFC'));
    return list.some(k => t.includes(' ' + (loose ? stripMarks(k) : k.normalize('NFC')) + ' '));
  }

  /* ---------- Thông tin nhạy cảm (không thể phát hiện hết) ---------- */
  const PII_PATTERNS = [
    { re: /(?:\+?84|\b0)(?:[\s.-]?\d){9,10}\b/g, why: 'số điện thoại' },
    { re: /\b\d{6,}\b/g, why: 'dãy số dài (mã hồ sơ, CCCD…)' },
    { re: /[\w.+-]+@[\w-]+\.[\w.]+/g, why: 'email' },
    { re: /\b(?:giường|phòng|buồng)\s*(?:số\s*)?\d+[a-z]?\b/giu, why: 'số giường/phòng' },
    // "pid" không dính chữ cái hai bên: không bắt "rapid xong", vẫn bắt "pid12345" (review lần 2, G-02)
    { re: /(?:mã\s*(?:bệnh án|hồ sơ|bn)|(?<![\p{L}\p{N}])pid(?!\p{L})|số nhập viện)[:\s#]*\S+/giu, why: 'mã hồ sơ' }
  ];
  const TITLES = new Set(['bn', 'bệnh nhân', 'sản phụ', 'người bệnh', 'bé', 'chị', 'anh', 'cô', 'chú', 'bác', 'bs', 'bác sĩ', 'đd', 'dd', 'điều dưỡng',
    'hộ sinh', 'ông', 'bà', 'em', 'mẹ', 'người nhà', 'bạn', 'trưởng khoa', 'sếp']);
  // Danh xưng + Từ Viết Hoa → có thể là tên người (T-03).
  // Bản cũ dùng một regex có tiền tố tham lam nên nuốt chữ đầu của tên khi danh xưng đứng đầu câu ("BN Nguyễn Văn A" lọt).
  // Bản này tách từ rồi duyệt: tại mỗi từ thử danh xưng 2 chữ trước, 1 chữ sau; sau danh xưng là chuỗi từ Viết Hoa
  // ("Nguyễn", "Văn", cả chữ cái lẻ "A") nối nhau chỉ bằng khoảng trắng cùng dòng (dấu cách, tab, NBSP dán từ Word/Zalo)
  // — không bắt qua xuống dòng hay dấu câu. Dấu chấm sau danh xưng CHỈ cho danh xưng viết tắt ("BS. Lê Minh", "BN. …", "ĐD. …"):
  // danh xưng là từ thường ("em", "chị", "mẹ"…) hay đứng cuối câu, câu sau mở bằng chữ hoa → "nói với em. Hôm nay" không phải tên
  // (review lần 3, R-1).
  const ABBR_TITLES = new Set(['bs', 'bn', 'đd', 'dd']);
  // Review lần 4 (G-2): danh xưng viết tắt cũng có thể đứng cuối câu ("Cảm ơn BS. Hôm nay đỡ"). Nếu ngay sau dấu chấm là một từ
  // mở câu rất thường gặp thì đó là câu mới, không phải tên. Cố ý không đưa "Mai" vào (tên rất phổ biến). "Sáng" có trong danh
  // sách vì "Sáng nay" gặp nhiều hơn hẳn tên "Sáng" → chấp nhận bỏ sót "BS. Sáng" (vẫn bắt "BS Sáng" không có dấu chấm).
  const SENTENCE_START = new Set(['hôm', 'sáng', 'chiều', 'tối', 'trưa', 'đêm', 'nay', 'giờ', 'lúc', 'khi', 'sau', 'rồi', 'mình', 'tôi', 'em',
    'cảm', 'đã', 'cũng', 'vì', 'nhưng', 'và', 'còn', 'thấy', 'bạn', 'không', 'có']);
  const NAME_WORD = /^\p{Lu}\p{Ll}*$/u;
  function detectNames(text) {
    const words = [...text.matchAll(/[\p{L}\p{N}]+/gu)].map(m => ({ w: m[0], lw: m[0].toLowerCase(), s: m.index, e: m.index + m[0].length }));
    const sameLine = (a, b, dot) => (dot ? /^\.?[\p{Zs}\t]+$/u : /^[\p{Zs}\t]+$/u).test(text.slice(a.e, b.s));
    const hits = [];
    for (let i = 0; i < words.length; i++) {
      let t = 0;
      if (i + 1 < words.length && sameLine(words[i], words[i + 1]) && TITLES.has(words[i].lw + ' ' + words[i + 1].lw)) t = 2;
      else if (TITLES.has(words[i].lw)) t = 1;
      if (!t) continue;
      let j = i + t, last = -1;
      const dotOk = t === 1 && ABBR_TITLES.has(words[i].lw);
      // có dấu chấm sau danh xưng viết tắt mà từ kế là từ mở câu → câu mới, bỏ qua
      if (dotOk && j < words.length && /\./.test(text.slice(words[i].e, words[j].s)) && SENTENCE_START.has(words[j].lw)) continue;
      while (j < words.length && sameLine(words[j - 1], words[j], j === i + t && dotOk) && NAME_WORD.test(words[j].w)) { last = j; j++; }
      if (last < 0) continue;
      hits.push({ text: text.slice(words[i].s, words[last].e), why: 'có thể là tên người' });
      i = last;
    }
    return hits;
  }

  function detectPII(text) {
    if (!text) return [];
    // NFC: văn bản dạng tổ hợp (Unikey "Unicode tổ hợp", dán từ macOS) phải về dạng dựng sẵn mới khớp được "giường" (G-01)
    const str = String(text).normalize('NFC');
    let hits = [];
    for (const p of PII_PATTERNS) {
      for (const m of str.matchAll(p.re)) hits.push({ text: m[0].trim(), why: p.why, s: m.index, e: m.index + m[0].length });
    }
    // "dãy số dài" nằm BÊN TRONG vùng của một số điện thoại đã bắt thì không báo lần hai.
    // So theo vị trí, không theo chuỗi con: "gọi 0912345678 hoặc CCCD 912345678" vẫn báo cả CCCD (G-03).
    const phones = hits.filter(h => h.why === 'số điện thoại');
    hits = hits.filter(h => h.why !== 'dãy số dài (mã hồ sơ, CCCD…)' || !phones.some(ph => h.s >= ph.s && h.e <= ph.e));
    hits.push(...detectNames(str));
    const seen = new Set();
    return hits.map(h => ({ text: h.text, why: h.why })).filter(h => (seen.has(h.text) ? false : seen.add(h.text)));
  }

  /* ---------- Kiểm tra an toàn (luồng vận hành, không phải sàng lọc) ---------- */
  function safetyCheck(input) {
    const text = input.narrative || '';
    const U = KEYWORDS.urgent;
    const flat = tokens(stripMarks(text));                         // bỏ dấu, tách từ: nhóm loose, humanPatterns
    const nfc = tokens(String(text).toLowerCase().normalize('NFC')); // CÓ dấu, tách từ: strict, strictPatterns, patterns không dấu
    // Như nfc nhưng GIỮ dấu câu thành từ riêng ("." cho . ! ? ; …, "," cho dấu phẩy) để mẫu không dấu nhận ra cuối câu (lượt sửa 6)
    // CHỈ dùng cho U.patterns (mẫu không dấu). Không dùng cho strict / strictPatterns / loose / humanPatterns / detectPII: ở đó dấu phẩy
    // thành từ riêng sẽ chặn các mẫu loại trừ (như lỗi R-3 review lần 6). Mẫu nào chạy trên nfcP phải tự cho phép "(?:, )?".
    const nfcP = ' ' + String(text).toLowerCase().normalize('NFC').replace(/[.!?;…]+/g, ' . ').replace(/,+/g, ' , ')
      .replace(/[^\p{L}\p{N}.,]+/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
    // Teen code chỉ để bắt CÁC TỪ ĐÃ DUYỆT của nhóm khẩn (G-1, review lần 4); không áp cho nhóm khác.
    const nfcU = tokens(nfc.replace(/[^ ]+/g, w => (Object.hasOwn(U.teen, w) ? U.teen[w] : w))), flatU = tokens(stripMarks(nfcU));
    const has = (t, list) => list.some(k => t.includes(' ' + k + ' '));
    const urgent = has(nfcU, U.strict.map(k => k.normalize('NFC'))) || U.strictPatterns.some(re => re.test(nfcU))
      || has(flatU, U.loose) || U.patterns.some(re => re.test(nfcP));
    const human = hasAny(text, KEYWORDS.human) || hasAny(text, KEYWORDS.humanStrict, false)
      || KEYWORDS.humanPatterns.some(re => re.test(flat))
      || (input.distress ?? 0) >= 9 || (input.emotions || []).includes('empty') && (input.distress ?? 0) >= 7;
    const physical = hasAny(text, KEYWORDS.physical) || hasAny(text, KEYWORDS.physicalStrict, false);
    return {
      support_mode: urgent ? 'urgent_or_uncertain' : human ? 'needs_human_support' : 'routine',
      physical_symptoms: physical
    };
  }

  /* ---------- Suy luận nhãn tình huống từ văn bản (người dùng có thể sửa) ---------- */
  function inferContexts(input) {
    const set = new Set(input.contexts || []);
    if (input.labelsEdited) return [...set]; // người dùng đã tự sửa nhãn → tôn trọng lựa chọn đó
    const t = input.narrative || '';
    if (hasAny(t, KEYWORDS.sleep)) set.add('sleep');
    if (hasAny(t, KEYWORDS.task)) set.add('before_difficult_task');
    if (hasAny(t, KEYWORDS.fatigue)) set.add('after_shift');
    if (hasAny(t, KEYWORDS.conflict)) set.add('conflict');
    if (hasAny(t, KEYWORDS.severe)) set.add('severe_case');
    if (KEYWORDS.betweenShiftPatterns.some(re => re.test(tokens(stripMarks(t))))) set.add('between_shifts');
    if (KEYWORDS.afterMealPatterns.some(re => re.test(tokens(String(t).toLowerCase().normalize('NFC'))))) set.add('after_meal');
    return [...set];
  }

  const fits = (id, minutes) => !minutes || EXERCISES[id].min <= minutes;

  /* ---------- Gợi ý theo luật (bảng mục 5 của đặc tả) ---------- */
  function recommend(input, attempt = 0) {
    const safety = safetyCheck(input);
    const contexts = inferContexts(input);
    const emo = new Set(input.emotions || []);
    const text = input.narrative || '';
    const minutes = input.minutes || null;
    const d = input.distress ?? null;
    const fatigueRisk = (!input.labelsEdited && hasAny(text, KEYWORDS.fatigue)) || (contexts.includes('after_shift') && emo.has('tired'));
    const avoidHold = safety.physical_symptoms || (d !== null && d >= 7);
    // Bài cử động chân (nhón gót / nâng gót) bị loại khi có triệu chứng cơ thể (chóng mặt, khó thở, đau ngực…)
    const avoidMove = safety.physical_symptoms;
    const legNote = 'Bài chân: dừng ngay nếu đau bắp chân, chuột rút, chóng mặt, đau ngực hay khó thở. Có bệnh tim mạch, từng bị huyết khối, giãn tĩnh mạch nặng, chấn thương chân hoặc đang mang thai thì hỏi bác sĩ trước nhé.';

    let need, reasonMap, candidates, summary, notes = [];

    if (input.focusTask) {
      need = 'Ưu tiên an toàn khi đang làm việc cần tập trung';
      candidates = ['STOP_PAUSE'];
      summary = 'Bạn đang ở giữa một nhiệm vụ cần tập trung. Lúc này chỉ nên dừng thật ngắn nếu an toàn; các bài dài hơn để dành cho lúc nghỉ.';
      notes.push('Nếu mệt mỏi hay cảm xúc đang ảnh hưởng đến an toàn người bệnh: tạm ngừng khi có thể, báo người phụ trách và làm theo quy trình an toàn của đơn vị.');
    } else if (fatigueRisk) {
      need = 'Phục hồi và an toàn người bệnh';
      candidates = ['MICRO_RECOVERY', 'STOP_PAUSE'];
      summary = 'Có vẻ bạn đang rất mệt sau một thời gian làm việc dài. Điều cơ thể cần có thể là nghỉ thật sự, không phải cố gắng thêm.';
      notes.push('Bài thở không dùng để "cho tỉnh để trực tiếp". Nếu buồn ngủ ảnh hưởng an toàn, hãy báo người phụ trách khi có thể.');
    } else if (contexts.includes('severe_case')) {
      need = 'Kết nối và tử tế với chính mình';
      candidates = ['JOURNAL', 'GROUND_54321', 'BREATHE_46'];
      summary = 'Những ca bệnh nặng có thể để lại nhiều day dứt. Cảm xúc của bạn là phản ứng dễ hiểu của một người quan tâm.';
      notes.push('Ứng dụng không đánh giá ca bệnh hay kết luận ai có lỗi. Trò chuyện với đồng nghiệp tin cậy hoặc kênh hỗ trợ có thể giúp ích.');
      safety.ask_human = true;
    } else if (contexts.includes('sleep')) {
      need = 'Chuẩn bị cho giấc nghỉ';
      candidates = ['PMR_SHORT', 'RELAX_4STATIONS', 'JOURNAL', 'AUDIO_CALM', 'BREATHE_46'];
      summary = 'Đầu óc còn "chạy" sau ca làm việc khiến việc ngủ khó hơn. Mình thử giúp cơ thể và suy nghĩ chậm lại nhé.';
      notes.push('Các bài tập không phải là cách điều trị mất ngủ. Nếu khó ngủ kéo dài, hãy tìm hỗ trợ chuyên môn.');
    } else if (contexts.includes('before_difficult_task')) {
      need = 'Ổn định ngắn trước nhiệm vụ';
      candidates = ['STOP_PAUSE', 'BREATHE_46', 'BOX_4444'];
      summary = 'Bạn đang chuẩn bị cho một tình huống nhiều áp lực. Một khoảng dừng ngắn có thể giúp bạn vào việc vững vàng hơn.';
    } else if (contexts.includes('conflict') || emo.has('irritated')) {
      need = 'Nhận ra và chờ một nhịp trước khi phản ứng';
      candidates = ['STOP_PAUSE', 'GROUND_54321', 'JOURNAL'];
      summary = 'Sau một va chạm, cảm giác bực bội là điều tự nhiên. Tạo một khoảng cách nhỏ trước khi phản hồi có thể giúp bạn chọn điều mình thật sự muốn.';
    } else if (emo.has('empty') || safety.support_mode === 'needs_human_support') {
      need = 'Nghỉ ngơi và kết nối với người hỗ trợ';
      candidates = ['MICRO_RECOVERY', 'JOURNAL'];
      summary = 'Cảm giác trống rỗng hoặc kiệt quệ kéo dài đáng được lắng nghe nghiêm túc — bạn không cần tự mình vượt qua.';
      safety.ask_human = true;
    // Bài chân chỉ gợi ý ở chế độ thường (review bài ngồi, S-1): không bao giờ ở chế độ khẩn — kể cả sau "Tôi đang an toàn" —
    // hay cần người hỗ trợ, và không khi có triệu chứng cơ thể.
    } else if (contexts.includes('after_meal') && !avoidMove && safety.support_mode === 'routine') {
      need = 'Cho đôi chân vận động nhẹ sau bữa ăn';
      candidates = ['SOLEUS_PUSHUP', 'SEATED_CALF'];
      summary = 'Ngồi yên sau bữa ăn thì máu ở chân lưu thông chậm. Vài phút nâng gót nhịp đều ngay tại ghế là một cách vận động nhẹ nhàng.';
      notes.push(legNote);
    } else if (contexts.includes('between_shifts') && !avoidMove && safety.support_mode === 'routine') {
      need = 'Đánh thức đôi chân giữa hai ca';
      candidates = ['SEATED_CALF', 'SOLEUS_PUSHUP', 'STOP_PAUSE'];
      summary = 'Giữa hai ca, đôi chân đã đứng và đi nhiều. Một, hai phút nhón gót khi ngồi giúp bắp chân bớt mỏi trước khi vào việc tiếp.';
      notes.push(legNote);
    } else if (emo.has('tired') && (emo.has('worried') || emo.has('irritated'))) {
      need = 'Giảm căng thẳng khi mệt';
      candidates = ['BREATHE_46', 'RELAX_4STATIONS', 'PMR_SHORT', 'MICRO_RECOVERY'];
      summary = 'Bạn vừa mệt vừa căng. Một bài dịu nhẹ có thể giúp, nhưng nghỉ thật sự khi có thể vẫn quan trọng nhất.';
    } else {
      need = 'Dành một chút thời gian cho mình';
      candidates = minutes && minutes >= 8 ? ['STOP4P_FULL', 'RELAX_4STATIONS', 'BREATHE_46', 'GROUND_54321'] : ['BREATHE_46', 'GROUND_54321', 'STOP_PAUSE', 'GRATITUDE_3'];
      summary = emo.has('calm') ? 'Bạn đang khá bình ổn — một khoảnh khắc chăm sóc mình để giữ nhịp.' : 'Cảm ơn bạn đã dừng lại lắng nghe bản thân.';
    }

    if (avoidHold) candidates = candidates.filter(id => !EXERCISES[id].holdsBreath);
    if (avoidMove) candidates = candidates.filter(id => !EXERCISES[id].legMove);
    if (safety.physical_symptoms) notes.push('Nếu có chóng mặt, khó thở, đau ngực hay dấu hiệu lạ trong người, hãy ưu tiên kiểm tra sức khỏe và tìm hỗ trợ y tế.');

    // Lọc theo thời gian, xoay vòng khi người dùng bấm "đổi gợi ý"
    let pool = candidates.filter(id => fits(id, minutes));
    if (!pool.length) pool = ['STOP_PAUSE'];
    const extras = ['BREATHE_46', 'GROUND_54321', 'STOP_PAUSE', 'HUM', 'MICRO_RECOVERY', 'PMR_SHORT', 'RELAX_4STATIONS', 'STOP4P_FULL']
      .filter(id => !pool.includes(id) && fits(id, minutes) && !(avoidHold && EXERCISES[id].holdsBreath) && !(input.focusTask && id !== 'STOP_PAUSE'));
    const full = [...pool, ...extras];
    const start = (attempt * 2) % Math.max(full.length, 1);
    const ids = [full[start], full[(start + 1) % full.length]].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 2);

    return {
      support_mode: safety.support_mode,
      ask_human_support: !!safety.ask_human || safety.support_mode !== 'routine',
      summary, need, notes,
      interpreted_emotions: [...emo],
      interpreted_contexts: contexts,
      suggestions: validate(ids.map(id => ({ exercise_id: id, reason: reasonFor(id, need, minutes) }))),
      source: 'rules',
      rules_version: '0.1',
      // Bộ lọc của luật cục bộ, dùng lại cho gợi ý từ AI (review bài ngồi, G-3)
      avoid: { hold: !!avoidHold, move: !!avoidMove || safety.support_mode !== 'routine', focus: !!input.focusTask }
    };
  }

  function reasonFor(id, need, minutes) {
    const r = {
      STOP_PAUSE: 'Dừng ngắn, thả lỏng vai và hàm', BREATHE_46: 'Thở ra dài giúp dịu lại khi có thể nghỉ an toàn',
      BOX_4444: 'Nhịp đều giúp tập trung (có nín thở — tùy chọn)', BREATHE_478: 'Thở chậm trước khi nghỉ (tùy chọn)',
      HUM: 'Ngân khẽ khi ở nơi riêng tư', GROUND_54321: 'Trở về hiện tại qua giác quan', PMR_SHORT: 'Thả lỏng cơ thể sau ca dài',
      JOURNAL: 'Viết ra để thấy rõ mình cần gì', GRATITUDE_3: 'Nhận ra điều nhỏ nâng đỡ mình', AUDIO_CALM: 'Âm nền dịu để nghỉ',
      MICRO_RECOVERY: 'Nghỉ thật: nước, ăn nhẹ, vận động, hỗ trợ', STOP4P_FULL: 'Hành trình đầy đủ khi bạn có 8–10 phút',
      SEATED_CALF: 'Nhón gót khi ngồi, 1–2 phút cho bắp chân bớt mỏi',
      SOLEUS_PUSHUP: need && need.includes('bữa ăn') && (!minutes || minutes >= 10) ? 'Nâng gót nhịp đều 10 phút sau ăn, chia 4 đoạn có nghỉ' : 'Nâng gót nhịp đều 1–2 phút ngay tại ghế',
      RELAX_4STATIONS: 'Thả lỏng lần lượt hơi thở, vai gáy, mặt – hàm và tâm trí'
    };
    return r[id] || need;
  }

  // Chỉ giữ ID có trong danh mục và (nếu không cho phép bản nháp) đã được duyệt. Tối đa 2.
  function validate(list) {
    return (list || []).filter(s => s && EXERCISES[s.exercise_id] && (C.ALLOW_DRAFT_CONTENT || EXERCISES[s.exercise_id].status === 'approved')).slice(0, 2);
  }

  /* ---------- Adapter AI phía server (tùy chọn) ---------- */
  async function recommendWithAI(input) {
    const local = recommend(input);
    if (!C.AI_RECOMMEND_ENDPOINT || local.support_mode === 'urgent_or_uncertain') return local;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), C.AI_TIMEOUT_MS);
      const res = await fetch(C.AI_RECOMMEND_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', signal: ctrl.signal,
        body: JSON.stringify({
          emotion_codes: input.emotions, distress_0_10: input.distress, narrative: input.narrative,
          context_codes: input.contexts, available_minutes: input.minutes, currently_safety_critical_task: !!input.focusTask
        })
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error('http');
      const ai = await res.json();
      // G-3: gợi ý từ AI qua cùng bộ lọc với luật: không bài nín thở khi có triệu chứng / mức ≥ 7, không bài chân khi có triệu chứng
      // hay không ở chế độ thường, đang tập trung thì chỉ "Dừng 5 giây".
      const av = local.avoid || {};
      const suggestions = validate((Array.isArray(ai.suggestions) ? ai.suggestions : []).filter(x => {
        const ex = x && EXERCISES[x.exercise_id];
        if (!ex) return false;
        if (av.focus && x.exercise_id !== 'STOP_PAUSE') return false;
        return !(av.hold && ex.holdsBreath) && !(av.move && ex.legMove);
      }));
      if (!suggestions.length) return { ...local, ai_note: 'AI không trả về gợi ý hợp lệ; đang dùng gợi ý theo luật.' };
      // Luật an toàn cục bộ luôn được ưu tiên: không hạ mức hỗ trợ mà luật đã nâng.
      return {
        ...local, source: 'ai', summary: String(ai.summary || local.summary).slice(0, 300), suggestions,
        support_mode: ai.support_mode === 'urgent_or_uncertain' ? ai.support_mode : local.support_mode,
        ask_human_support: local.ask_human_support || !!ai.ask_human_support
      };
    } catch (e) {
      return { ...local, ai_note: 'Phần AI hiện không khả dụng; đang dùng gợi ý theo luật an toàn.' };
    }
  }

  const labelOf = (list, code) => (list.find(x => x.code === code) || {}).label || code;

  return {
    detectPII, safetyCheck, recommend, recommendWithAI, stripMarks,
    emotionLabel: c => labelOf(EMOTIONS, c), contextLabel: c => labelOf(CONTEXTS, c)
  };
})();
