
document.addEventListener('DOMContentLoaded', () => {
  // 이 페이지에서는 접속 로그를 남기는 sendClientInfo()를 호출하지 않습니다.
  fetchLogs();
});

async function fetchLogs() {
  const spinner = document.getElementById('loading-spinner');
  const logContainer = document.getElementById('log-container');

  try {
    const response = await fetch(`${GAS_URL}?action=getLogs`);
    if (!response.ok) throw new Error('네트워크 응답 오류');

    const logs = await response.json();

    // User-Agent 기준으로 그룹핑 및 접속 횟수, 최종 접속일 계산
    const grouped = {};

    logs.forEach(log => {
      const ua = log.userAgent || 'Unknown';
      const time = new Date(log.accessTime);

      if (!grouped[ua]) {
        grouped[ua] = {
          userAgent: ua,
          count: 0,
          lastAccess: time
        };
      }

      grouped[ua].count++;
      if (time > grouped[ua].lastAccess) {
        grouped[ua].lastAccess = time;
      }
    });

    // 객체를 배열로 변환 후 최종 접속일 기준 내림차순 정렬
    const groupedArray = Object.values(grouped).sort((a, b) => b.lastAccess - a.lastAccess);

    spinner.classList.add('hidden');
    logContainer.classList.remove('hidden');

    renderLogs(groupedArray);
  } catch (error) {
    console.error('로그 조회 실패:', error);
    spinner.innerHTML = `<p style="color: #ef4444;">로그를 불러오는데 실패했습니다.</p>`;
  }
}

function renderLogs(groupedLogs) {
  const logContainer = document.getElementById('log-container');
  logContainer.innerHTML = '';

  if (groupedLogs.length === 0) {
    logContainer.innerHTML = `<div class="empty-state">접속 로그가 없습니다.</div>`;
    return;
  }

  groupedLogs.forEach((group, index) => {
    const delay = index * 0.05;
    const card = document.createElement('div');
    card.className = 'data-card';
    card.style.animationDelay = `${delay}s`;

    const time = group.lastAccess;
    const year = time.getFullYear();
    const month = String(time.getMonth() + 1).padStart(2, '0');
    const day = String(time.getDate()).padStart(2, '0');
    const week = ['일', '월', '화', '수', '목', '금', '토'][time.getDay()];
    const hour = String(time.getHours()).padStart(2, '0');
    const minute = String(time.getMinutes()).padStart(2, '0');
    const second = String(time.getSeconds()).padStart(2, '0');
    
    const lastDateStr = `${year}-${month}-${day}(${week}) ${hour}:${minute}:${second}`;

    card.innerHTML = `
      <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 8px;">
        <span class="apt-name" style="font-size: 0.95rem; line-height: 1.4; word-break: break-all; color: #f1f5f9; white-space: normal;">
          ${group.userAgent}
        </span>
      </div>
      <div class="card-body" style="justify-content: space-between; align-items: flex-end; margin-top: 12px;">
        <div class="specs">
          <span class="spec-item" style="color: #94a3b8; font-size: 0.85rem;">${lastDateStr}</span>
        </div>
        <div class="price" style="font-size: 1.1rem; color: #38bdf8; font-weight: 600;">
          총 ${group.count}회
        </div>
      </div>
    `;
    logContainer.appendChild(card);
  });
}
