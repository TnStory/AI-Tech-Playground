import * as gh from './geohash.js';
import { createLayers } from './mapLayers.js';
import { initLevelToggles, setLevelCheckboxes, setLevelSizes, levelsForZoom } from './ui.js';

const SEOUL = [37.4979, 127.0276];
// 기본 = 자동 레벨 ON → 줌에 맞는 한 레벨만. 격자는 타일링하지 않고 "가운데 셀" 하나만 박스로.
const state = { center: SEOUL, zoom: 14, levels: { 6: true, 7: false, 8: false }, autoLevel: true, selected: null };

function fmtM(m) { return m >= 1000 ? (m / 1000).toFixed(m >= 10000 ? 0 : 1) + 'km' : Math.round(m) + 'm'; }
function sizeText(hash) {
  const s = gh.cellSizeMeters(hash);
  return `≈ 가로 ${fmtM(s.width)} × 세로 ${fmtM(s.height)}`;
}

// doubleClickZoom 비활성화: 더블클릭은 "클릭 지점을 중앙으로" 직접 처리한다.
const map = L.map('map', { center: state.center, zoom: state.zoom, doubleClickZoom: false });
L.tileLayer('https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

const layers = createLayers(map);
const readout = document.getElementById('hash-readout');
const sizeReadout = document.getElementById('size-readout');

let hintTimer = null;
function showHint(msg) {
  let t = document.querySelector('.hint-toast');
  if (!t) { t = document.createElement('div'); t.className = 'hint-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(hintTimer); hintTimer = setTimeout(() => { t.style.display = 'none'; }, 2500);
}

function topLevel() {
  // 켜진 레벨 중 가장 큰 precision (없으면 6)
  return [8, 7, 6].find(lv => state.levels[lv]) || 6;
}

// 각 레벨 토글 옆 셀 크기(지도 중심 위도 기준) 갱신.
function updateLevelSizes() {
  const c = map.getCenter();
  const sizes = {};
  for (const lv of [6, 7, 8]) {
    const s = gh.cellSizeMeters(gh.encode(c.lat, c.lng, lv));
    sizes[lv] = `${fmtM(s.width)}×${fmtM(s.height)}`;
  }
  setLevelSizes(sizes);
}

// 가운데 셀 박스(+라벨) 갱신. 선택 중이면 가운데 박스는 숨기고 선택 셀을 다시 그린다
// (줌이 바뀌면 박스 픽셀 크기가 달라져 가운데 해시 라벨 가시성도 갱신해야 하므로).
function recompute() {
  if (state.selected) {
    layers.renderCells({});
    layers.showSelection(state.selected, state.levels);
  } else {
    layers.renderCells(state.levels);
    const c = map.getCenter();
    const h = gh.encode(c.lat, c.lng, topLevel());
    readout.textContent = h;
    sizeReadout.textContent = sizeText(h);
  }
  updateLevelSizes();
}

map.on('moveend', recompute);

// 호버: 커서 아래 셀의 해시·크기 표시(선택 중에는 선택 정보 유지).
function onPoint(latlng) {
  if (state.selected) return;
  const h = gh.encode(latlng.lat, latlng.lng, topLevel());
  readout.textContent = h;
  sizeReadout.textContent = sizeText(h);
}
map.on('mousemove', e => onPoint(e.latlng));

// 클릭으로 셀 선택/해제. 단 더블클릭과 구분하기 위해 약간 지연 후 실행(더블클릭이면 취소됨).
function doSelect(latlng) {
  const h = gh.encode(latlng.lat, latlng.lng, topLevel());
  if (state.selected === h) { // 같은 셀 재클릭 → 선택 해제 → 가운데 박스 복귀
    state.selected = null; layers.clearOverlay(); recompute();
  } else {
    state.selected = h;
    readout.textContent = h;
    sizeReadout.textContent = sizeText(h);
    layers.renderCells({}); // 가운데 박스 숨김
    layers.showSelection(h, state.levels);
  }
}

let clickTimer = null;
map.on('click', e => {
  clearTimeout(clickTimer);
  const ll = e.latlng;
  clickTimer = setTimeout(() => doSelect(ll), 220);
});

// 더블클릭: 클릭 지점을 지도 중앙으로 이동 + 한 단계 줌인(선택 토글은 취소).
map.on('dblclick', e => {
  clearTimeout(clickTimer);
  if (state.selected) { state.selected = null; layers.clearOverlay(); }
  map.setView(e.latlng, Math.min(map.getZoom() + 1, 19));
});

// 레벨을 바꾸면 기존 선택은 해제한다(선택이 옛 레벨 셀로 남아 새 레벨을 가리는 것 방지).
function deselect() {
  if (!state.selected) return;
  state.selected = null;
  layers.clearOverlay();
}

function onLevelChange() {
  deselect();
  recompute();
}

initLevelToggles(document.getElementById('level-toggles'), state.levels, onLevelChange);

const autoEl = document.getElementById('auto-level');
autoEl.checked = state.autoLevel; // 기본 자동 레벨 ON 반영
autoEl.addEventListener('change', () => { state.autoLevel = autoEl.checked; applyAuto(); });

function applyAuto() {
  if (!state.autoLevel) return;
  deselect();
  // state.levels는 재할당하지 않고 제자리 변경(레벨 토글 핸들러가 이 객체 참조를 캡처하고 있음).
  Object.assign(state.levels, levelsForZoom(map.getZoom()));
  setLevelCheckboxes(state.levels);
  recompute();
}
map.on('zoomend', applyAuto);

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchError = document.getElementById('search-error');

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  searchError.textContent = '';
  const q = searchInput.value.trim().toLowerCase();
  if (!q || [...q].some(c => !gh.BASE32.includes(c))) {
    searchError.textContent = '유효한 geohash가 아닙니다 (0-9,b-z, a·i·l·o 제외).';
    return;
  }
  const b = gh.decodeBounds(q);
  map.fitBounds([b.sw, b.ne]);
  state.selected = q; layers.renderCells({}); layers.showSelection(q, state.levels);
  readout.textContent = q; sizeReadout.textContent = sizeText(q);
});

const locateBtn = document.getElementById('locate-btn');
locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { showHint('이 브라우저는 위치를 지원하지 않아요'); return; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      map.setView([lat, lon], 16);
      const h = gh.encode(lat, lon, topLevel());
      state.selected = h; layers.renderCells({}); layers.showSelection(h, state.levels);
      readout.textContent = h; sizeReadout.textContent = sizeText(h);
      navigator.clipboard?.writeText(h).then(
        () => showHint('내 위치 해시 복사됨: ' + h),
        () => showHint('내 위치: ' + h)
      );
    },
    () => showHint('위치 권한이 거부되었어요'),
    { timeout: 5000 }
  );
});

// GPS 초기화: 허용 시 내 위치, 아니면 서울 유지(조용히)
function initLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
    () => { /* 거부/실패 → 서울 폴백 */ },
    { timeout: 5000 }
  );
}

function levelsParam() { return [6, 7, 8].filter(lv => state.levels[lv]).join(''); }

function syncUrl() {
  const c = map.getCenter();
  const p = new URLSearchParams();
  p.set('lat', c.lat.toFixed(5)); p.set('lng', c.lng.toFixed(5));
  p.set('z', map.getZoom()); p.set('lv', levelsParam());
  if (state.autoLevel) p.set('auto', '1');
  history.replaceState(null, '', '?' + p.toString());
}

function restoreFromUrl() {
  const p = new URLSearchParams(location.search);
  if (!p.has('lat')) return false;
  const lat = +p.get('lat'), lng = +p.get('lng'), z = +(p.get('z') || 14);
  const lv = p.get('lv') || '6';
  Object.assign(state.levels, { 6: lv.includes('6'), 7: lv.includes('7'), 8: lv.includes('8') });
  state.autoLevel = p.get('auto') === '1';
  setLevelCheckboxes(state.levels);
  autoEl.checked = state.autoLevel;
  map.setView([lat, lng], z);
  return true;
}

// 초기화: URL 있으면 복원(autoLevel이면 줌 기준 레벨 재도출), 없으면 GPS
if (restoreFromUrl()) {
  if (state.autoLevel) applyAuto();
} else {
  initLocation();
}
recompute(); // 초기 가운데 박스 + 라벨 + 레벨 크기
map.on('moveend', syncUrl);
map.on('zoomend', syncUrl);
document.getElementById('level-toggles').addEventListener('change', syncUrl);
autoEl.addEventListener('change', syncUrl);

export { map, state, gh };
