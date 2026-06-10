// GeoHash 순수 구현 (의존성 없음). 경도 먼저 비트 인터리빙, 5비트=1글자.
export const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encode(lat, lon, precision = 6) {
  let latRange = [-90, 90], lonRange = [-180, 180];
  let hash = '', bits = 0, bit = 0, even = true; // even=true → 경도 차례
  while (hash.length < precision) {
    if (even) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (lon >= mid) { bit = (bit << 1) | 1; lonRange[0] = mid; }
      else { bit = bit << 1; lonRange[1] = mid; }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) { bit = (bit << 1) | 1; latRange[0] = mid; }
      else { bit = bit << 1; latRange[1] = mid; }
    }
    even = !even;
    if (++bits === 5) { hash += BASE32[bit]; bits = 0; bit = 0; }
  }
  return hash;
}

export function decodeBounds(hash) {
  let latRange = [-90, 90], lonRange = [-180, 180], even = true;
  for (const ch of hash) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) throw new Error('Invalid geohash char: ' + ch);
    for (let n = 4; n >= 0; n--) {
      const bitN = (idx >> n) & 1;
      if (even) {
        const mid = (lonRange[0] + lonRange[1]) / 2;
        if (bitN) lonRange[0] = mid; else lonRange[1] = mid;
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (bitN) latRange[0] = mid; else latRange[1] = mid;
      }
      even = !even;
    }
  }
  return { sw: [latRange[0], lonRange[0]], ne: [latRange[1], lonRange[1]] };
}

export function children(hash) {
  return BASE32.split('').map(c => hash + c);
}

export function neighbors(hash) {
  const b = decodeBounds(hash);
  const latH = b.ne[0] - b.sw[0], lonW = b.ne[1] - b.sw[1];
  const cLat = (b.sw[0] + b.ne[0]) / 2, cLon = (b.sw[1] + b.ne[1]) / 2;
  const p = hash.length;
  const deltas = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  return deltas.map(([dLat, dLon]) => {
    let lat = cLat + dLat * latH, lon = cLon + dLon * lonW;
    lat = Math.max(-90, Math.min(90, lat));
    lon = ((lon + 180) % 360 + 360) % 360 - 180; // 경도 wrap
    return encode(lat, lon, p);
  });
}

// 셀의 대략적 실제 크기(미터). 가로=경도폭(위도에 따라 cos 보정), 세로=위도폭.
export function cellSizeMeters(hash) {
  const b = decodeBounds(hash);
  const latMid = (b.sw[0] + b.ne[0]) / 2;
  const latSpan = b.ne[0] - b.sw[0], lonSpan = b.ne[1] - b.sw[1];
  const height = latSpan * 110574; // 위도 1° ≈ 110.574km
  const width = lonSpan * 111320 * Math.cos(latMid * Math.PI / 180); // 경도 1° ≈ 111.32km·cos(위도)
  return { width, height };
}

// sw, ne = [lat, lon]. bbox를 덮는 precision 셀 목록.
export function coverBounds(sw, ne, precision) {
  const cell = decodeBounds(encode(sw[0], sw[1], precision));
  const latStep = cell.ne[0] - cell.sw[0], lonStep = cell.ne[1] - cell.sw[1];
  const hashes = new Set();
  for (let lat = sw[0]; lat <= ne[0] + latStep; lat += latStep) {
    for (let lon = sw[1]; lon <= ne[1] + lonStep; lon += lonStep) {
      hashes.add(encode(Math.min(lat, 90), Math.min(lon, 180), precision));
    }
  }
  return [...hashes];
}
