const $ = id => document.getElementById(id);
const root = document.documentElement;
const SCREENS = ['intro', 'input', 'confirm', 'preview', 'order', 'report', 'library'];
const PROFILE_CLOCKS = {
  'kasi-api-1989-2026-local-v1': 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  'kasi-api-1962-1986-standard-local-v1': 'KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1',
  'kasi-api-1987-1988-dst-local-v1': 'KR_API_PUBLISHED_KST_DST_1987_1988_STANDARD_REFERENCE_V1',
  'kasi-api-1989-2027-solar-local-v1': 'KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2',
};
const LABELS = {};
// UI labels describe applicability, never predictive confidence or a verdict.
Object.assign(LABELS, {
  SUPPORTED: '확인된 내용', LIMITED: '제한적 해석', HOLD: '판단 보류', UNSUPPORTED: '현재 미지원',
  NEEDS_DATA: '추가 자료 필요', POLICY_UNRESOLVED: '정책 확인 필요', NEEDS_BIRTH_TIME: '출생 시각 필요',
  CALCULATED_UNDER_SELECTED_POLICIES: '선택한 정책으로 계산됨', NONEXISTENT_TIME: '존재하지 않는 기록 시각',
  OUT_OF_PROFILE_COVERAGE: '선택한 프로필의 지원 범위 밖',
  AMBIGUOUS_TIME: '두 번 존재하는 기록 시각', LIMITED_PROVIDABLE: '제한적으로 제공 가능',
  NEEDS_ADDITIONAL_INFORMATION: '추가 정보 필요', NOT_PROVIDABLE: '현재 제공 불가', FULLY_PROVIDABLE: '제공 범위 확인 필요',
  CREATED: '주문 생성', READY_FOR_TEST_CHECKOUT: '테스트 결제 준비', ELIGIBILITY_BLOCKED: '제공 조건 미충족',
  PAYMENT_PENDING: '결제 확인 대기', PAYMENT_VERIFIED: '결제 확인', CANCELLED: '취소됨',
  NOT_REQUESTED: '요청 전', NOT_STARTED: '시작 전', PENDING: '확인 대기', APPROVED: '테스트 승인 확인',
  FAILED: '테스트 실패', QUEUED: '생성 대기', GENERATING: '생성 중', VALIDATING: '결과 검증 중', COMPLETED: '완료',
  FAILED_RETRYABLE: '재시도 가능한 오류', FAILED_FINAL: '제공 불가 오류', REQUESTED: '환불 요청됨',
  UNDER_REVIEW: '환불 검토 중', REFUND_PENDING: '환불 처리 대기', REFUNDED: '테스트 환불 완료',
  REFUND_FAILED: '환불 실패 · 재시도 가능', ACTIVE: '열람 가능', REVOKED: '접근 제한',
  NONE: '없음', BLOCKED: '접근 제한', LOCKED: '제공 전', AVAILABLE: '열람 가능', EXPIRED: '보관 기간 만료',
});
const ERROR_TEXT = {
  LIVE_SALE_NOT_APPROVED: '실제 상품은 아직 판매하지 않습니다. 테스트 구매만 진행할 수 있습니다.',
  LIVE_PAYMENT_NOT_APPROVED: '실제 결제는 서버에서 차단되어 있습니다.',
  SESSION_REQUIRED: '게스트 세션이 없거나 만료됐습니다. 새로고침 후 다시 확인해 주세요. 이전 세션의 영구 복구는 지원하지 않습니다.',
  SESSION_EXPIRED: '게스트 세션이 만료됐습니다. 로그인 없는 장기 재열람은 보장하지 않습니다.',
  CSRF_REJECTED: '안전한 요청 확인에 실패했습니다. 새로고침 후 다시 진행해 주세요.',
  CSRF_INVALID: '안전한 요청 확인에 실패했습니다. 새로고침 후 다시 진행해 주세요.',
  NOT_FOUND: '접근할 수 있는 주문이나 리포트를 찾지 못했습니다.',
  ORDER_NOT_FOUND: '이 게스트 세션에서 열 수 있는 주문이 아닙니다.',
  REPORT_NOT_FOUND: '열 수 있는 리포트를 찾지 못했습니다. 생성·삭제·보관 상태를 확인해 주세요.',
  REPORT_EXPIRED: '보관 기간이 만료되어 리포트를 열 수 없습니다.',
  REPORT_ACCESS_REVOKED: '환불·취소 또는 삭제 상태에 따라 리포트 접근이 제한되었습니다.',
  ELIGIBILITY_BLOCKED: '현재 입력에서는 테스트 리포트를 생성할 수 없습니다. 제공 범위를 확인해 주세요.',
  REVIEW_NOT_CONFIRMED: '입력과 제공 범위를 먼저 확인해 주세요.',
  REVIEW_EXPIRED: '입력 확인의 유효 시간이 지났습니다. 다시 계산해 주세요.',
  PAYMENT_NOT_VERIFIED: '서버에서 결제 확인을 마친 뒤에만 리포트를 생성합니다.',
  PAYMENT_EVENT_SIGNATURE: '위조되거나 변조된 테스트 이벤트를 서버에서 거절했습니다.',
  PAYMENT_SIGNATURE_INVALID: '위조되거나 변조된 테스트 이벤트를 서버에서 거절했습니다.',
  INVALID_TRANSITION: '현재 상태에서는 이 동작을 수행할 수 없습니다. 최신 상태를 확인해 주세요.',
  POLICY_REVIEW_REQUIRED: '실제 환불 조건은 별도의 정책·법률 검토가 필요합니다.',
  REPORT_INTEGRITY_FAILED: '저장된 결과의 무결성을 확인하지 못해 열람을 중단했습니다.',
  EXPLICIT_TRADITIONAL_SEX_REQUIRED: '대운을 선택했다면 방향 계산에 사용할 전통 성별 구분을 직접 선택해 주세요.',
  EXPLICIT_CLOCK_POLICY_REQUIRED: '출생 연도에 맞는 시계·지원 프로필을 직접 선택해 주세요.',
  DATE_FORMAT_REQUIRED: '날짜를 YYYY-MM-DD 형식으로 입력해 주세요.',
  LOCAL_SERVER_UNAVAILABLE: '로컬 서버에 연결하지 못했습니다. 서버 실행 상태를 확인한 뒤 다시 시도해 주세요.',
  FAKE_EVENT_REPLAY_UNAVAILABLE: '재전송할 승인 이벤트가 아직 없습니다. 테스트 승인을 먼저 진행해 주세요.',
  REPORT_ACCESS_UNAVAILABLE: '환불·취소·삭제 또는 생성 상태에 따라 지금은 리포트를 열 수 없습니다.',
  INPUT_CONFIRMATION_REQUIRED: '입력과 계산 정책을 먼저 확인해 주세요.',
  CSRF_REQUIRED: '안전한 요청 확인에 실패했습니다. 새로고침 후 다시 진행해 주세요.',
};
const state = {csrf: null, session: null, review: null, order: null, report: null, screen: 'intro', busy: false, inputVersion: 0, poll: null, pollFailures: 0};
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
};
const label = value => LABELS[value] || String(value ?? '확인 필요');
const badge = value => el('span', `badge ${['HOLD', 'NEEDS_DATA', 'NEEDS_ADDITIONAL_INFORMATION', 'NOT_PROVIDABLE', 'AMBIGUOUS_TIME', 'NONEXISTENT_TIME', 'FAILED_RETRYABLE', 'REFUND_FAILED'].includes(value) ? 'hold' : ''}`, label(value));
const hide = (id, hidden = true) => $(id).classList.toggle('hidden', hidden);
function clearMessages() { hide('error'); hide('notice'); }
function showNotice(message) { $('notice').textContent = message; hide('notice', false); }
function showError(error) {
  const code = error?.code || 'REQUEST_FAILED';
  $('error').replaceChildren(el('div', '', ERROR_TEXT[code] || '요청을 처리하지 못했습니다. 입력과 현재 상태를 확인한 뒤 다시 시도해 주세요.'), el('small', 'breakable', `확인 코드: ${code}`));
  hide('error', false); $('error').focus();
}
function stopPoll() { clearTimeout(state.poll); state.poll = null; }
function screen(name, {push = true, focus = true} = {}) {
  if (!SCREENS.includes(name)) return;
  stopPoll(); state.screen = name;
  for (const item of SCREENS) hide(`step-${item}`, item !== name);
  if (push) history.pushState({screen: name, orderId: state.order?.id ?? null}, '', `#${name}`);
  if (focus) { $('main').focus({preventScroll: true}); window.scrollTo({top: 0, behavior: 'instant'}); }
  if (name === 'order' && state.order) schedulePoll();
}
async function api(path, {method = 'GET', body} = {}) {
  const headers = {Accept: 'application/json'};
  if (method !== 'GET') { headers['Content-Type'] = 'application/json'; headers['X-CSRF-Token'] = state.csrf || ''; }
  let response;
  try { response = await fetch(path, {method, headers, credentials: 'same-origin', cache: 'no-store', ...(method !== 'GET' ? {body: JSON.stringify(body ?? {})} : {})}); }
  catch { throw {code: 'LOCAL_SERVER_UNAVAILABLE'}; }
  let payload;
  try { payload = await response.json(); } catch { throw {code: 'INVALID_SERVER_RESPONSE'}; }
  if (!response.ok) throw {code: payload?.error?.code || `HTTP_${response.status}`};
  return payload;
}
async function busy(action, button) {
  if (state.busy) return;
  state.busy = true; clearMessages(); root.classList.add('busy'); $('main').setAttribute('aria-busy', 'true');
  if (button) button.disabled = true;
  try { await action(); } catch (error) { showError(error); }
  finally { state.busy = false; root.classList.remove('busy'); $('main').removeAttribute('aria-busy'); if (button) button.disabled = false; if (state.screen === 'order' && state.order) renderOrder(state.order); }
}
function technical(title, value) {
  const details = el('details', 'technical'); details.append(el('summary', '', title));
  const body = el('div', 'technical-body'); body.append(el('pre', '', typeof value === 'string' ? value : JSON.stringify(value, null, 2))); details.append(body); return details;
}
function row(term, value) { const node = el('div', 'info-row'); node.append(el('dt', '', term), el('dd', '', value)); return node; }
function selectedText(id) { const input = $(id); return input.options?.[input.selectedIndex]?.textContent || input.value; }
function calendarChanged() { hide('leap-wrap', $('calendar').value !== 'KOREAN_LUNAR'); }
function profileChanged() { hide('dst-wrap', $('calendar-profile').value !== 'kasi-api-1987-1988-dst-local-v1'); }
function unknownChanged() { $('birth-time').disabled = $('unknown-time').checked; $('birth-time').required = !$('unknown-time').checked; }
function invalidateInput() {
  state.inputVersion++; state.review = null;
  // A previous order remains in the authenticated server-side library.
  $('confirm-input').disabled = true;
}
function fillExample() {
  invalidateInput(); $('calendar').value = 'GREGORIAN'; $('birth-date').value = '2026-01-08'; $('birth-time').value = '12:00';
  $('unknown-time').checked = false; $('leap').checked = false; $('calendar-profile').value = 'kasi-api-1989-2026-local-v1';
  $('day-rollover').value = 'CIVIL_MIDNIGHT'; $('hour-reference').value = 'SELECTED_DAY_PILLAR'; $('dst-offset').value = '';
  for (const id of ['include-dayun', 'include-seyun', 'include-monthly']) $(id).checked = false;
  calendarChanged(); profileChanged(); unknownChanged();
}
function buildRequest() {
  const profile = $('calendar-profile').value;
  if (!PROFILE_CLOCKS[profile]) throw {code: 'EXPLICIT_CLOCK_POLICY_REQUIRED'};
  const request = {
    schemaVersion: 'manseryeok-server-analysis-request-v1', analysisProfileId: 'KASI-SERVER-API-ONLY-ANALYSIS-V01',
    calendarProfileId: profile, jurisdiction: 'KR', timeZone: 'Asia/Seoul', calendar: $('calendar').value,
    time: $('unknown-time').checked ? null : $('birth-time').value,
    policies: {clockPolicyId: PROFILE_CLOCKS[profile], dayRollover: $('day-rollover').value, hourStemReference: $('hour-reference').value},
  };
  const date = $('birth-date').value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw {code: 'DATE_FORMAT_REQUIRED'};
  if (request.calendar === 'GREGORIAN') request.date = date;
  else { const [lunarYear, lunarMonth, lunarDay] = date.split('-').map(Number); request.lunarDate = {lunarYear, lunarMonth, lunarDay, leap: $('leap').checked}; }
  if (profile === 'kasi-api-1987-1988-dst-local-v1') {
    request.policies.dayHourReference = 'STANDARD_KST';
    if ($('dst-offset').value) request.policies.foldOffsetMinutes = Number($('dst-offset').value);
  }
  if ($('include-dayun').checked || $('include-seyun').checked) {
    request.luckOptions = {luckPolicyId: 'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01', features: {}};
    if ($('include-dayun').checked) {
      if (!$('traditional-sex').value) throw {code: 'EXPLICIT_TRADITIONAL_SEX_REQUIRED'};
      request.luckOptions.features.dayun = {traditionalSex: $('traditional-sex').value, count: Number($('dayun-count').value)};
    }
    if ($('include-seyun').checked) request.luckOptions.features.seyun = {yearLabel: Number($('seyun-year').value)};
  }
  if ($('include-monthly').checked) request.monthlyOptions = {
    policyId: profile === 'kasi-api-1989-2027-solar-local-v1' ? 'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-EXTENDED-2027-V02' : 'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01',
    year: Number($('monthly-year').value),
  };
  return request;
}
function inputDescription(request) {
  const lunar = request.lunarDate;
  return `${request.calendar === 'KOREAN_LUNAR' ? `음력 ${lunar.lunarYear}-${String(lunar.lunarMonth).padStart(2, '0')}-${String(lunar.lunarDay).padStart(2, '0')}${lunar.leap ? ' (윤달)' : ' (평달)'}` : `양력 ${request.date}`} · ${request.time || '시각 미상'}`;
}
function eligibilityNotice(eligibility = {}) {
  const box = el('div', 'status-panel'); box.append(badge(eligibility.status || 'HOLD'));
  box.append(el('p', '', eligibility.status === 'LIMITED_PROVIDABLE' ? '계산된 명식과 지원되는 전통 해석을 제한적으로 제공합니다. 완성된 유료 상품의 제공 적격성을 뜻하지 않습니다.' : '현재 입력으로 전체 시각 리포트를 제공하지 않습니다. 필요한 정보나 자료가 확인되기 전에는 명식을 추정하지 않습니다.'));
  return box;
}
function renderConfirmation(review) {
  const request = review.input;
  const content = $('confirmation'); content.replaceChildren();
  content.append(el('h2', '', '입력한 내용'), el('p', 'reading-text', inputDescription(request)));
  const info = el('dl', 'info-grid');
  info.append(row('달력·시계', selectedText('calendar-profile')), row('일주 변경', selectedText('day-rollover')), row('시주 천간', selectedText('hour-reference')), row('계산 상태', label(review.calculationStatus)), row('원국 후보', `${review.candidateCount}개`));
  if (review.candidateCount > 1) info.append(row('절입 경계', '발표된 절입 분에 해당하는 후보를 각각 보존합니다.'));
  if (request.calendarProfileId === 'kasi-api-1987-1988-dst-local-v1') info.append(row('역사시 확인', request.policies.foldOffsetMinutes ? `선택한 오프셋 UTC+${request.policies.foldOffsetMinutes / 60}:00 · 원래 중복 가능성 보존` : '당시 오프셋 미선택 · 중복 시각이면 추가 정보 필요'));
  content.append(info, eligibilityNotice(review.eligibility));
  if (review.eligibility?.chapters?.length) {
    content.append(el('h3', '', '장별 제공 범위'));
    const list = el('ul', 'evidence-list');
    for (const item of review.eligibility.chapters) { const li = el('li'); li.append(document.createTextNode(`${item.chapter}장 · `), badge(item.status)); list.append(li); }
    content.append(list);
  }
  content.append(technical('선택 정책·입력·보류 사유 자세히 보기', {policies: request.policies, calendarProfileId: request.calendarProfileId, reasons: review.eligibility?.reasons, requiredInformation: review.eligibility?.requiredInformation}));
  $('confirm-input').disabled = false;
}
function renderCandidates(candidates = []) {
  const grid = el('div', 'candidate-grid');
  for (const candidate of candidates) {
    const card = el('section', 'candidate-card'); card.append(el('h2', '', candidates.length > 1 ? `원국 후보 ${candidate.ordinal}` : '나의 사주팔자'));
    const pillars = el('div', 'pillars');
    for (const pillar of candidate.pillars || []) {
      const item = el('div', 'pillar');
      item.append(el('small', '', {year: '연주', month: '월주', day: '일주', hour: '시주'}[pillar.role] || pillar.role), el('strong', '', `${pillar.stem}${pillar.branch}`));
      if (pillar.hangul) item.append(el('span', '', pillar.hangul));
      pillars.append(item);
    }
    card.append(pillars);
    if (candidate.day) card.append(el('p', 'reading-text', `일간 ${candidate.day.stem} · ${{WOOD: '목(木)', FIRE: '화(火)', EARTH: '토(土)', METAL: '금(金)', WATER: '수(水)'}[candidate.day.element] || candidate.day.element} · ${{YANG: '양', YIN: '음'}[candidate.day.polarity] || candidate.day.polarity}`));
    if (candidate.pattern) card.append(technical('월령 구조의 계산 근거', candidate.pattern));
    grid.append(card);
  }
  return grid;
}
function viewSections(value) { return Array.isArray(value) ? value : value?.sections || []; }
function renderPreview() {
  const review = state.review;
  const content = $('preview-content'); content.replaceChildren();
  content.append(eligibilityNotice(review.eligibility), renderCandidates(review.preview?.candidates));
  for (const text of review.preview?.opening || []) content.append(el('p', 'preview-opening', typeof text === 'string' ? text : text.text));
  for (const section of viewSections(review.preview?.sections)) {
    const node = el('section', 'panel'); node.append(el('h2', '', section.title));
    for (const block of section.blocks || []) node.append(el('p', 'reading-text', block.text));
    content.append(node);
  }
  if (!review.candidateCount) content.append(el('p', 'reading-text', '원국이 생성되지 않았으므로 개인화된 해석을 만들지 않았습니다. 입력을 수정하거나 필요한 정보를 확인해 주세요.'));
  $('test-checkout').disabled = !review.canTestCheckout;
}
function orderTitle(order) { return `테스트 주문 · ${new Date(order.createdAt).toLocaleString('ko-KR', {timeZone: 'Asia/Seoul', hour12: false})}`; }
function renderOrder(order) {
  state.order = order;
  const node = $('order-status'); node.replaceChildren(el('h2', '', orderTitle(order)));
  const states = el('ol', 'state-list');
  for (const [title, key] of [['주문', 'orderStatus'], ['결제', 'paymentStatus'], ['리포트 생성', 'generationStatus'], ['환불', 'refundStatus']]) {
    const item = el('li', key === 'generationStatus' && ['QUEUED', 'GENERATING', 'VALIDATING', 'COMPLETED'].includes(order[key]) ? 'active' : '');
    item.append(document.createTextNode(title), el('strong', '', label(order[key]))); states.append(item);
  }
  node.append(states);
  if (order.errorCode) node.append(el('p', 'status-panel', ERROR_TEXT[order.errorCode] || `처리 중 확인이 필요합니다. 확인 코드: ${order.errorCode}`));
  const explanation = order.reportAvailable ? '리포트 생성·검증·저장이 완료되었습니다. 아래에서 저장된 결과를 열 수 있습니다.' : order.generationStatus === 'COMPLETED' ? '리포트의 생성 완료 기록은 보존되어 있습니다. 현재 취소·환불·삭제 상태에 따라 결과 열람은 제한됩니다.' : ['QUEUED', 'GENERATING', 'VALIDATING'].includes(order.generationStatus) ? '서버가 실제 생성 작업 상태를 갱신합니다. 창을 닫거나 새로고침해도 주문은 보관함에서 다시 확인할 수 있습니다.' : '결제 확인과 리포트 제공은 별개의 단계입니다. 서버 확인 전에는 콘텐츠 생성을 시작하지 않습니다.';
  node.append(el('p', 'fine', explanation));
  node.append(technical('주문 식별자·상태 기록 보기', {orderId: order.id, mode: order.mode, accessStatus: order.accessStatus, history: order.history}));
  const paymentDone = ['APPROVED', 'REFUNDED'].includes(order.paymentStatus) || ['PAYMENT_VERIFIED', 'CANCELLED'].includes(order.orderStatus);
  hide('payment-controls', order.refundStatus === 'REFUNDED' || order.orderStatus === 'CANCELLED');
  for (const button of document.querySelectorAll('[data-payment]')) button.disabled = button.dataset.payment === 'duplicate' ? !paymentDone : paymentDone;
  hide('retry-generation', !order.canRetry);
  hide('read-report', !order.reportAvailable);
  hide('refund-controls', !paymentDone || order.paymentStatus === 'CANCELLED');
  $('cancel-order').disabled = order.orderStatus === 'CANCELLED';
  const refunded = order.refundStatus === 'REFUNDED';
  $('request-refund').disabled = refunded;
  $('approve-refund').disabled = refunded || !['REQUESTED', 'UNDER_REVIEW', 'REFUND_PENDING', 'REFUND_FAILED'].includes(order.refundStatus);
  $('fail-refund').disabled = refunded || !['REQUESTED', 'UNDER_REVIEW', 'REFUND_PENDING'].includes(order.refundStatus);
  if (state.screen === 'order') schedulePoll();
}
async function fetchOrder() { if (!state.order) return; renderOrder(await api(`/api/orders/${encodeURIComponent(state.order.id)}`)); }
function schedulePoll() {
  stopPoll();
  if (state.screen !== 'order' || !state.order || !['QUEUED', 'GENERATING', 'VALIDATING'].includes(state.order.generationStatus)) return;
  state.poll = setTimeout(async () => {
    try { await fetchOrder(); state.pollFailures = 0; }
    catch (error) { state.pollFailures++; stopPoll(); showError(error); }
  }, 1200);
}
async function orderAction(suffix, body = {}) {
  if (!state.order) throw {code: 'ORDER_NOT_FOUND'};
  const response = await api(`/api/orders/${encodeURIComponent(state.order.id)}/${suffix}`, {method: 'POST', body});
  renderOrder(response);
}
function renderReport(data) {
  state.report = data;
  const content = $('report-content'), toc = $('report-toc'); content.replaceChildren(); toc.replaceChildren();
  const opening = el('div', 'report-opening');
  for (const block of data.opening || []) opening.append(el('p', '', typeof block === 'string' ? block : block.text));
  content.append(opening, renderCandidates(data.candidates));
  const sections = viewSections(data.sections);
  const claims = new Map((data.claims || []).map(claim => [claim.claimId, claim]));
  for (const section of sections) {
    const id = `report-chapter-${section.chapter}`;
    const link = el('a', '', `${String(section.chapter).padStart(2, '0')} · ${section.title}`); link.href = `#${id}`;
    link.addEventListener('click', event => { event.preventDefault(); const target = $(id); target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'}); target.focus({preventScroll: true}); });
    toc.append(link);
    const article = el('section', 'report-chapter'); article.id = id;
    article.tabIndex = -1;
    article.append(el('span', 'chapter-number', `CHAPTER ${String(section.chapter).padStart(2, '0')}`), el('h2', '', section.title));
    for (const block of section.blocks || []) {
      const node = el('div', 'report-block');
      if (block.heading) node.append(el('h3', '', block.heading));
      node.append(badge(block.status), el('p', 'reading-text', block.text));
      if (block.claimRefs?.length || block.policyRefs?.length || block.factRefs?.length) node.append(technical('이 문장의 근거', {candidate: block.chartCandidateRef || block.candidateId || null, claimRefs: block.claimRefs || [block.claimId], policyRefs: block.policyRefs, factRefs: block.factRefs, status: block.status, interpretationClaims: (block.claimRefs || []).map(id => claims.get(id)).filter(Boolean)}));
      article.append(node);
    }
    content.append(article);
  }
  content.append(technical('저장된 리포트의 정책·생성 버전', {reportProfile: data.reportProfile, versions: data.versions, eligibility: data.eligibility, domainAssessments: data.domainAssessments}));
  content.append(el('p', 'fine', 'LIMITED는 선택 정책이 허용하는 제한적 해석이고, HOLD는 판단 보류입니다. 보류를 중화·불운이나 해석의 반대로 읽지 않습니다.'));
}
async function openReport() {
  if (!state.order) throw {code: 'ORDER_NOT_FOUND'};
  const response = await api(`/api/orders/${encodeURIComponent(state.order.id)}/report`);
  renderReport(response); screen('report');
}
async function showLibrary({navigate = true} = {}) {
  const response = await api('/api/orders'); const content = $('library-content'); content.replaceChildren();
  if (!response.orders?.length) { const empty = el('div', 'empty-state'); empty.append(el('h2', '', '아직 보관된 테스트 주문이 없습니다.'), el('p', '', '출생정보를 확인하고 무료 미리보기부터 시작해 보세요.')); content.append(empty); }
  for (const order of response.orders || []) {
    const item = el('article', 'library-card'), text = el('div');
    text.append(el('h2', '', orderTitle(order)), el('p', '', `결제 ${label(order.paymentStatus)} · 생성 ${label(order.generationStatus)} · 환불 ${label(order.refundStatus)}`), badge(order.accessStatus || (order.reportAvailable ? 'AVAILABLE' : 'HOLD')));
    const actions = el('div', 'actions'); const statusButton = el('button', 'secondary', '주문 상태'); statusButton.type = 'button';
    statusButton.addEventListener('click', () => busy(async () => { renderOrder(await api(`/api/orders/${encodeURIComponent(order.id)}`)); screen('order'); }, statusButton)); actions.append(statusButton);
    if (order.reportAvailable) { const read = el('button', 'primary', '리포트 다시 읽기'); read.type = 'button'; read.addEventListener('click', () => busy(async () => { state.order = order; await openReport(); }, read)); actions.append(read); }
    item.append(text, actions); content.append(item);
  }
  if (navigate) screen('library');
  return response.orders || [];
}

$('birth-form').addEventListener('input', invalidateInput);
$('birth-form').addEventListener('change', invalidateInput);
$('calendar').addEventListener('change', calendarChanged);
$('calendar-profile').addEventListener('change', profileChanged);
$('unknown-time').addEventListener('change', unknownChanged);
$('fill-example').addEventListener('click', () => { clearMessages(); fillExample(); $('birth-date').focus(); });
$('birth-form').addEventListener('submit', event => {
  event.preventDefault(); const current = state.inputVersion;
  busy(async () => {
    if (!state.csrf) throw {code: 'SESSION_REQUIRED'};
    const request = buildRequest(); const review = await api('/api/reviews', {method: 'POST', body: {request}});
    if (current !== state.inputVersion) { showNotice('계산 중 입력이 변경되었습니다. 바뀐 정보로 다시 확인해 주세요.'); return; }
    state.review = review; renderConfirmation(review); screen('confirm');
  }, $('calculate'));
});
$('confirm-input').addEventListener('click', () => busy(async () => {
  if (!state.review) throw {code: 'REVIEW_NOT_CONFIRMED'};
  await api(`/api/reviews/${encodeURIComponent(state.review.reviewId)}/confirm`, {method: 'POST'});
  renderPreview(); screen('preview');
}, $('confirm-input')));
$('test-checkout').addEventListener('click', () => busy(async () => {
  if (!state.review?.canTestCheckout) throw {code: 'ELIGIBILITY_BLOCKED'};
  const idempotencyKey = `test-web-${state.review.reviewId}`;
  const order = await api('/api/orders', {method: 'POST', body: {reviewId: state.review.reviewId, idempotencyKey, mode: 'TEST'}});
  renderOrder(order); await orderAction('checkout'); screen('order');
}, $('test-checkout')));
for (const button of document.querySelectorAll('[data-payment]')) button.addEventListener('click', () => busy(async () => {
  const action = {approve: 'APPROVE', fail: 'FAIL', delay: 'DELAY', duplicate: 'REPLAY'}[button.dataset.payment];
  await orderAction('simulate', {action});
}, button));
$('refresh-order').addEventListener('click', () => busy(fetchOrder, $('refresh-order')));
$('cancel-order').addEventListener('click', () => busy(() => orderAction('cancel'), $('cancel-order')));
$('retry-generation').addEventListener('click', () => busy(() => orderAction('retry'), $('retry-generation')));
$('read-report').addEventListener('click', () => busy(openReport, $('read-report')));
$('request-refund').addEventListener('click', () => busy(() => orderAction('refund'), $('request-refund')));
$('approve-refund').addEventListener('click', () => busy(async () => {
  if (['REQUESTED', 'REFUND_FAILED'].includes(state.order?.refundStatus)) await orderAction('refund-review');
  await orderAction('simulate', {action: 'REFUND_APPROVE'});
}, $('approve-refund')));
$('fail-refund').addEventListener('click', () => busy(async () => {
  if (state.order?.refundStatus === 'REQUESTED') await orderAction('refund-review');
  await orderAction('simulate', {action: 'REFUND_FAIL'});
}, $('fail-refund')));
$('delete-report').addEventListener('click', () => busy(async () => {
  if (!state.order) throw {code: 'ORDER_NOT_FOUND'};
  if (!window.confirm('이 테스트 리포트를 삭제할까요? 삭제된 결과는 다시 열 수 없습니다.')) return;
  await api(`/api/orders/${encodeURIComponent(state.order.id)}/report`, {method: 'DELETE'});
  state.report = null; await fetchOrder(); screen('order'); showNotice('테스트 리포트를 삭제했습니다.');
}, $('delete-report')));
$('back-order').addEventListener('click', () => busy(async () => { await fetchOrder(); screen('order'); }));
for (const id of ['open-library', 'library-after-report']) $(id).addEventListener('click', () => busy(() => showLibrary(), $(id)));
for (const id of ['start-input', 'new-report', 'library-new']) $(id).addEventListener('click', () => { clearMessages(); screen('input'); });
$('brand-link').addEventListener('click', event => { event.preventDefault(); clearMessages(); screen('intro'); });
$('show-sample').addEventListener('click', () => { hide('sample', false); $('sample').scrollIntoView({behavior: 'smooth', block: 'center'}); });
$('load-sample').addEventListener('click', () => { fillExample(); $('birth-date').value = '1992-11-24'; $('birth-time').value = '00:30'; screen('input'); });
for (const button of document.querySelectorAll('[data-back]')) button.addEventListener('click', () => { clearMessages(); screen(button.dataset.back); });
window.addEventListener('popstate', event => busy(async () => {
  const target = event.state?.screen || 'intro';
  if (target === 'library') { await showLibrary({navigate: false}); screen('library', {push: false}); }
  else if (['order', 'report'].includes(target) && event.state?.orderId) {
    renderOrder(await api(`/api/orders/${encodeURIComponent(event.state.orderId)}`));
    if (target === 'report' && state.order.reportAvailable) { renderReport(await api(`/api/orders/${encodeURIComponent(state.order.id)}/report`)); screen('report', {push: false}); }
    else screen('order', {push: false});
  } else if (['confirm', 'preview'].includes(target) && !state.review) screen('input', {push: false});
  else screen(SCREENS.includes(target) ? target : 'intro', {push: false});
}));

async function initialize() {
  calendarChanged(); profileChanged(); unknownChanged();
  try {
    state.session = await api('/api/session'); state.csrf = state.session.csrfToken;
    if (state.session.mode !== 'LOCAL_TEST_ONLY' || state.session.saleStatus !== 'NOT_FOR_SALE_YET' || !state.session.gates || Object.values(state.session.gates).some(value => value !== false)) throw {code: 'UNEXPECTED_SERVICE_MODE'};
    // No tokens or birth inputs are stored in browser storage. History carries only an opaque order ID.
    const restore = history.state;
    await showLibrary({navigate: false});
    if (restore?.orderId && ['order', 'report'].includes(restore.screen)) {
      renderOrder(await api(`/api/orders/${encodeURIComponent(restore.orderId)}`));
      if (restore.screen === 'report' && state.order.reportAvailable) { renderReport(await api(`/api/orders/${encodeURIComponent(state.order.id)}/report`)); screen('report', {push: false, focus: false}); }
      else screen('order', {push: false, focus: false});
    } else screen(location.hash === '#library' ? 'library' : 'intro', {push: false, focus: false});
  } catch (error) { screen('intro', {push: false, focus: false}); showError(error); }
}
initialize();
