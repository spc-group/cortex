import cwise from "cwise";
import ndarray from "ndarray";
import ndunpack from "ndarray-unpack";

import type { Dataset } from "./types";

/**
 * Element-wise addition of one array by another.
 *
 * i.e. out = s + r
 *
 * Writes the result to the given *out* array.
 *
 * @param out - The array to store results.
 * @param s - The first operand array.
 * @param r - The second operand array.
 */
const add = cwise({
  args: ["array", "array", "array"],
  body: function (out: number, s: number, r: number) {
    out = Number(s) + Number(r);
    // We need to do something with the variable or built output is wrong
    console.assert(typeof out === "number");
  },
});

/**
 * Element-wise subtraction of one array by another.
 *
 * i.e. out = s - r
 *
 * Writes the result to the given *out* array.
 *
 * @param out - The array to store results.
 * @param s - The first operand array.
 * @param r - The second operand array.
 */
const subtract = cwise({
  args: ["array", "array", "array"],
  body: function (out: number, s: number, r: number) {
    out = Number(s) - Number(r);
    // We need to do something with the variable or built output is wrong
    console.assert(typeof out === "number");
  },
});

/**
 * Element-wise multiplication of one array by another.
 *
 * i.e. out = s * r
 *
 * Writes the result to the given *out* array.
 *
 * @param out - The array to store results.
 * @param s - The first operand array.
 * @param r - The second operand array.
 */
const multiply = cwise({
  args: ["array", "array", "array"],
  body: function (out: number, s: number, r: number) {
    out = Number(s) * Number(r);
    // We need to do something with the variable or built output is wrong
    console.assert(typeof out === "number");
  },
});

/**
 * Element-wise division of one array by another.
 *
 * i.e. out = s / r
 *
 * Writes the result to the given *out* array.
 *
 * @param out - The array to store results.
 * @param s - The first operand array.
 * @param r - The second operand array.
 */
const divide = cwise({
  args: ["array", "array", "array"],
  body: function (
    // ts-expect-error: cwise uses this variable to capture output
    out: number,
    s: number,
    r: number,
  ) {
    out = Number(s) / Number(r);
    // We need to do something with the variable or built output is wrong
    console.assert(typeof out === "number");
  },
});

/**
 * Takes the base-e logarithm (ln(y)) of the values element-wise in an
 * ndarray.
 *
 * Writes the results to the same array that was passed in.
 *
 * @param y - The input (and output) arrays.
 */
const applyLogarithm = cwise({
  args: ["array"],
  body: function (y: number) {
    y = Math.log(y);
    // We need to do something with the variable or built output is wrong
    console.assert(typeof y === "number");
  },
});

/**
 * Invert (1/y) the values element-wise in an ndarray.
 *
 * Writes the results to the same array that was passed in.
 *
 * @param y - The input (and output) arrays.
 */
const invert = cwise({
  args: ["array"],
  body: function (y: number) {
    y = 1 / y;
    // We need to do something with the variable or built output is wrong
    console.assert(typeof y === "number");
  },
});

/**
 * Calculate the gradient of y with respect to x (dy/dx).
 *
 * @param xarray - The x-values of the line.
 * @param yarray - The y-values of the line.
 */
const applyGradient = cwise({
  args: [
    "array",
    "array",
    "array",
    { offset: [-1], array: 0 },
    { offset: [1], array: 0 },
    { offset: [-1], array: 1 },
    { offset: [1], array: 1 },
  ],
  body: function (
    x: number,
    y: number,
    out: number,
    xl: number,
    xr: number,
    yl: number,
    yr: number,
  ) {
    let xr_ = xr;
    if (xr == null) xr_ = x;
    let xl_ = xl;
    if (xl == null) xl_ = x;
    let yr_ = yr;
    if (yr == null) yr_ = y;
    let yl_ = yl;
    if (yl == null) yl_ = y;
    out = (yr_ - yl_) / (xr_ - xl_);
    // We need to do something with the variable or built output is wrong
    console.assert(typeof out === "number");
  },
});

/**
 * Perform the requested calculations on data to produce dependent
 * ("Y") data
 *
 * Order of operations:
 *   1. Apply reference correction
 *   2. Invert
 *   3. Logarithm
 *   4. Gradient
 *
 * @param xdata - The independent values that would be on the 'x' axis.
 * @param sdata - The signal of interest.
 * @param rdata - The reference signal to correct the signal of interest.
 * @param operation - How to apply the reference data to the signal.
 * @param options - Additional steps to take when preparing the data.
 */

export function prepareYData(
  xdata: Dataset | null,
  sdata: Dataset | null,
  rdata: Dataset | null,
  operation: string | null,
  options?: { inverted?: boolean; logarithm?: boolean; gradient?: boolean },
) {
  const { inverted, logarithm, gradient } = options ?? {};
  // Weed out nonsense values
  const operations = ["+", "−", "×", "÷"];
  const isValidOp = operations.includes(operation ?? "");
  if (sdata == null) {
    return null;
  } else if (rdata == null && isValidOp) {
    return null;
  }

  // We need to limit the array sizes to the smallest one to avoid errors
  const commonShape = Math.min(
    sdata == null ? Infinity : sdata.values.shape[0],
    rdata == null || !isValidOp ? Infinity : rdata.values.shape[0],
    xdata == null || !gradient ? Infinity : xdata.values.shape[0],
  );
  let ydata = ndarray(ndunpack(sdata.values).map(Number), [commonShape]);
  const sdata_ = sdata.values.hi(commonShape);
  const xdata_ = xdata == null ? null : xdata.values.hi(commonShape);

  // Apply reference correction
  if (isValidOp && rdata != null) {
    const rdata_ = rdata.values.hi(commonShape);
    switch (operation) {
      case "+":
        add(ydata, sdata_, rdata_);
        break;
      case "−":
        subtract(ydata, sdata_, rdata_);
        break;
      case "×":
        multiply(ydata, sdata_, rdata_);
        break;
      case "÷":
        divide(ydata, sdata_, rdata_);
        break;
    }
  }

  // Apply other operations (order matters!!)
  if (inverted) {
    invert(ydata);
  }
  if (logarithm) {
    applyLogarithm(ydata);
  }
  if (gradient) {
    // We need an empty array to avoid clobbering later values with
    // earlier derivatives
    const out = ndarray(
      Array(ydata.shape.length).fill(0),
      ydata.shape,
      ydata.stride,
      ydata.offset,
    );
    if (xdata_ != null) {
      applyGradient(xdata_, ydata, out);
    }
    ydata = out;
  }
  return ydata;
}
