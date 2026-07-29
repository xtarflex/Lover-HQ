import fs from 'fs';
import zlib from 'zlib';

function parseZipEntries(buf) {
  let pos = 0;
  const entries = [];
  while (pos < buf.length - 30) {
    if (buf.readUInt32LE(pos) === 0x04034b50) {
      const compMethod = buf.readUInt16LE(pos + 8);
      const compSize = buf.readUInt32LE(pos + 18);
      const nameLen = buf.readUInt16LE(pos + 26);
      const extraLen = buf.readUInt16LE(pos + 28);
      const name = buf.subarray(pos + 30, pos + 30 + nameLen).toString('utf8');
      const dataStart = pos + 30 + nameLen + extraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      entries.push({ name, compMethod, data });
      pos = dataStart + compSize;
    } else {
      pos++;
    }
  }
  return entries;
}

/**
 * Extracts Lottie JSON from a .lottie ZIP archive or JSON buffer.
 * @param {string|Buffer} input
 * @returns {object|null}
 */
export function extractLottieJson(input) {
  try {
    let buf;
    if (typeof input === 'string') {
      buf = fs.readFileSync(input);
    } else {
      buf = input;
    }

    // Direct JSON string
    if (buf[0] === 0x7b) {
      return JSON.parse(buf.toString('utf8'));
    }

    const entries = parseZipEntries(buf);
    const animEntry = entries.find(
      (e) => e.name.startsWith('animations/') && e.name.endsWith('.json')
    );
    if (!animEntry) return null;

    if (animEntry.compMethod === 8) {
      const decompressed = zlib.inflateRawSync(animEntry.data);
      return JSON.parse(decompressed.toString('utf8'));
    } else {
      return JSON.parse(animEntry.data.toString('utf8'));
    }
  } catch {
    return null;
  }
}

export default extractLottieJson;
