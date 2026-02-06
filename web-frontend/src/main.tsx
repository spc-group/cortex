import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { RunList, RunDetail } from "./catalog";
import Navbar from "./navbar.tsx";
import BeamlineStatus25ID from "./beamlines/status_25id.tsx";
import { BeamlineSummary } from "./beamlines/summary";
import { LivePlot } from "./beamlines/liveplot";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/app">
        <Navbar />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/catalog" element={<RunList />} />
          <Route path="/catalog/:uid" element={<RunDetail />} />
          {/* <Route path="/beamline/:beamlineId" element={<BeamlineStatus />} /> */}
          <Route path="/beamlines/:beamlineId" element={<BeamlineSummary />} />
          <Route path="/beamlines/:beamlineId/plots" element={<LivePlot />} />
          <Route
            path="/beamlines/25-ID-C/equipment"
            element={<BeamlineStatus25ID />}
          />
          <Route
            path="/beamlines/25-ID-D/equipment"
            element={<BeamlineStatus25ID />}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
