/* global process, Buffer */
import fs from 'fs';
import path from 'path';
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
      const compData = buf.subarray(dataStart, dataStart + compSize);
      let data = compData;
      if (compMethod === 8) data = zlib.inflateRawSync(compData);
      entries.push({ name, data });
      pos = dataStart + compSize;
    } else {
      pos++;
    }
  }
  return entries;
}

export function extractLottieJson(lottieBuf) {
  const entries = parseZipEntries(lottieBuf);
  const animEntry = entries.find((e) => e.name.startsWith('animations/') && e.name.endsWith('.json'));
  if (animEntry) {
    try {
      return JSON.parse(animEntry.data.toString('utf8'));
    } catch {
      return null;
    }
  }
  return null;
}

console.log('Lottie JSON extractor ready.');
