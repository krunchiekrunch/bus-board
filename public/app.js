const API_URL = '/api/vehicles';

const $list = document.getElementById('list');
const $loading = document.getElementById('loading');
const $clock = document.getElementById('clock');
const $statusLine = document.getElementById('statusLine');

// calculation stuff
function formatTime(msString){
  if(!msString) return '-';
  const n = Number(msString);
  if(!Number.isFinite(n) || n <= 0) return '-';
  return new Date(n).toLocaleTimeString('en-GB',{
    hour:'2-digit',
    minute:'2-digit',
    second:'2-digit'
  });
}

function relativeTime(msString){
  if(!msString) return '';
  const n = Number(msString);
  if(!Number.isFinite(n)) return '';
  const diff = n - Date.now();
  const abs = Math.abs(diff);

  if(abs < 60_000) return 'now';
  const mins = Math.round(abs / 60_000);
  return diff >= 0 ? `in ${mins}m` : `${mins}m ago`;
}

function escapeHtml(text){
  if(!text) return '';
  return String(text).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
}

// info rendering

function render(data){
  $list.innerHTML = '';
  const services = Array.isArray(data.services) ? data.services : [];

  if(services.length === 0){
    $loading.textContent = 'No live buses in area.';
    updateStatusLine(0);
    return;
  }

  $loading.style.display = 'none';

  services.sort((a,b)=>{
    const sa = a.serviceNumber || '';
    const sb = b.serviceNumber || '';
    if(sa !== sb) return sa.localeCompare(sb, undefined, { numeric:true });
    return (Number(a.expectedFinalStopArrivalTime) || 0) -
           (Number(b.expectedFinalStopArrivalTime) || 0);
  });

  services.forEach(svc=>{
    const row = document.createElement('div');
    row.className = 'service';

    const num = document.createElement('div');
    num.className = 'svc-num';
    num.textContent = svc.serviceNumber || svc.serviceId || '-';

    const middle = document.createElement('div');

    const dest = document.createElement('div');
    dest.className = 'svc-dest';
    dest.textContent = svc.destinationDisplay || '-';

    const meta = document.createElement('div');
    meta.className = 'svc-meta';
    meta.innerHTML =
      `${svc.serviceDescription ? escapeHtml(svc.serviceDescription) + ' • ' : ''}` +
      `${svc.operatingCompany || '-'} • ${svc.direction || '-'}`;

    const pos = document.createElement('div');
    pos.className = 'small-muted';
    pos.textContent =
      `lat ${svc.snapLatitude ?? '-'}, lng ${svc.snapLongitude ?? '-'}`;

    middle.appendChild(dest);
    middle.appendChild(meta);
    middle.appendChild(pos);

    const right = document.createElement('div');
    right.className = 'times';

    const aimed = document.createElement('div');
    aimed.innerHTML = `
      <div class="small-muted">Aimed final</div>
      <div>${formatTime(svc.aimedFinalStopArrivalTime)}</div>
    `;

    const expected = document.createElement('div');
    expected.style.marginTop = '6px';
    expected.innerHTML = `
      <div class="small-muted">Expected final</div>
      <div>
        ${formatTime(svc.expectedFinalStopArrivalTime)}
        ${relativeTime(svc.expectedFinalStopArrivalTime)}
      </div>
    `;

    right.appendChild(aimed);
    right.appendChild(expected);

    row.appendChild(num);
    row.appendChild(middle);
    row.appendChild(right);

    $list.appendChild(row);
  });

  updateStatusLine(services.length);
}

// status at the top and the clock
function updateStatusLine(count){
  $statusLine.style.opacity = 0;
  setTimeout(()=>{
    const now = new Date();
    const t = now.toLocaleTimeString('en-GB',{
      hour:'2-digit',
      minute:'2-digit',
      second:'2-digit'
    });

    $statusLine.textContent =
      count > 0
        ? `${count} active buses • Updated ${t}`
        : `No buses nearby • Updated ${t}`;

    $statusLine.style.opacity = 1;
  }, 300);
}

function tickClock(){
  $clock.textContent = new Date().toLocaleTimeString('en-GB',{
    hour:'2-digit',
    minute:'2-digit',
    second:'2-digit'
  });
}

// take in data
async function fetchData(){
  try{
    const resp = await fetch(API_URL, { cache:'no-store' });
    if(!resp.ok) throw new Error('Network error');
    const json = await resp.json();
    render(json);
  }catch(err){
    console.warn('Fetch failed', err);
    $loading.textContent = 'Failed to load live data';
    updateStatusLine(0);
  }
}

function scheduleUpdate(){
  const now = new Date();
  const msToNextMinute =
    (59 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(()=>{
    fetchData();
    setInterval(fetchData, 60_000);
  }, msToNextMinute);
}

// end
tickClock();
setInterval(tickClock, 1000);
fetchData();
scheduleUpdate();
