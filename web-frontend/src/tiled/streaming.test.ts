import { tableFromArrays, tableToIPC, Table } from "apache-arrow";
import { encode } from "@msgpack/msgpack";
import { describe, it, expect } from "vitest";
import { Blob } from "node:buffer";

import { makeWebsocketUrl, decodeMsgPack } from "./streaming.ts";

describe("decodeMsgPack()", () => {
  it("decodes binary data", async () => {
    const bytes = encode({ spam: "eggs" });
    const result = await decodeMsgPack(new Blob([bytes]));
    expect(result).toEqual({ spam: "eggs" });
  });
  it("parses apache arrow arrays", async () => {
    const table = tableFromArrays({
      signal: [1, 2, 3, 5, 7, 11, 13, 17, 19],
    });
    const obj = {
      payload: tableToIPC(table),
      mimetype: "application/vnd.apache.arrow.file",
    };
    const bytes = encode(obj);
    const result = await decodeMsgPack(new Blob([bytes]));
    const resultTable = result.payload as Table;
    expect(resultTable.toArray()).toEqual(table.toArray());
  });
});

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
