import cwise from "cwise";
import ndarray from "ndarray";
import ndunpack from "ndarray-unpack";
import type { PyodideAPI } from "pyodide";
import type { TypedArray } from "../tiled";

// Reference correction ops
const add = cwise({
  args: ["array", "array", "array"],
  body: function (y: number, s: number, r: number) {
    y = Number(s) + Number(r);
    console.assert(y); // Make the type-checkers and linters happy
  },
});
const subtract = cwise({
  args: ["array", "array", "array"],
  body: function (y: number, s: number, r: number) {
    y = Number(s) - Number(r);
    console.assert(y); // Make the type-checkers and linters happy
  },
});
const multiply = cwise({
  args: ["array", "array", "array"],
  body: function (y: number, s: number, r: number) {
    y = Number(s) * Number(r);
    console.assert(y); // Make the type-checkers and linters happy
  },
});
const divide = cwise({
  args: ["array", "array", "array"],
  body: function (y: number, s: number, r: number) {
    y = Number(s) / Number(r);
    console.assert(y); // Make the type-checkers and linters happy
  },
});
// Representation functions
const applyLogarithm = cwise({
  args: ["array"],
  body: function (y: number) {
    y = Math.log(y);
    console.assert(y); // Make the type-checkers and linters happy
  },
});
const invert = cwise({
  args: ["array"],
  body: function (y: number) {
    y = 1 / y;
    console.assert(y); // Make the type-checkers and linters happy
  },
});

/**
 * Calculate the gradient of y with respect to x (dy/dx).
 */
const applyGradient = (
  xArray: ndarray.NdArray | null,
  yArray: ndarray.NdArray,
  pyodide?: PyodideAPI,
) => {
  if (pyodide == null) return null;
  if (xArray == null) return yArray;
  const globals = pyodide.toPy({ xArray: xArray.data, sdata: yArray.data });
  const result = pyodide.runPython(
    `
  import numpy as np
  grad = np.gradient(sdata, xArray)
  # Convert to a form we can easily transer back to javascript
  [*grad]
`,
    { globals: globals },
  );
  for (let i = 0; i < result.length; i++) {
    const yData = yArray.data as TypedArray | number[];
    yData[i] = result[i];
  }
  return yArray;
};

export function prepareYData(
  xdata: ndarray.NdArray | null,
  sdata: ndarray.NdArray | null,
  rdata: ndarray.NdArray | null,
  operation: string | null,
  options?: { inverted?: boolean; logarithm?: boolean; gradient?: boolean },
  pyodide?: PyodideAPI,
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
    sdata == null ? Infinity : sdata.shape[0],
    rdata == null || !isValidOp ? Infinity : rdata.shape[0],
  );
  const ydata = ndarray(ndunpack(sdata).map(Number), [commonShape]);
  const sdata_ = sdata.hi(commonShape);

  // Apply reference correction
  if (isValidOp && rdata != null) {
    const rdata_ = rdata.hi(commonShape);
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
    applyGradient(xdata, ydata, pyodide);
  }
  return ydata;
}
