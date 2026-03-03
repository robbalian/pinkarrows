import test from 'node:test';
import assert from 'node:assert/strict';
import { hasDistinctEndpoints, parseCoordinate, validateLineEndpoints } from '../src/line-utils.mjs';

test('parseCoordinate parses numbers and rejects empty values', () => {
  assert.equal(parseCoordinate('12.5'), 12.5);
  assert.equal(parseCoordinate('-4'), -4);
  assert.ok(Number.isNaN(parseCoordinate('')));
  assert.ok(Number.isNaN(parseCoordinate(undefined)));
});

test('hasDistinctEndpoints returns false for identical endpoints', () => {
  assert.equal(hasDistinctEndpoints(1, 2, 1, 2), false);
  assert.equal(hasDistinctEndpoints(1, 2, 2, 2), true);
});

test('validateLineEndpoints rejects non-numeric endpoints', () => {
  const result = validateLineEndpoints(NaN, 0, 10, 10, 500, 500);
  assert.equal(result.valid, false);
});

test('validateLineEndpoints rejects identical endpoints', () => {
  const result = validateLineEndpoints(20, 20, 20, 20, 500, 500);
  assert.equal(result.valid, false);
  assert.equal(result.message, 'Line endpoints must be different');
});

test('validateLineEndpoints rejects out-of-bounds endpoints', () => {
  const result = validateLineEndpoints(0, 0, 600, 10, 500, 500);
  assert.equal(result.valid, false);
  assert.equal(result.message, 'Endpoints must be inside the canvas');
});

test('validateLineEndpoints accepts valid in-bounds endpoints', () => {
  const result = validateLineEndpoints(0, 0, 500, 500, 500, 500);
  assert.deepEqual(result, { valid: true });
});
