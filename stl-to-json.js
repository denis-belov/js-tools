/*
eslint-disable
linebreak-style,
func-style,
no-console,
camelcase,
no-bitwise,
no-magic-numbers,
id-match,
id-length,
max-len,
no-sync,
*/

const fs = require('fs');

const getCommandLineArgs = () => {
  const args = {};

  process.argv.slice(2).forEach((elm) => {
    const parts = elm.split('=');

    args[parts[0]] = parts[1] || true;
  });

  return args;
};

const parseSign = (bArr) => {
  if (bArr[0] & 0x80) {
    return -1;
  }

  return 1;
};

const parseExponent = (bArr) => {
  let exp = (bArr[0] & 0x7F) << 1;

  if ((bArr[1] & 0x80) !== 0) {
    exp += 0x01;
  }

  exp = Math.pow(2, exp - 127);

  return exp;
};

const parseSignificand = (bArr) => {
  let numb = 0;
  let mask = 0x40;

  for (let i = 1; i < 8; i++) {
    if ((bArr[1] & mask) !== 0) {
      numb += 1 / Math.pow(2, i);
    }
    mask >>= 1;
  }

  mask = 0x80;

  for (let j = 0; j < 8; j++) {
    if ((bArr[2] & mask) !== 0) {
      numb += 1 / Math.pow(2, j + 8);
    }
    mask >>= 1;
  }

  mask = 0x80;

  for (let k = 0; k < 8; k++) {
    if ((bArr[2] & mask) !== 0) {
      numb += 1 / Math.pow(2, k + 16);
    }
    mask >>= 1;
  }

  return numb + 1;
};

const getCoord = (coord) => parseSign(coord) * parseExponent(coord) * parseSignificand(coord);

// ArrayBuffer, Buffer input
const parse = (buffer, unify) => {
  // slice 84 bytes header
  const src = new Uint8Array(buffer).slice(84);

  const vertex_data = [];
  const index_data = [];
  const aux_obj = {};
  let counter = 0;

  for (let i = 0; i < src.length; i += 50) {
    const v1string = [ src[i + 15], src[i + 14], src[i + 13], src[i + 12], src[i + 19], src[i + 18], src[i + 17], src[i + 16], src[i + 23], src[i + 22], src[i + 21], src[i + 20] ].toString();
    const v2string = [ src[i + 27], src[i + 26], src[i + 25], src[i + 24], src[i + 31], src[i + 30], src[i + 29], src[i + 28], src[i + 35], src[i + 34], src[i + 33], src[i + 32] ].toString();
    const v3string = [ src[i + 39], src[i + 38], src[i + 37], src[i + 36], src[i + 43], src[i + 42], src[i + 41], src[i + 40], src[i + 47], src[i + 46], src[i + 45], src[i + 44] ].toString();

    if (!aux_obj[v1string] || !unify) {
      aux_obj[v1string] = counter++;
      const x = getCoord([ src[i + 15], src[i + 14], src[i + 13], src[i + 12] ]);
      const y = getCoord([ src[i + 19], src[i + 18], src[i + 17], src[i + 16] ]);
      const z = getCoord([ src[i + 23], src[i + 22], src[i + 21], src[i + 20] ]);
      vertex_data.push(x * 0.4, y * 0.4, z * 0.4);
    }

    if (!aux_obj[v2string] || !unify) {
      aux_obj[v2string] = counter++;
      const x = getCoord([ src[i + 27], src[i + 26], src[i + 25], src[i + 24] ]);
      const y = getCoord([ src[i + 31], src[i + 30], src[i + 29], src[i + 28] ]);
      const z = getCoord([ src[i + 35], src[i + 34], src[i + 33], src[i + 32] ]);
      vertex_data.push(x * 0.4, y * 0.4, z * 0.4);
    }

    if (!aux_obj[v3string] || !unify) {
      aux_obj[v3string] = counter++;
      const x = getCoord([ src[i + 39], src[i + 38], src[i + 37], src[i + 36] ]);
      const y = getCoord([ src[i + 43], src[i + 42], src[i + 41], src[i + 40] ]);
      const z = getCoord([ src[i + 47], src[i + 46], src[i + 45], src[i + 44] ]);
      vertex_data.push(x * 0.4, y * 0.4, z * 0.4);
    }

    const v1 = aux_obj[v1string];
    const v2 = aux_obj[v2string];
    const v3 = aux_obj[v3string];

    index_data.push(v1, v2, v3);
  }

  return { vertex_data, index_data };
};

const { src, dst, unify } = getCommandLineArgs();

if (!src) {
  throw new Error('ERROR: no source');
}

fs.writeFileSync(dst || `stl-to-json-${ new Date().toISOString().replace(/\./g, '-').replace(/:/g, '-') }.json`, JSON.stringify(parse(fs.readFileSync(src), unify)), 'utf8');
