document.addEventListener('DOMContentLoaded', () => {
  // 클라이언트 정보 수집 및 POST 요청 (비동기로 백그라운드 처리 - 사용자 대기 없음)
  sendClientInfo();
});

/**
 * 브라우저 정보를 수집하여 GAS 서버에 POST 방식으로 기록 (IP 수집 제외)
 */
function sendClientInfo() {
  try {
    const clientInfo = {
      userAgent: navigator.userAgent
    };

    fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(clientInfo),
    }).catch(e => console.error('로그 전송 중 오류 발생:', e));

  } catch (error) {
    console.error('클라이언트 정보 수집 실패:', error);
  }
}
