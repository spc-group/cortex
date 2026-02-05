import "@testing-library/jest-dom/vitest";
import { expect, describe, it } from "vitest";

import { signalNames } from "./signal";

describe("the signalNames() function", () => {
  it("returns all signals hints", () => {
    const signals = signalNames({
      I0: {},
    });
    expect(signals).toEqual(["I0"]);
  });
  it("filters hints", () => {
    const signals = signalNames(
      {
        I0: {},
        It: {},
      },
      ["It"],
    );
    expect(signals).toEqual(["It"]);
  });
  it("sorts signals", () => {
    const signals = signalNames({
      Ib: {},
      Ia: {},
    });
    expect(signals).toEqual(["Ia", "Ib"]);
  });
});
