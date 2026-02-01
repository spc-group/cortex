import "@testing-library/jest-dom/vitest";
import { render, cleanup } from "@testing-library/react";
import { vi, describe, it, expect, afterEach } from "vitest";
import type { Mock } from "vitest";
import useWebSocket from "react-use-websocket";

import { usePV } from "./pv";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

vi.mock("react-use-websocket", () => {
  return {
    default: vi.fn(),
  };
});

const MockComponent = ({ pv }: { pv: string }) => {
  const { value } = usePV(pv);
  return (
    <>
      <div>Value: {value}</div>
    </>
  );
};

describe("the usePV() hook", () => {
  it("connects to the PV", async () => {
    (useWebSocket as Mock).mockImplementation(() => {
      return { lastMessage: { data: JSON.stringify({}) } };
    });
    render(<MockComponent pv="255idc:vac1" />);
    expect((useWebSocket as Mock).mock.calls.length).toBeGreaterThan(0);
    expect((useWebSocket as Mock).mock.calls[0][1].onOpen).toBeDefined();
  });
  // it("responds to new values", async () => {
  //   useWebSocket.mockImplementationOnce(() => {
  //     return {
  // 	lastMessage:
  // 	  {
  // 	    data: JSON.stringify({
  // 	      value: 87.34,
  // 	    }),
  // 	  },
  //     };
  //   }).mockImplementationOnce(() => {
  //     return {lastMessage: {data: ""}};
  //   });
  //   const rendered = render(<Mock pv="255idc:vac1" />);
  //   expect(useWebSocket.mock.calls.length).toBeGreaterThan(0);
  //   expect(useWebSocket.mock.calls[0][1].onOpen).toBeDefined();
  //   await act(() => {
  //     rendered.rerender()
  //   });
  //   expect(screen.getByText("Value: 87.34")).toBeInTheDocument();;
  // });
});
