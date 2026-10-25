// Synthetic fixtures only; not captured KASI data and not an astronomical oracle.
export const WEB_TEST_KEY='SYNTHETIC_WEB_QUERY_CREDENTIAL';
const names='소한 대한 입춘 우수 경칩 춘분 청명 곡우 입하 소만 망종 하지 소서 대서 입추 처서 백로 추분 한로 상강 입동 소설 대설 동지'.split(' ');
export function webTestTransport(onRequest=()=>{}){
 return async(url,signal)=>{
  if(signal.aborted)throw Error('cancelled');
  if(url.searchParams.get('ServiceKey')!==WEB_TEST_KEY)throw Error('bad test key');
  onRequest(url);
  const year=Number(url.searchParams.get('solYear'));
  const rows=url.pathname.includes('get24DivisionsInfo')?names.map((dateName,i)=>({dateName,locdate:`${year}${String(Math.floor(i/2)+1).padStart(2,'0')}${i%2?'20':'05'}`,kst:'0120',sunLongitude:(285+15*i)%360}))
   :Array.from({length:31},(_,i)=>({solYear:year,solMonth:1,solDay:i+1,lunYear:i<29?year-1:year,lunMonth:i<29?12:1,lunDay:i<29?i+1:i-28,lunNday:29,lunLeapmonth:'평',lunSecha:'갑자(甲子)',lunWolgeon:'을축(乙丑)',lunIljin:'병인(丙寅)'}));
  return {status:200,body:JSON.stringify({response:{header:{resultCode:'00',resultMsg:'SYNTHETIC'},body:{items:{item:rows},pageNo:1,numOfRows:100,totalCount:rows.length}}})};
 };
}
