import { expect, describe, it } from "vitest";
import unpack from "ndarray-unpack";
import ndarray from "ndarray";

import { prepareYData } from "./prepare_data";

describe("the prepareYData() function", () => {
  // +−×÷
  it("applies reference signal", () => {
    const result = prepareYData(
      ndarray([10, 20], [2]),
      ndarray([2, 4], [2]),
      "÷",
    );
    expect(unpack(result)).toEqual([5, 5]);
  });
  it("applies inverts", () => {
    const result = prepareYData(
      ndarray([10, 20], [2]),
      ndarray([2, 4], [2]),
      "",
      { inverted: true },
    );
    expect(unpack(result)[0]).toBeCloseTo(1 / 10);
    expect(unpack(result)[1]).toBeCloseTo(1 / 20);
  });
  it("applies logarithm", () => {
    const result = prepareYData(
      ndarray([10, 20], [2]),
      ndarray([2, 4], [2]),
      "",
      { logarithm: true },
    );
    expect(unpack(result)[0]).toBeCloseTo(Math.log(10));
    expect(unpack(result)[1]).toBeCloseTo(Math.log(20));
  });
  // it("applies gradient", () => {
  // 	const result = prepareYData([10, 20], [2, 4], "", {gradient: true});
  // 	expect(result).toEqual([]);
  // });
});
