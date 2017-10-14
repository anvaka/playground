export function encodeFloatRGBA(val, out, idx) {
  if (val == 0.0) {
    out[idx + 0] = 0; out[idx + 1] = 0; out[idx + 2] = 0; out[idx + 3] = 0;
  }

  var mag = Math.abs(val);
  var exponent = Math.floor(Math.log2(mag));
  // Correct log2 approximation errors.
  exponent += (exp2(exponent) <= mag / 2.0) ? 1 : 0;
  exponent -= (exp2(exponent) > mag) ? 1 : 0;

  var mantissa;
  if (exponent > 100.0) {
      mantissa = mag / 1024.0 / exp2(exponent - 10.0) - 1.0;
  } else {
      mantissa = mag / (exp2(exponent)) - 1.0;
  }

  var a = exponent + 127.0;
  mantissa *= 256.0;
  var b = Math.floor(mantissa);
  mantissa -= b;
  mantissa *= 256.0;
  var c = Math.floor(mantissa);
  mantissa -= c;
  mantissa *= 128.0;
  var d = Math.floor(mantissa) * 2.0 + ((val < 0.0) ? 1: 0);

  out[idx + 0] = a; out[idx + 1] = b; out[idx + 2] = c; out[idx + 3] = d;
}

export function decodeFloatRGBA(r, g, b, a) {
  var A = Math.floor(r + 0.5);
  var B = Math.floor(g + 0.5);
  var C = Math.floor(b + 0.5);
  var D = Math.floor(a + 0.5);

  var exponent = A - 127.0;
  var sign = 1.0 - (D % 2.0) * 2.0;
  var mantissa = ((A > 0.0) ? 1 : 0)
                  + B / 256.0
                  + C / 65536.0
                  + Math.floor(D / 2.0) / 8388608.0;
  return sign * mantissa * exp2(exponent);
}

function exp2(exponent) { return Math.exp(exponent * Math.LN2); }