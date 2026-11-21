/** Fixed study instrument. Rating endpoints measure a reader's experience, not prediction accuracy. */
export const STUDY_VERSION = 'SAJU-BETA-STUDY-V01';
export const CONSENT_VERSION = 'SAJU-FIXTURE-QA-CONSENT-V01';
export const CONSENT_TEXT = '가상 명식을 읽는 내부 연습입니다. 비교 글에는 연구용 대조 자료가 포함되며 평가를 마치면 구성을 확인할 수 있습니다. 점수·선택·의견은 무작위 참여 번호로 기록합니다. 참여 시작 후 7일이 지나면 기록이 만료됩니다. 실행 중에는 매시간, 컴퓨터가 꺼져 있었다면 다음 실행 때 만료 기록을 지웁니다. 이름, 연락처, 본인이나 타인의 생년월일, 상담 사례는 쓰지 마세요. 외부 모델로 보내지 않습니다. 본인 화면에서 철회하면 활성 응답을 삭제합니다. 세션을 잃으면 로컬 진행자에게 삭제를 요청할 수 있습니다. 내보낸 사본은 진행자가 따로 지워야 합니다.';
export const EXPERT_DECISIONS = Object.freeze(['ACCEPT','ACCEPT_WITH_QUALIFICATION','REVISE','REJECT','SCHOOL_DEPENDENT','INSUFFICIENT_EVIDENCE']);
export const CHAPTERS = Object.freeze(['ch1','ch2','ch3','ch4','ch5','ch6']);
const slots = ['1','2','3'];
const issues = ['반복·지루함','근거가 불분명함','계산 사실 불일치','포함하면 안 되는 단정','어려운 용어','접근·삭제 문제','기타'];
const question = (id,label,kind,target,required,choices) => Object.freeze({id,label,kind,target,required,...(choices?{choices:Object.freeze([...choices])}:{})});
const readerQuestions = [
  question('blindSpecificity','이 글의 설명은 얼마나 구체적인가요?','rating','slot',true),
  question('blindPersonalization','이 글은 제시한 사례만의 특징을 얼마나 잘 설명하나요?','rating','slot',true),
  question('blindPreferred','어느 글이 제시한 사례를 가장 구체적으로 설명하나요?','choice','overall',true,[...slots,'구별하기 어려움']),
  question('blindReason','비교할 때 어떤 표현이 판단에 영향을 줬나요? 차이를 찾기 어려웠다면 그 이유를 적어 주세요.','text','overall',true),
  question('chapterComprehension','이 장의 내용을 얼마나 쉽게 이해했나요?','rating','chapter',true),
  question('chapterComment','이 장에서 유용하거나 이해하기 어려웠던 문장을 알려 주세요.','text','chapter',false),
  question('comprehension','전체 리포트는 얼마나 이해하기 쉬웠나요?','rating','overall',true),
  question('personalization','제시한 명식의 특징에서 나온 설명으로 느껴졌나요?','rating','overall',true),
  question('value','이 리포트의 본문에 구매할 가치가 있다고 느꼈나요?','rating','overall',true),
  question('purchaseIntent','실제 판매된다면 현재 시점에 구매를 고려할 의향이 있나요?','choice','overall',true,['있음','조건부','없음','모르겠음']),
  question('usefulChapter','어느 장이 가장 유용했나요?','choice','overall',true,[...CHAPTERS,'없음']),
  question('longChapter','어느 장이 길거나 불필요했나요?','choice','overall',false,[...CHAPTERS,'없음']),
  question('remembered','기억에 남는 구체적인 표현이나 설명은 무엇인가요?','text','overall',false),
  question('freeDifference','무료 만세력과 달랐던 점은 무엇인가요? 차이가 없었다면 그렇게 써 주세요.','text','overall',false),
  question('abstract','추상적이거나 반복적으로 들린 표현이 있었나요?','text','overall',false),
  question('purchaseConditions','구매를 고려할 조건이나 기대하는 가격대가 있나요?','text','overall',false),
  question('declineCategory','구매를 망설이는 주된 이유를 선택해 주세요.','choice','overall',false,['무료와 비슷함','설명이 추상적임','주제 부족','신뢰 부족','가격·조건 미정','기타','해당 없음']),
  question('declineReason','구매를 망설이거나 거절하게 된 가장 큰 이유는 무엇인가요?','text','overall',false)
];
const expertQuestions = [
  question('qualification','검토 경험의 주된 유형을 선택해 주세요.','choice','overall',true,['명리 연구·교육','명리 상담·실무','연구와 실무','기타','응답 보류']),
  question('experience','관련 경험은 어느 범위인가요?','choice','overall',true,['3년 미만','3~9년','10년 이상','응답 보류']),
  question('school','주요 해석 관점을 선택해 주세요.','choice','overall',true,['월령·격국 중심','억부 중심','조후 중심','복수 관점','기타','응답 보류']),
  ...[
    ['factMatch','원국 후보의 계산 사실과 문장이 일치하나요?'],
    ['policyMatch','인용 출처 및 선택 정책과 일치하나요?'],
    ['prerequisites','이 전통 해석의 적용 조건이 충족됐나요?'],
    ['counterEvidence','반대 근거와 경쟁 구조를 충분히 반영했나요?'],
    ['overstatement','문장의 단정 수준이 적절한가요?'],
    ['schoolScope','학파별 적용 범위를 적절히 밝혔나요?'],
    ['independentValue','다른 문장과 구별되는 개인화 근거가 있나요?'],
    ['disposition','이 판단을 유지·수정·보류할지 종합 의견을 선택해 주세요.']
  ].map(([id,label])=>question(id,label,'choice','claim',true,EXPERT_DECISIONS)),
  question('expertNote','참조가 필요한 반례·출처·수정 의견을 적어 주세요.','text','claim',false),
  question('exceptionDisposition','해석 문장이 없는 이 사례에서 미지원·보류 설명은 적절한가요?','choice','exception',true,EXPERT_DECISIONS),
  question('exceptionNote','자료 부족이나 시각 예외 처리에 관한 의견이 있나요?','text','exception',false)
];
const common = [
  question('issueCategory','어떤 문제가 있었나요?','choice','issue',false,issues),
  question('issueNote','문장이 있는 장이나 문제가 생긴 단계를 알려 주세요.','text','issue',false)
];
export const questionsFor = (role,arm=role==='READER'?'BLIND':'EXPERT') => {
  if (!['READER','EXPERT'].includes(role)) throw new TypeError('BETA_ROLE_INVALID');
  const instrument=role==='READER'?readerQuestions:expertQuestions;
  return Object.freeze([...instrument.filter(q=>arm!=='REPORT_ONLY'||!isBlindQuestion(q.id)),...common]);
};
export const isBlindQuestion = id => id.startsWith('blind');
export function targetsFor(question,scope) {
  switch(question.target) {
    case 'claim': return scope.claimIds;
    case 'exception': return scope.claimIds.length ? [] : ['overall'];
    case 'chapter': return CHAPTERS;
    case 'slot': return slots;
    case 'issue': return ['overall',...CHAPTERS,...scope.claimIds];
    default: return ['overall'];
  }
}
export function requiredTargets(role,scope,arm) {
  return questionsFor(role,arm).filter(q=>q.required).flatMap(q=>targetsFor(q,scope).map(targetId=>({questionId:q.id,targetId})));
}
