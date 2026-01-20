const first = (a: number) => a;
const add = (a: number, b: number) => a + b;
const subtract = (a: number, b: number) => a - b;
const multiply = (a: number, b: number) => a * b;
const divide = (a: number, b: number) => a / b;

export function prepareYData(
  vdata: number[] | null,
  rdata: number[] | null,
  operation: string,
  { inverted, logarithm }: { inverted?: boolean; logarithm?: boolean } = {},
) {
  // Weed out nonsense values
  const operations = ["+", "−", "×", "÷"];
  if (vdata == null) {
    return null;
  } else if (rdata == null && operations.includes(operation)) {
    return null;
  }

  let op;
  switch (operation) {
    //
    case "+":
      op = add;
      break;
    case "−":
      op = subtract;
      break;
    case "×":
      op = multiply;
      break;
    case "÷":
      op = divide;
      break;
    default:
      op = first;
      break;
  }
  const ydata = vdata.map(function (num, idx) {
    const rval = rdata != null ? rdata[idx] : 0;
    let val = op(num, rval);
    if (inverted) {
      val = 1 / val;
    }
    if (logarithm) {
      val = Math.log(val);
    }
    return val;
  });
  return ydata;
}
