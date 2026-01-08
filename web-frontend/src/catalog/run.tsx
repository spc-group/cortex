import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { NavLink, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { LinePlot } from "../plots/lineplot";
import { SignalPicker } from "../plots/signal_picker";
import { getTableData } from "../tiled_api";
import { getMetadata } from "../tiled_api";
import { prepareYData } from "./prepare_data";
import { RunPlots } from "./run_plots";

export function Run() {
    const { uid, plotStyle } = useParams();

    return (
	<RunPlots uid={uid} plotStyle={plotStyle} />
    );
}
