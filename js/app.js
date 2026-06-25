
let allRealEstateData = [];

document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // 드롭다운 필터 변경 이벤트 리스너
  const aptSelector = document.getElementById('apt-selector');
  const areaSelector = document.getElementById('area-selector');

  aptSelector.addEventListener('change', (e) => {
    updateAreaOptions(e.target.value);
    renderData(e.target.value, areaSelector.value);
  });

  areaSelector.addEventListener('change', (e) => {
    renderData(aptSelector.value, e.target.value);
  });
});

async function initApp() {
  // 1. IP 수집 및 POST 요청 (비동기로 백그라운드 처리 - 사용자 대기 없음)
  sendClientInfo();

  // 2. 실거래가 데이터 Fetch
  await fetchRealEstateData();
}

/**
 * 접속자 IP 및 브라우저 정보를 수집하여 GAS 서버에 POST 방식으로 기록
 */
async function sendClientInfo() {
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();

    const clientInfo = {
      ip: ipData.ip,
      userAgent: navigator.userAgent
    };

    fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(clientInfo),
    }).catch(e => console.error('로그 전송 중 오류 발생:', e));

  } catch (error) {
    console.error('IP 정보 수집 실패:', error);
  }
}

/**
 * GAS 서버에서 실거래가 데이터를 GET 방식으로 가져옴
 */
async function fetchRealEstateData() {
  const spinner = document.getElementById('loading-spinner');
  const dataContainer = document.getElementById('data-container');

  try {
    const response = await fetch(GAS_URL);
    if (!response.ok) throw new Error('네트워크 응답에 문제가 있습니다.');

    allRealEstateData = await response.json();

    // 로딩 숨기고 데이터 컨테이너 보이기
    spinner.classList.add('hidden');
    dataContainer.classList.remove('hidden');

    // 단지명 목록 추출 및 콤보 박스 동적 생성 ('전체 단지 보기' 제외)
    const aptSelector = document.getElementById('apt-selector');
    const aptNames = [...new Set(allRealEstateData.map(item => item['단지명']).filter(Boolean))];

    aptSelector.innerHTML = ''; // 기존 옵션 초기화

    if (aptNames.length > 0) {
      aptNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        aptSelector.appendChild(option);
      });
      // 첫 번째 항목 자동 선택 및 해당 항목의 면적 옵션 업데이트, 데이터 렌더링
      aptSelector.value = aptNames[0];
      updateAreaOptions(aptNames[0]);
      renderData(aptNames[0], 'all');
    } else {
      aptSelector.innerHTML = '<option value="">데이터 없음</option>';
      renderData('', 'all');
    }
  } catch (error) {
    console.error('데이터 조회 실패:', error);
    spinner.innerHTML = `<p style="color: #ef4444;">데이터를 불러오는데 실패했습니다.</p>`;
  }
}

/**
 * 선택된 단지명에 해당하는 전용면적 옵션 동적 업데이트
 */
function updateAreaOptions(selectedApt) {
  const areaSelector = document.getElementById('area-selector');
  areaSelector.innerHTML = '<option value="all">전체</option>';

  if (!selectedApt) return;

  const filteredByApt = allRealEstateData.filter(item =>
    item['단지명'] && item['단지명'].includes(selectedApt)
  );

  const areas = [...new Set(filteredByApt.map(item => item['전용면적']).filter(Boolean))];

  // 면적을 숫자 오름차순으로 정렬
  areas.sort((a, b) => parseFloat(a) - parseFloat(b));

  areas.forEach(area => {
    const option = document.createElement('option');
    option.value = area;
    option.textContent = area + ' ㎡';
    areaSelector.appendChild(option);
  });

  areaSelector.value = 'all';
}

/**
 * 필터 조건에 맞춰 데이터를 화면에 렌더링
 */
function renderData(aptKeyword, areaKeyword) {
  const dataContainer = document.getElementById('data-container');
  dataContainer.innerHTML = ''; // 초기화

  let filteredData = allRealEstateData;
  if (aptKeyword) {
    filteredData = filteredData.filter(item =>
      item['단지명'] && item['단지명'].includes(aptKeyword)
    );
  }

  if (areaKeyword && areaKeyword !== 'all') {
    filteredData = filteredData.filter(item =>
      String(item['전용면적']) === String(areaKeyword)
    );
  }

  if (filteredData.length === 0) {
    dataContainer.innerHTML = `<div class="empty-state">해당 단지의 실거래가 데이터가 없습니다.</div>`;
    return;
  }

  filteredData.forEach((item, index) => {
    // 거래금액 포맷팅 (예: 50,000 -> 5억)
    let priceStr = String(item['거래금액'] || '0');
    let rawPrice = parseInt(priceStr.replace(/,/g, ''), 10);

    let formattedPrice = rawPrice ? rawPrice.toLocaleString() + '만' : priceStr + '만';
    if (!isNaN(rawPrice)) {
      if (rawPrice >= 10000) {
        const uk = Math.floor(rawPrice / 10000);
        const man = rawPrice % 10000;
        // 만 단위 천자리 콤마 표기 및 글자 크기 통일(span 태그 제거)
        formattedPrice = man > 0 ? `${uk}억 ${man.toLocaleString()}만` : `${uk}억`;
      }
    }

    // 날짜 포맷팅 (ISO 문자열 처리)
    let contractDateStr = String(item['계약일'] || '-');
    if (contractDateStr.includes('T')) {
      // '2026-06-23T15:00:00.000Z' 형태인 경우 'T'를 기준으로 잘라서 날짜 부분만 추출
      contractDateStr = contractDateStr.split('T')[0];
    }

    // 마이크로 인터랙션을 위한 약간의 시차 애니메이션
    const delay = index * 0.05;

    const card = document.createElement('div');
    card.className = 'data-card';
    card.style.animationDelay = `${delay}s`;

    card.innerHTML = `
      <div class="card-header">
        <span class="apt-name">${item['단지명'] || '단지명 없음'}</span>
        <span class="contract-date">${contractDateStr}</span>
      </div>
      <div class="card-body">
        <div class="specs">
          <span class="spec-item">${item['전용면적'] || '-'}㎡ (${item['층'] || '-'}층)</span>
        </div>
        <div class="price">${formattedPrice}</div>
      </div>
    `;
    dataContainer.appendChild(card);
  });
}
