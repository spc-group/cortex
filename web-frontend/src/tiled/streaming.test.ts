import { describe, it, expect } from "vitest";

import { makeWebsocketUrl } from "./streaming.ts";

describe("makeWebsocketUrl()", () => {
  it("replaces http protocol", () => {
    const newUrl = makeWebsocketUrl("http://example.com/");
    expect(newUrl).toEqual("ws://example.com/");
  });
  it("upgrades to wss", () => {
    const newUrl = makeWebsocketUrl("https://example.com/");
    expect(newUrl).toEqual("wss://example.com/");
  });
});
