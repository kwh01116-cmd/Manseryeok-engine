import assert from "node:assert/strict";
import test from "node:test";

import {
  SOLAR_TERM_CODES,
  SOLAR_TERM_DEFINITIONS,
  solarTermDefinition,
} from "../dist/index.js";

test("solar-term taxonomy contains exactly 24 unique terms and longitudes", () => {
  assert.equal(SOLAR_TERM_CODES.length, 24);
  assert.equal(new Set(SOLAR_TERM_CODES).size, 24);

  const longitudes = SOLAR_TERM_CODES.map(
    (code) => SOLAR_TERM_DEFINITIONS[code].solarLongitudeDegrees,
  );
  assert.equal(new Set(longitudes).size, 24);
  assert.ok(longitudes.every((value) => value >= 0 && value < 360 && value % 15 === 0));
});

test("civil-year solar-term order advances by 15 degrees modulo 360", () => {
  const longitudes = SOLAR_TERM_CODES.map(
    (code) => SOLAR_TERM_DEFINITIONS[code].solarLongitudeDegrees,
  );
  for (let index = 1; index < longitudes.length; index += 1) {
    assert.equal((longitudes[index - 1] + 15) % 360, longitudes[index]);
  }
});

test("canonical KASI anchor terms retain their published longitudes", () => {
  assert.deepEqual(solarTermDefinition("LICHUN"), {
    code: "LICHUN",
    koreanName: "입춘",
    hanjaName: "立春",
    solarLongitudeDegrees: 315,
  });
  assert.equal(solarTermDefinition("CHUNFEN").solarLongitudeDegrees, 0);
  assert.equal(solarTermDefinition("DONGZHI").solarLongitudeDegrees, 270);
});
