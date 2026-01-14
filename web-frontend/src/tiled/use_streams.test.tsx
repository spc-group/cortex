import "@testing-library/jest-dom/vitest";
import type { ReactElement } from "react";
import { render, screen, cleanup, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { useStreams, streamsAreEqual } from "./use_streams";

beforeEach(() => {
  vi.mock("@tanstack/react-query", async (importOriginal) => {
    return {
      ...(await importOriginal()),
      useQuery: () => ({
        data: {
          baseline: {},
        },
        isLoading: false,
      }),
    };
  });
  vi.mock("./streaming", async () => {
    return {
      useTiledWebSocket: () => ({
        payload: {
          type: "container-child-created",
          sequence: 1,
          key: "primary",
        },
        readyState: 1,
      }),
    };
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const doRender = (elem: ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{elem}</QueryClientProvider>
    </BrowserRouter>,
  );
};

const StreamsComponent = ({ uid }: { uid: string }) => {
  const { streams } = useStreams(uid);
  return Object.entries(streams).map(([key]) => <div key={key}>{key}</div>);
};

describe("useStreams() hook", () => {
  it("returns stream names", async () => {
    await act(() => {
      doRender(<StreamsComponent uid="new_run" />);
    });
    expect(screen.getByText("baseline")).toBeInTheDocument();
  });
  it("responds to websocket updates", async () => {
    await act(() => {
      doRender(<StreamsComponent uid="new_run" />);
    });
    expect(screen.getByText("primary")).toBeInTheDocument();
  });
});

describe("streamsAreEqual() test", () => {
  const emptyStream = {
    structure_family: "",
    specs: [],
    data_keys: {},
    configuration: {},
    hints: {},
    time: 0,
    uid: "",
    key: "",
    ancestors: [],
  };
  it("checks keys", () => {
    const a = { hello: emptyStream };
    const b = { hello: emptyStream };
    expect(streamsAreEqual(a, b)).toBeTruthy();
  });
  it("checks stream ancestors", () => {
    const a = {
      hello: {
        ...emptyStream,
        ancestors: ["a"],
      },
    };
    const b = {
      hello: {
        ...emptyStream,
        ancestors: ["b"],
      },
    };
    expect(streamsAreEqual(a, b)).toBeFalsy();
  });
});

// Websocket payload when new stream is added
// {
//     "type": "container-child-created",
//     "sequence": 1,
//     "timestamp": "2026-01-13T09:34:18.032779",
//     "key": "primary",
//     "structure_family": "container",
//     "specs": [
//         {
//             "name": "BlueskyEventStream",
//             "version": "3.0"
//         },
//         {
//             "name": "composite",
//             "version": null
//         }
//     ],
//     "metadata": {
//         "configuration": {
//             "det": {
//                 "data": {
//                     "det-channel-1-mode": "Low Energy",
//                     "det-channel-2-mode": "Low Energy",
//                     "det-channel-3-mode": "Low Energy"
//                 },
//                 "timestamps": {
//                     "det-channel-1-mode": 1768190082.0479984,
//                     "det-channel-2-mode": 1768190082.0480897,
//                     "det-channel-3-mode": 1768190082.0481584
//                 },
//                 "data_keys": {
//                     "det-channel-1-mode": {
//                         "dtype": "string",
//                         "shape": [],
//                         "dtype_numpy": "|S40",
//                         "source": "soft://det-channel-1-mode",
//                         "choices": [
//                             "Low Energy",
//                             "High Energy"
//                         ]
//                     },
//                     "det-channel-2-mode": {
//                         "dtype": "string",
//                         "shape": [],
//                         "dtype_numpy": "|S40",
//                         "source": "soft://det-channel-2-mode",
//                         "choices": [
//                             "Low Energy",
//                             "High Energy"
//                         ]
//                     },
//                     "det-channel-3-mode": {
//                         "dtype": "string",
//                         "shape": [],
//                         "dtype_numpy": "|S40",
//                         "source": "soft://det-channel-3-mode",
//                         "choices": [
//                             "Low Energy",
//                             "High Energy"
//                         ]
//                     }
//                 }
//             },
//             "stage-x": {
//                 "data": {
//                     "stage-x-velocity": 1,
//                     "stage-x-units": "mm",
//                     "stage-x-acceleration_time": 0.5
//                 },
//                 "timestamps": {
//                     "stage-x-velocity": 1768190082.0470767,
//                     "stage-x-units": 1768190082.047165,
//                     "stage-x-acceleration_time": 1768190082.0471234
//                 },
//                 "data_keys": {
//                     "stage-x-velocity": {
//                         "dtype": "number",
//                         "shape": [],
//                         "dtype_numpy": "<f8",
//                         "source": "soft://stage-x-velocity"
//                     },
//                     "stage-x-units": {
//                         "dtype": "string",
//                         "shape": [],
//                         "dtype_numpy": "|S40",
//                         "source": "soft://stage-x-units"
//                     },
//                     "stage-x-acceleration_time": {
//                         "dtype": "number",
//                         "shape": [],
//                         "dtype_numpy": "<f8",
//                         "source": "soft://stage-x-acceleration_time"
//                     }
//                 }
//             }
//         },
//         "data_keys": {
//             "det-channel-1-value": {
//                 "dtype": "integer",
//                 "shape": [],
//                 "dtype_numpy": "<i8",
//                 "source": "soft://det-channel-1-value",
//                 "object_name": "det"
//             },
//             "det-channel-2-value": {
//                 "dtype": "integer",
//                 "shape": [],
//                 "dtype_numpy": "<i8",
//                 "source": "soft://det-channel-2-value",
//                 "object_name": "det"
//             },
//             "det-channel-3-value": {
//                 "dtype": "integer",
//                 "shape": [],
//                 "dtype_numpy": "<i8",
//                 "source": "soft://det-channel-3-value",
//                 "object_name": "det"
//             },
//             "stage-x": {
//                 "dtype": "number",
//                 "shape": [],
//                 "dtype_numpy": "<f8",
//                 "source": "soft://stage-x",
//                 "object_name": "stage-x"
//             }
//         },
//         "time": 1768318458.0044918,
//         "uid": "1dd6540d-1ed9-49a3-b8b1-08743119abf8",
//         "hints": {
//             "det": {
//                 "fields": [
//                     "det-channel-1-value",
//                     "det-channel-2-value",
//                     "det-channel-3-value"
//                 ]
//             },
//             "stage-x": {
//                 "fields": [
//                     "stage-x"
//                 ]
//             }
//         }
//     },
//     "data_sources": [],
//     "access_blob": {}
// }

// HTTP GET response for search
// /api/v1/search/3d811824-0747-44f9-b91d-05f7155f3a6d
//
// {
//     "data": [
//         {
//             "id": "primary",
//             "attributes": {
//                 "ancestors": [
//                     "3d811824-0747-44f9-b91d-05f7155f3a6d"
//                 ],
//                 "structure_family": "container",
//                 "specs": [
//                     {
//                         "name": "BlueskyEventStream",
//                         "version": "3.0"
//                     },
//                     {
//                         "name": "composite",
//                         "version": null
//                     }
//                 ],
//                 "metadata": {
//                     "uid": "1dd6540d-1ed9-49a3-b8b1-08743119abf8",
//                     "time": 1768318458.0044918,
//                     "hints": {
//                         "det": {
//                             "fields": [
//                                 "det-channel-1-value",
//                                 "det-channel-2-value",
//                                 "det-channel-3-value"
//                             ]
//                         },
//                         "stage-x": {
//                             "fields": [
//                                 "stage-x"
//                             ]
//                         }
//                     },
//                     "data_keys": {
//                         "stage-x": {
//                             "dtype": "number",
//                             "shape": [],
//                             "source": "soft://stage-x",
//                             "dtype_numpy": "<f8",
//                             "object_name": "stage-x"
//                         },
//                         "det-channel-1-value": {
//                             "dtype": "integer",
//                             "shape": [],
//                             "source": "soft://det-channel-1-value",
//                             "dtype_numpy": "<i8",
//                             "object_name": "det"
//                         },
//                         "det-channel-2-value": {
//                             "dtype": "integer",
//                             "shape": [],
//                             "source": "soft://det-channel-2-value",
//                             "dtype_numpy": "<i8",
//                             "object_name": "det"
//                         },
//                         "det-channel-3-value": {
//                             "dtype": "integer",
//                             "shape": [],
//                             "source": "soft://det-channel-3-value",
//                             "dtype_numpy": "<i8",
//                             "object_name": "det"
//                         }
//                     },
//                     "configuration": {
//                         "det": {
//                             "data": {
//                                 "det-channel-1-mode": "Low Energy",
//                                 "det-channel-2-mode": "Low Energy",
//                                 "det-channel-3-mode": "Low Energy"
//                             },
//                             "data_keys": {
//                                 "det-channel-1-mode": {
//                                     "dtype": "string",
//                                     "shape": [],
//                                     "source": "soft://det-channel-1-mode",
//                                     "choices": [
//                                         "Low Energy",
//                                         "High Energy"
//                                     ],
//                                     "dtype_numpy": "|S40"
//                                 },
//                                 "det-channel-2-mode": {
//                                     "dtype": "string",
//                                     "shape": [],
//                                     "source": "soft://det-channel-2-mode",
//                                     "choices": [
//                                         "Low Energy",
//                                         "High Energy"
//                                     ],
//                                     "dtype_numpy": "|S40"
//                                 },
//                                 "det-channel-3-mode": {
//                                     "dtype": "string",
//                                     "shape": [],
//                                     "source": "soft://det-channel-3-mode",
//                                     "choices": [
//                                         "Low Energy",
//                                         "High Energy"
//                                     ],
//                                     "dtype_numpy": "|S40"
//                                 }
//                             },
//                             "timestamps": {
//                                 "det-channel-1-mode": 1768190082.0479984,
//                                 "det-channel-2-mode": 1768190082.0480897,
//                                 "det-channel-3-mode": 1768190082.0481584
//                             }
//                         },
//                         "stage-x": {
//                             "data": {
//                                 "stage-x-units": "mm",
//                                 "stage-x-velocity": 1.0,
//                                 "stage-x-acceleration_time": 0.5
//                             },
//                             "data_keys": {
//                                 "stage-x-units": {
//                                     "dtype": "string",
//                                     "shape": [],
//                                     "source": "soft://stage-x-units",
//                                     "dtype_numpy": "|S40"
//                                 },
//                                 "stage-x-velocity": {
//                                     "dtype": "number",
//                                     "shape": [],
//                                     "source": "soft://stage-x-velocity",
//                                     "dtype_numpy": "<f8"
//                                 },
//                                 "stage-x-acceleration_time": {
//                                     "dtype": "number",
//                                     "shape": [],
//                                     "source": "soft://stage-x-acceleration_time",
//                                     "dtype_numpy": "<f8"
//                                 }
//                             },
//                             "timestamps": {
//                                 "stage-x-units": 1768190082.047165,
//                                 "stage-x-velocity": 1768190082.0470767,
//                                 "stage-x-acceleration_time": 1768190082.0471234
//                             }
//                         }
//                     }
//                 },
//                 "structure": {
//                     "contents": null,
//                     "count": 1
//                 },
//                 "access_blob": {},
//                 "sorting": [
//                     {
//                         "key": "",
//                         "direction": 1
//                     }
//                 ],
//                 "data_sources": null
//             },
//             "links": {
//                 "self": "http://fedorov.xray.aps.anl.gov:8022/api/v1/metadata/3d811824-0747-44f9-b91d-05f7155f3a6d/primary",
//                 "search": "http://fedorov.xray.aps.anl.gov:8022/api/v1/search/3d811824-0747-44f9-b91d-05f7155f3a6d/primary",
//                 "full": "http://fedorov.xray.aps.anl.gov:8022/api/v1/container/full/3d811824-0747-44f9-b91d-05f7155f3a6d/primary"
//             },
//             "meta": null
//         }
//     ],
//     "error": null,
//     "links": {
//         "self": "http://fedorov.xray.aps.anl.gov:8022/api/v1/search/3d811824-0747-44f9-b91d-05f7155f3a6d?page[offset]=0&page[limit]=100",
//         "first": "http://fedorov.xray.aps.anl.gov:8022/api/v1/search/3d811824-0747-44f9-b91d-05f7155f3a6d?page[offset]=0&page[limit]=100",
//         "last": "http://fedorov.xray.aps.anl.gov:8022/api/v1/search/3d811824-0747-44f9-b91d-05f7155f3a6d?page[offset]=0&page[limit]=100",
//         "next": null,
//         "prev": null
//     },
//     "meta": {
//         "count": 1
//     }
// }
