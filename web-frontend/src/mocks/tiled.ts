import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const apiInfoJson = {
  id: "abc-123",
  firstName: "John",
  lastName: "Maverick",
};

export const searchJson = {
  data: [
    {
      attributes: {
        metadata: {
          start: {
            time: 0,
          },
          stop: {
            exit_status: "success",
          },
        },
      },
    },
  ],
  meta: {
    count: 0,
  },
};

export const handlers = [
  http.get("/api/v1/search/", () => {
    return HttpResponse.json(searchJson);
  }),
  http.get("/api/v1", () => {
    return HttpResponse.json(apiInfoJson);
  }),
];

export const server = setupServer(...handlers);
