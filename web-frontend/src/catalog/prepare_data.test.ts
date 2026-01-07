import { expect, describe, it } from "vitest";

import { prepareYData } from "./prepare_data";

describe("the prepareYData() function", () => {
  // +−×÷
  it("applies reference signal", () => {
    const result = prepareYData([10, 20], [2, 4], "÷");
    expect(result).toEqual([5, 5]);
  });
  it("applies inverts", () => {
    const result = prepareYData([10, 20], [2, 4], "", { inverted: true });
    expect(result).toEqual([0.1, 0.05]);
  });
  it("applies logarithm", () => {
    const result = prepareYData([10, 20], [2, 4], "", { logarithm: true });
    expect(result).toEqual([Math.log(10), Math.log(20)]);
  });
  // it("applies gradient", () => {
  // 	const result = prepareYData([10, 20], [2, 4], "", {gradient: true});
  // 	expect(result).toEqual([]);
  // });
});
