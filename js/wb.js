/** Формирование URL фото Wildberries */
const BASKET_RANGES = [
  [0, 143, '01'],
  [144, 287, '02'],
  [288, 431, '03'],
  [432, 575, '04'],
  [576, 719, '05'],
  [720, 863, '06'],
  [864, 1007, '07'],
  [1008, 1151, '08'],
  [1152, 1295, '09'],
  [1296, 1439, '10'],
  [1440, 1583, '11'],
  [1584, 1727, '12'],
  [1728, 1871, '13'],
  [1872, 2015, '14'],
  [2016, 2159, '15'],
  [2160, 2303, '14'],
  [2304, 2447, '17'],
  [2448, 2591, '18'],
];

function basketHost(vol) {
  for (const [from, to, host] of BASKET_RANGES) {
    if (vol >= from && vol <= to) return host;
  }
  return '14';
}

export function wbImageUrl(nm, photoIndex = 1, size = 'big') {
  const vol = Math.floor(nm / 100000);
  const part = Math.floor(nm / 1000);
  const host = basketHost(vol);
  return `https://basket-${host}.wbbasket.ru/vol${vol}/part${part}/${nm}/images/${size}/${photoIndex}.webp`;
}
