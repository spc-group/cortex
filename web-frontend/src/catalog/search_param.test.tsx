import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { expect, describe, beforeEach, afterEach, it } from "vitest";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";

import { useSearchParam } from "./search_param";

const MockComponent = ({
  newValue,
  defaultValue,
}: {
  newValue: number | boolean | string;
  defaultValue: number | boolean | string;
}) => {
  const loc = useLocation();
  const [value, setValue] = useSearchParam("spam", defaultValue);
  return (
    <>
      <button onClick={() => setValue(newValue)}>Click me!</button>
      <div>Value: {String(value)}</div>
      <div>Type: {typeof value}</div>
      <div>Search: {loc.search}</div>
    </>
  );
};

afterEach(() => {
  cleanup();
});

describe("the useSearchParam() hook", () => {
  let user: UserEvent;
  beforeEach(() => {
    user = userEvent.setup();
  });
  it("updates search parameters", async () => {
    render(
      <MemoryRouter>
        <MockComponent newValue={"eggs"} defaultValue={""} />
      </MemoryRouter>,
    );
    const button = screen.getByRole("button");
    await user.click(button);
    expect(screen.getByText("Value: eggs")).toBeInTheDocument();
    expect(screen.getByText("Type: string")).toBeInTheDocument();
    expect(screen.getByText("Search: ?spam=eggs")).toBeInTheDocument();
  });
  it("converts numbers", async () => {
    render(
      <MemoryRouter>
        <MockComponent newValue={3} defaultValue={0} />
      </MemoryRouter>,
    );
    const button = screen.getByRole("button");
    await user.click(button);
    expect(screen.getByText("Value: 3")).toBeInTheDocument();
    expect(screen.getByText("Type: number")).toBeInTheDocument();
    expect(screen.getByText("Search: ?spam=3")).toBeInTheDocument();
  });
  it("converts booleans", async () => {
    render(
      <MemoryRouter>
        <MockComponent newValue={true} defaultValue={false} />
      </MemoryRouter>,
    );
    const button = screen.getByRole("button");
    await user.click(button);
    expect(screen.getByText("Value: true")).toBeInTheDocument();
    expect(screen.getByText("Type: boolean")).toBeInTheDocument();
    expect(screen.getByText("Search: ?spam=true")).toBeInTheDocument();
  });
});
