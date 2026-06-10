import { LEVELS, LEVEL_COLOR } from './levels.js';

// 레벨 체크박스 UI 생성(색 스와치 + 셀 크기 표기 포함). onChange(levels) 콜백 호출.
export function initLevelToggles(container, levels, onChange) {
  container.innerHTML = '';
  for (const lv of LEVELS) {
    const id = 'lv-' + lv;
    const label = document.createElement('label');
    label.className = 'level-toggle';
    label.innerHTML =
      `<input type="checkbox" id="${id}" ${levels[lv] ? 'checked' : ''}>` +
      `<span class="swatch" style="background:${LEVEL_COLOR[lv]}"></span>` +
      `p${lv}<span class="lv-size" id="size-${lv}"></span>`;
    container.appendChild(label);
    label.querySelector('input').addEventListener('change', e => {
      levels[lv] = e.target.checked;
      onChange();
    });
  }
}

export function setLevelCheckboxes(levels) {
  for (const lv of LEVELS) {
    const el = document.getElementById('lv-' + lv);
    if (el) el.checked = !!levels[lv];
  }
}

// 각 레벨 토글 옆에 셀 크기 표기. sizes = {6:'1.2km', 7:'153m', 8:'38m'} 형식.
export function setLevelSizes(sizes) {
  for (const lv of LEVELS) {
    const el = document.getElementById('size-' + lv);
    if (el) el.textContent = sizes[lv] ? ` ${sizes[lv]}` : '';
  }
}

// 줌 → 표시 레벨 매핑(autoLevel on일 때)
export function levelsForZoom(zoom) {
  if (zoom >= 17) return { 6: false, 7: false, 8: true };
  if (zoom >= 15) return { 6: false, 7: true, 8: false };
  return { 6: true, 7: false, 8: false };
}
