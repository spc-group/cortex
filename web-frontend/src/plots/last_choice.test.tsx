import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { render, screen, cleanup } from "@testing-library/react";

import { useLastChoice, lastPreference } from "./last_choice";

describe("the lastPreference() function", () => {
  it("finds a valid preference", () => {
    const options = ["spam", "eggs"];
    const pastPrefs = ["eggs", "cheese"];
    const result = lastPreference(options, pastPrefs);
    expect(result).toEqual("eggs");
  });
  it("preserve preference order", () => {
    const options = ["spam", "cheese", "eggs"];
    const pastPrefs = ["eggs", "cheese"];
    const result = lastPreference(options, pastPrefs);
    expect(result).toEqual("eggs");
    expect(result).not.toEqual("cheese");
  });

  it("handles options with no preference", () => {
    const options = ["spam", "eggs"];
    const pastPrefs = ["cheese", "bacon"];
    const result = lastPreference(options, pastPrefs);
    expect(result).toEqual(null);
  });
});

const MockComponent = () => {
  const [lastChoice, addChoice] = useLastChoice(
    "",
    ["spam", "eggs", "cheese"],
    "my_key",
  );
  return (
    <>
      <button onClick={() => addChoice("eggs")}>Click me!</button>
      <div>Last: {lastChoice}</div>
    </>
  );
};

afterEach(() => {
  cleanup();
});

describe("the useLastChoice() hook", () => {
  let user: UserEvent;
  beforeEach(() => {
    user = userEvent.setup();
    localStorage.clear();
  });
  it("is blank by default", () => {
    render(<MockComponent />);
    expect(screen.getByText("Last:")).toBeInTheDocument();
  });
  it("updates its value", async () => {
    localStorage.setItem("my_key", '["bacon"]');
    render(<MockComponent />);
    const button = screen.getByRole("button");
    await user.click(button);
    expect(screen.getByText("Last: eggs")).toBeInTheDocument();
    expect(localStorage.getItem("my_key")).toEqual('["eggs","bacon"]');
  });
  it("returns past choices by default", async () => {
    localStorage.setItem("my_key", '["cheese"]');
    render(<MockComponent />);
    expect(screen.getByText("Last: cheese")).toBeInTheDocument();
  });
});
