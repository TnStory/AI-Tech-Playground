import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE32, encode } from '../geohash-explorer/js/geohash.js';
import { decodeBounds } from '../geohash-explorer/js/geohash.js';
import { children, neighbors } from '../geohash-explorer/js/geohash.js';
import { coverBounds } from '../geohash-explorer/js/geohash.js';
import { cellSizeMeters } from '../geohash-explorer/js/geohash.js';

test('BASE32 has 32 chars and excludes a,i,l,o', () => {
  assert.equal(BASE32.length, 32);
  for (const c of 'ailo') assert.ok(!BASE32.includes(c));
});

test('encode: 강남역 부근(37.4979,127.0276) → "wydm6" 접두사', () => {
  assert.equal(encode(37.4979, 127.0276, 5), 'wydm6');
  assert.ok(encode(37.4979, 127.0276, 8).startsWith('wydm6'));
});

test('decodeBounds: encode한 점이 그 셀 경계 안에 있다(왕복)', () => {
  const lat = 37.4979, lon = 127.0276;
  const b = decodeBounds(encode(lat, lon, 7));
  assert.ok(lat >= b.sw[0] && lat <= b.ne[0], 'lat in bounds');
  assert.ok(lon >= b.sw[1] && lon <= b.ne[1], 'lon in bounds');
});

test('decodeBounds: 잘못된 문자는 throw', () => {
  assert.throws(() => decodeBounds('wadi'), /Invalid/);
});

test('children: 한 글자 추가 = 32칸', () => {
  const c = children('wydm6');
  assert.equal(c.length, 32);
  assert.ok(c.every(h => h.length === 6 && h.startsWith('wydm6')));
});

test('neighbors: 인접 8칸, 모두 같은 길이, 자기 자신 제외', () => {
  const n = neighbors('wydm6');
  assert.equal(n.length, 8);
  assert.ok(n.every(h => h.length === 5));
  assert.ok(!n.includes('wydm6'));
});

test('coverBounds: 작은 bbox를 덮는 셀들(중심 셀 포함)', () => {
  const sw = [37.49, 127.02], ne = [37.51, 127.04];
  const cells = coverBounds(sw, ne, 6);
  assert.ok(cells.length >= 1);
  assert.ok(cells.includes(encode(37.50, 127.03, 6)), '중심 셀 포함');
  assert.ok(cells.every(h => h.length === 6));
});

test('cellSizeMeters: 더 긴 해시 = 더 작은 셀, p7은 대략 150m 안팎', () => {
  const s7 = cellSizeMeters(encode(37.4979, 127.0276, 7));
  const s8 = cellSizeMeters(encode(37.4979, 127.0276, 8));
  assert.ok(s8.width < s7.width && s8.height < s7.height, '더 긴 해시가 더 작다');
  assert.ok(s7.width > 50 && s7.width < 400, `p7 width ~150m (got ${s7.width})`);
  assert.ok(s7.height > 50 && s7.height < 400, `p7 height ~150m (got ${s7.height})`);
  assert.ok(s8.width > 0 && s8.height > 0, '양수');
});
