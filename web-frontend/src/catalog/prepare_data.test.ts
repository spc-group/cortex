import { expect, describe, it } from "vitest";
import unpack from "ndarray-unpack";
import ndarray from "ndarray";

import { prepareYData } from "./prepare_data";
import { Operation } from "./types";

describe("the prepareYData() function", () => {
  // +−×÷
  it("applies reference signal", async () => {
    const sdata = { values: ndarray([10, 20], [2]), timestamps: null };
    const rdata = { values: ndarray([2, 4], [2]), timestamps: null };
    const xdata = null;
    const operation = "÷";
    const result = await prepareYData(xdata, sdata, rdata, operation);
    expect(unpack(result)).toEqual([5, 5]);
  });
  it("applies inverts", async () => {
    const sdata = { values: ndarray([10, 20], [2]), timestamps: null };
    const rdata = { values: ndarray([2, 4], [2]), timestamps: null };
    const xdata = null;
    const operation = "";
    const result = await prepareYData(xdata, sdata, rdata, operation, {
      inverted: true,
    });
    expect(unpack(result)[0]).toBeCloseTo(1 / 10);
    expect(unpack(result)[1]).toBeCloseTo(1 / 20);
  });
  it("applies logarithm", async () => {
    const xdata = null;
    const sdata = { values: ndarray([10, 20, 40], [2]), timestamps: null };
    const rdata = { values: ndarray([2, 4, 6], [2]), timestamps: null };
    const operation = "";
    const result = await prepareYData(xdata, sdata, rdata, operation, {
      logarithm: true,
    });
    expect(unpack(result)[0]).toBeCloseTo(Math.log(10));
    expect(unpack(result)[1]).toBeCloseTo(Math.log(20));
  });
  it("applies inverted logarithm in the right order", async () => {
    const It = { values: ndarray([4902010], [1]), timestamps: null };
    const I0 = { values: ndarray([2598342], [1]), timestamps: null };
    const absorbance = await prepareYData(null, It, I0, "÷", {
      inverted: true,
      logarithm: true,
    });
    expect(unpack(absorbance)[0]).toBeCloseTo(-0.6347787032985249);
  });
  it("applies gradient", async () => {
    const xdata = { values: ndarray([2, 4, 6], [3]), timestamps: null };
    const sdata = { values: ndarray([10, 20, 40], [3]), timestamps: null };
    const result = await prepareYData(xdata, sdata, null, "", {
      gradient: true,
    });
    expect(result).toEqual(ndarray([5, 7.5, 10], [3]));
  });
  it("converts incompatible shapes", async () => {
    const xdata = { values: ndarray([2, 4, 6, 8], [4]), timestamps: null };
    const sdata = { values: ndarray([10, 20, 40], [3]), timestamps: null };
    const rdata = { values: ndarray([15, 18, 33], [2]), timestamps: null };
    const operation = Operation.DIVIDE;
    const result = await prepareYData(xdata, sdata, rdata, operation, {
      inverted: true,
      logarithm: true,
      gradient: true,
    });
    const smallestCommonShape = [2];
    expect(result?.shape).toEqual(smallestCommonShape);
  });
});
