import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { doctorAudioData, parseColorToThree, deriveSectorPalette } from './audioUtils';

describe('audioUtils - doctorAudioData', () => {
  it('should compress and normalize audio spectrum data', () => {
    const rawData = new Uint8Array([0, 50, 100, 200, 255]);
    const targetBuffer = new Float32Array(5);
    const result = doctorAudioData(rawData, targetBuffer);
    expect(result).toBe(targetBuffer);
    expect(result[0]).toBe(0);
    expect(result[1]).toBeCloseTo(Math.sqrt(50 / 255) * 0.75, 3);
    expect(result[2]).toBeCloseTo(100 / 255, 3);
    expect(result[3]).toBeCloseTo(200 / 255, 3);
    expect(result[4]).toBeCloseTo(1.0, 3);
  });

  it('should handle empty buffer gracefully', () => {
    const rawData = new Uint8Array(0);
    const targetBuffer = new Float32Array(0);
    const result = doctorAudioData(rawData, targetBuffer);
    expect(result.length).toBe(0);
  });

  it('should boost all low values under 0.3 threshold', () => {
    const rawData = new Uint8Array([10, 25, 50, 70]);
    const targetBuffer = new Float32Array(4);
    doctorAudioData(rawData, targetBuffer);
    for (let i = 0; i < rawData.length; i++) {
      const rawNormalized = rawData[i] / 255.0;
      if (rawNormalized < 0.3) {
        expect(targetBuffer[i]).toBeGreaterThan(rawNormalized);
      }
    }
  });
});

describe('audioUtils - parseColorToThree', () => {
  it('should parse valid rgb string', () => {
    const color = parseColorToThree('rgb(255, 0, 128)');
    expect(color).toBeInstanceOf(THREE.Color);
    expect(color.r).toBeCloseTo(1.0, 2);
    expect(color.g).toBeCloseTo(0.0, 2);
    expect(color.b).toBeCloseTo(128 / 255, 2);
  });

  it('should parse valid hex string', () => {
    const color = parseColorToThree('#ff0000');
    expect(color).toBeInstanceOf(THREE.Color);
    expect(color.r).toBeCloseTo(1.0, 2);
    expect(color.g).toBeCloseTo(0.0, 2);
    expect(color.b).toBeCloseTo(0.0, 2);
  });

  it('should fallback to cobalt blue for null, undefined, or empty input', () => {
    const defaultColor = new THREE.Color(0x0047bb);
    expect(parseColorToThree(null).getHex()).toBe(defaultColor.getHex());
    expect(parseColorToThree(undefined).getHex()).toBe(defaultColor.getHex());
    expect(parseColorToThree('').getHex()).toBe(defaultColor.getHex());
  });

  it('should fallback to default for malformed rgb strings', () => {
    const defaultColor = new THREE.Color(0x0047bb);
    expect(parseColorToThree('rgb(invalid)').getHex()).toBe(defaultColor.getHex());
    expect(parseColorToThree('not-a-color').getHex()).toBe(defaultColor.getHex());
  });
});

describe('audioUtils - deriveSectorPalette', () => {
  it('should derive 4 sector colors with proper HSL offsets', () => {
    const primary = new THREE.Color(0x0047bb);
    const palette = deriveSectorPalette(primary);
    expect(palette).toHaveProperty('primary');
    expect(palette).toHaveProperty('centerPurple');
    expect(palette).toHaveProperty('bottomRed');
    expect(palette).toHaveProperty('cornerAmber');
    expect(palette.primary.getHex()).toBe(primary.getHex());
    expect(palette.centerPurple.getHex()).not.toBe(primary.getHex());
    expect(palette.bottomRed.getHex()).not.toBe(primary.getHex());
    expect(palette.cornerAmber.getHex()).not.toBe(primary.getHex());
  });
});
