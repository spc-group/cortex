import cwise from "cwise";
import ndarray from "ndarray";
import ndunpack from "ndarray-unpack";

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

export function prepareYData(
  vdata: ndarray.NdArray | null,
  rdata: ndarray.NdArray | null,
  operation: string,
  { inverted, logarithm }: { inverted?: boolean; logarithm?: boolean } = {},
) {
  // Weed out nonsense values
  const operations = ["+", "−", "×", "÷"];
  const isValidOp = operations.includes(operation);
  if (vdata == null) {
    return null;
  } else if (rdata == null && isValidOp) {
    return null;
  }

  // We need to limit the array sizes to the smallest one to avoid errors
  const commonShape = Math.min(
    vdata == null ? Infinity : vdata.shape[0],
    rdata == null || !isValidOp ? Infinity : rdata.shape[0],
  );
  const ydata = ndarray(ndunpack(vdata).map(Number), [commonShape]);
  const vdata_ = vdata.hi(commonShape);

  // Apply reference correction
  if (isValidOp && rdata != null) {
    const rdata_ = rdata.hi(commonShape);
    switch (operation) {
      case "+":
        add(ydata, vdata_, rdata_);
        break;
      case "−":
        subtract(ydata, vdata_, rdata_);
        break;
      case "×":
        multiply(ydata, vdata_, rdata_);
        break;
      case "÷":
        divide(ydata, vdata_, rdata_);
        break;
    }
  }

  // Apply other operations
  if (logarithm) {
    applyLogarithm(ydata);
  }
  if (inverted) {
    invert(ydata);
  }

  return ydata;
}
