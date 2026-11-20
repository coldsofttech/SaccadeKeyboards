/** The signs of the currency pad. */
export const CURRENCY_SIGNS = '$€£¥₹₩₽₺₪₫₱₿¢₴₦₡';

/**
 * What a text key types: its AltGr character after the AltGr key (capitalised while shift is on,
 * if it is a letter), otherwise its shifted character while shift is on, if it has one.
 *
 * @param {import('./layout.js').TextKey} key The key.
 * @param {boolean} shifted Whether shift is on.
 * @param {boolean} [altGr] Whether AltGr is on.
 * @param {boolean} [capsLock] Whether caps lock is on, for a key with a `capital` of its own.
 * @returns {string} The character.
 */
export function typedValue(key, shifted, altGr = false, capsLock = false) {
  if (altGr && key.altgr) {
    const capital = key.altgr.toUpperCase();
    return shifted && capital.length === key.altgr.length ? capital : key.altgr;
  }
  if (capsLock && key.capital) return key.capital;
  return shifted && key.shift ? key.shift : key.value;
}
