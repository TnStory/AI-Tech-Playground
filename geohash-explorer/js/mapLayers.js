import * as gh from './geohash.js';
import { LEVELS, LEVEL_COLOR } from './levels.js';

function fmtM(m) { return m >= 1000 ? (m / 1000).toFixed(m >= 10000 ? 0 : 1) + 'km' : Math.round(m) + 'm'; }

export function createLayers(map) {
  const cellLayer = L.layerGroup().addTo(map); // 가운데(또는 선택) 셀 박스 + 라벨
  const overlay = L.layerGroup().addTo(map);   // 선택 셀

  function box(hash, style) {
    const b = gh.decodeBounds(hash);
    return L.rectangle([b.sw, b.ne], style);
  }

  // 셀 박스 외곽 라벨: 상단 변 위 = "가로 길이 + 해시"(중앙정렬), 좌측 변 왼쪽 = 세로 길이.
  // 해시를 가로 라벨에 함께 넣어, 중첩(p6/p7/p8) 시에도 각 박스의 해시가 자기 상단 변에 떠 겹치지 않는다.
  function edgeLabels(hash, color) {
    const b = gh.decodeBounds(hash);
    const s = gh.cellSizeMeters(hash);
    const midLat = (b.sw[0] + b.ne[0]) / 2, midLon = (b.sw[1] + b.ne[1]) / 2;
    const lab = (txt, cls) => L.divIcon({
      className: 'edge-label', iconSize: [0, 0],
      html: `<span class="lab ${cls}" style="color:${color};border-color:${color}">${txt}</span>`,
    });
    return [
      L.marker([b.ne[0], midLon], { icon: lab('↔ ' + fmtM(s.width) + '  ' + hash, 'w'), interactive: false }),
      L.marker([midLat, b.sw[1]], { icon: lab('↕ ' + fmtM(s.height), 'h'), interactive: false }),
    ];
  }

  // 셀 박스(테두리) + 외곽 라벨(가로+해시 / 세로).
  function drawCell(layer, hash, color, weight) {
    layer.addLayer(box(hash, { color, weight, fill: false }));
    for (const m of edgeLabels(hash, color)) layer.addLayer(m);
  }

  // 타일링 없음 — 켜진 레벨마다 "지도 가운데 셀" 하나만 박스+라벨(가로 라벨에 해시 포함).
  function renderCells(levels) {
    cellLayer.clearLayers();
    const c = map.getCenter();
    for (const lv of LEVELS) {
      if (!levels[lv]) continue;
      drawCell(cellLayer, gh.encode(c.lat, c.lng, lv), LEVEL_COLOR[lv], 2);
    }
    return [];
  }

  // 선택 셀: 선택 셀(주황, 최심 레벨)을 중심으로, 켜진 상위 레벨의 "그 셀을 포함하는 셀"(=해시 접두사)을
  // 외곽 박스로 함께 표시(각 박스의 가로 라벨에 자기 해시). 이웃은 표시하지 않음.
  function showSelection(hash, levels) {
    overlay.clearLayers();
    const sel = hash.length;
    for (const lv of LEVELS) {
      if (lv >= sel || !levels[lv]) continue; // 선택보다 상위(coarser)이면서 켜진 레벨만
      drawCell(overlay, hash.slice(0, lv), LEVEL_COLOR[lv], 2);
    }
    drawCell(overlay, hash, '#f59e0b', 3); // 선택 셀(주황)
  }

  function clearOverlay() { overlay.clearLayers(); }

  return { renderCells, showSelection, clearOverlay };
}
