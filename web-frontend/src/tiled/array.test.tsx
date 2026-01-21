import "@testing-library/jest-dom/vitest";
// import type { ReactElement } from "react";
// import { render, cleanup } from "@testing-library/react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter } from "react-router";
import { describe, it } from "vitest";
// import { tableFromArrays } from "apache-arrow";

// import { updateTableData, useDataTable } from "./use_data_table.ts";

// const oldTable = tableFromArrays({
//   x: [1, 2, 3],
//   y: [5, 10, 20],
// });

// const nextRow = tableFromArrays({
//   x: [4],
//   y: [30],
// });

describe("useFrame", () => {
  it("returns the requested array frame", () => {});
});
//   it("returns original table by default", () => {
//     const newTable = updateArrayData(oldArray, {
//       type: "something-else",
//       sequence: 10,
//       timestamp: "2026-01-14T16:52:42.336523",
//       mimetype: "application/vnd.apache.arrow.file",
//       partition: 0,
//       append: true,
//       payload: nextRow,
//     });
//     expect(newTable).toBe(oldTable);
//   });
//   it("appends next row", () => {
//     const newTable = updateTableData(oldTable, {
//       type: "table-data",
//       sequence: 10,
//       timestamp: "2026-01-14T16:52:42.336523",
//       mimetype: "application/vnd.apache.arrow.file",
//       partition: 0,
//       append: true,
//       payload: nextRow,
//     });
//     expect(newTable).not.toBe(oldTable);
//     expect(newTable?.getChild("x")?.toArray()).toEqual(
//       new Float64Array([1, 2, 3, 4]),
//     );
//     expect(newTable?.getChild("y")?.toArray()).toEqual(
//       new Float64Array([5, 10, 20, 30]),
//     );
//   });
//   it("replaces the old table", () => {
//     const updatedTable = tableFromArrays({
//       x: [4, 5, 6],
//       y: [30, 40, 60],
//     });

//     const newTable = updateTableData(oldTable, {
//       type: "table-data",
//       sequence: 10,
//       timestamp: "2026-01-14T16:52:42.336523",
//       mimetype: "application/vnd.apache.arrow.file",
//       partition: 0,
//       append: false,
//       payload: updatedTable,
//     });
//     expect(newTable).toBe(updatedTable);
//   });
// });

// describe("useDataTable() hook", () => {
//   const doRender = async (elem: ReactElement) => {
//     const queryClient = new QueryClient();
//     return await render(
//       <BrowserRouter>
//         <QueryClientProvider client={queryClient}>{elem}</QueryClientProvider>
//       </BrowserRouter>,
//     );
//   };
//   const TableComponent = () => {
//     const stream = {
//       ancestors: [],
//       data_keys: {},
//       configuration: {},
//       structure_family: "",
//       specs: [],
//       hints: {},
//       time: 0,
//       uid: "",
//       key: "",
//     };
//     const { table } = useDataTable(stream);
//     return (
//       <div>
//         {table?.toArray().map((row) => (
//           <div key={row.x}>x = {row.x}</div>
//         ))}
//       </div>
//     );
//   };
//   beforeEach(() => {
//     vi.mock("@tanstack/react-query", async (importOriginal) => {
//       return {
//         ...(await importOriginal()),
//         useQuery: () => ({
//           data: tableFromArrays({
//             x: [1, 2, 3],
//           }),
//           isLoading: false,
//         }),
//       };
//     });
//     vi.mock("./streaming", async () => {
//       return {
//         useTiledWebSocket: () => ({
//           payload: {
//             type: "table-data",
//             sequence: 2,
//             payload: nextRow,
//             append: true,
//           },
//           readyState: 1,
//         }),
//       };
//     });
//   });
//   afterEach(() => {
//     vi.restoreAllMocks();
//     cleanup();
//   });
//   it("returns combined tables", async () => {
//     const { getByText } = await doRender(<TableComponent />);
//     // This one comes from the HTTP request
//     expect(getByText("x = 1")).toBeInTheDocument();
//     // This one comes from websockets
//     expect(getByText("x = 4")).toBeInTheDocument();
//   });
// });

// // {"detail":"None of the media types requested by the client are supported. Supported: text/plain, image/tiff, image/png, text/csv, text/x-comma-separated-values, application/octet-stream, application/vnd.ms-excel, application/json, text/html. Requested: blah."}%
