import { expect, describe, it } from "vitest";
import unpack from "ndarray-unpack";
import ndarray from "ndarray";
import { loadPyodide } from "pyodide";

import { prepareYData } from "./prepare_data";

describe("the prepareYData() function", () => {
  // +−×÷
  it("applies reference signal", async () => {
    const sdata = ndarray([10, 20], [2]);
    const rdata = ndarray([2, 4], [2]);
    const xdata = null;
    const operation = "÷";
    const result = await prepareYData(xdata, sdata, rdata, operation);
    expect(unpack(result)).toEqual([5, 5]);
  });
  it("applies inverts", async () => {
    const sdata = ndarray([10, 20], [2]);
    const rdata = ndarray([2, 4], [2]);
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
    const sdata = ndarray([10, 20, 40], [2]);
    const rdata = ndarray([2, 4, 6], [2]);
    const operation = "";
    const result = await prepareYData(xdata, sdata, rdata, operation, {
      logarithm: true,
    });
    expect(unpack(result)[0]).toBeCloseTo(Math.log(10));
    expect(unpack(result)[1]).toBeCloseTo(Math.log(20));
  });
  it("applies inverted logarithm in the right order", async () => {
    const It = ndarray([4902010], [1]);
    const I0 = ndarray([2598342], [1]);
    const absorbance = await prepareYData(null, It, I0, "÷", {
      inverted: true,
      logarithm: true,
    });
    expect(unpack(absorbance)[0]).toBeCloseTo(-0.6347787032985249);
  });
  it("applies gradient", async () => {
    const pyodide = await loadPyodide();
    await pyodide.loadPackage("numpy");
    const xdata = ndarray([2, 4, 6], [3]);
    const sdata = ndarray([10, 20, 40], [3]);
    const result = await prepareYData(
      xdata,
      sdata,
      null,
      "",
      { gradient: true },
      pyodide,
    );
    expect(result).toEqual(ndarray([5, 7.5, 10], [3]));
  });
});
