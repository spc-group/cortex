import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { RunList, Run } from "./catalog";
import Navbar from "./navbar.tsx";
import BeamlinePanels from "./beamlines/panels.tsx";
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
          <Route path="/catalog/:uid/:plotStyle?" element={<Run />} />
          <Route path="/beamlines" element={<BeamlinePanels />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
