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
  it("applies inverted logarithm in the right order", () => {
    const It = ndarray([4902010], [1]);
    const I0 = ndarray([2598342], [1]);
    const absorbance = prepareYData(It, I0, "÷", {
      inverted: true,
      logarithm: true,
    });
    expect(unpack(absorbance)[0]).toBeCloseTo(-0.6347787032985249);
  });
  // it("applies gradient", () => {
  // 	const result = prepareYData([10, 20], [2, 4], "", {gradient: true});
  // 	expect(result).toEqual([]);
  // });
});
