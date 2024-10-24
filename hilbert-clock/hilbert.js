/**
 * Fast Hilbert curve algorithm by http://threadlocalmutex.com/
 * Ported from C++ https://github.com/rawrunprotected/hilbert_curves (public domain)
 * @param {number} x
 * @param {number} y
 */
export default function hilbert(x, y) {
  let a = x ^ y;
  let b = 0xFFFF ^ a;
  let c = 0xFFFF ^ (x | y);
  let d = x & (y ^ 0xFFFF);

  let A = a | (b >> 1);
  let B = (a >> 1) ^ a;
  let C = ((c >> 1) ^ (b & (d >> 1))) ^ c;
  let D = ((a & (c >> 1)) ^ (d >> 1)) ^ d;

  a = A; b = B; c = C; d = D;
  A = ((a & (a >> 2)) ^ (b & (b >> 2)));
  B = ((a & (b >> 2)) ^ (b & ((a ^ b) >> 2)));
  C ^= ((a & (c >> 2)) ^ (b & (d >> 2)));
  D ^= ((b & (c >> 2)) ^ ((a ^ b) & (d >> 2)));

  a = A; b = B; c = C; d = D;
  A = ((a & (a >> 4)) ^ (b & (b >> 4)));
  B = ((a & (b >> 4)) ^ (b & ((a ^ b) >> 4)));
  C ^= ((a & (c >> 4)) ^ (b & (d >> 4)));
  D ^= ((b & (c >> 4)) ^ ((a ^ b) & (d >> 4)));

  a = A; b = B; c = C; d = D;
  C ^= ((a & (c >> 8)) ^ (b & (d >> 8)));
  D ^= ((b & (c >> 8)) ^ ((a ^ b) & (d >> 8)));

  a = C ^ (C >> 1);
  b = D ^ (D >> 1);

  let i0 = x ^ y;
  let i1 = b | (0xFFFF ^ (i0 | a));

  i0 = (i0 | (i0 << 8)) & 0x00FF00FF;
  i0 = (i0 | (i0 << 4)) & 0x0F0F0F0F;
  i0 = (i0 | (i0 << 2)) & 0x33333333;
  i0 = (i0 | (i0 << 1)) & 0x55555555;

  i1 = (i1 | (i1 << 8)) & 0x00FF00FF;
  i1 = (i1 | (i1 << 4)) & 0x0F0F0F0F;
  i1 = (i1 | (i1 << 2)) & 0x33333333;
  i1 = (i1 | (i1 << 1)) & 0x55555555;

  return ((i1 << 1) | i0) >>> 0;
}
export function hilbertXYToIndex(n, x, y) {
  x = x << (16 - n);
  y = y << (16 - n);

  let A, B, C, D;

  // Initial prefix scan round, prime with x and y
  {
    let a = x ^ y;
    let b = 0xFFFF ^ a;
    let c = 0xFFFF ^ (x | y);
    let d = x & (y ^ 0xFFFF);

    A = a | (b >> 1);
    B = (a >> 1) ^ a;

    C = ((c >> 1) ^ (b & (d >> 1))) ^ c;
    D = ((a & (c >> 1)) ^ (d >> 1)) ^ d;
  }

  // Three prefix scan rounds
  for (let shift = 2; shift <= 8; shift <<= 1) {
    let a = A;
    let b = B;
    let c = C;
    let d = D;

    A = ((a & (a >> shift)) ^ (b & (b >> shift))) >>> 0;
    B = ((a & (b >> shift)) ^ (b & ((a ^ b) >> shift))) >>> 0;

    C ^= ((a & (c >> shift)) ^ (b & (d >> shift)));
    D ^= ((b & (c >> shift)) ^ ((a ^ b) & (d >> shift)));
  }

  // Undo transformation prefix scan
  let a = C ^ (C >> 1);
  let b = D ^ (D >> 1);

  // Recover index bits
  let i0 = x ^ y;
  let i1 = b | (0xFFFF ^ (i0 | a));

  let index = ((interleave(i1) << 1) | interleave(i0)) >>> 0;
  index = index >> (32 - 2 * n);

  return index;
}

// Interleave function
function interleave(x) {
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;
  return x >>> 0;
}

// Deinterleave function
function deinterleave(x) {
  x = x & 0x55555555;
  x = (x | (x >> 1)) & 0x33333333;
  x = (x | (x >> 2)) & 0x0F0F0F0F;
  x = (x | (x >> 4)) & 0x00FF00FF;
  x = (x | (x >> 8)) & 0x0000FFFF;
  return x >>> 0;
}

// Prefix scan function
function prefixScan(x) {
  x = (x >> 8) ^ x;
  x = (x >> 4) ^ x;
  x = (x >> 2) ^ x;
  x = (x >> 1) ^ x;
  return x >>> 0;
}

// Hilbert index to (x, y)
export function hilbertIndexToXY(index, n) {
  index = index << (32 - 2 * n);

  let i0 = deinterleave(index);
  let i1 = deinterleave(index >> 1);

  let t0 = (i0 | i1) ^ 0xFFFF;
  let t1 = i0 & i1;

  let prefixT0 = prefixScan(t0);
  let prefixT1 = prefixScan(t1);

  let a = (((i0 ^ 0xFFFF) & prefixT1) | (i0 & prefixT0)) >>> 0;

  let x = (a ^ i1) >> (16 - n);
  let y = (a ^ i0 ^ i1) >> (16 - n);

  return { x, y };
}