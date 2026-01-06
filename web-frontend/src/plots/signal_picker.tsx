// import { useState } from "react";
import type { ChangeEventHandler } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDataKeys } from "../tiled_api.ts";

const useDataKeys = (uid: string, stream: string) => {
    const loadDataKeys = async () => {
	return await getDataKeys(uid, stream);
    };
    const response = useQuery({
	queryKey: ["signal-picker-datakeys", uid, stream],
	queryFn: loadDataKeys,
    });
    return response;
};


export const SignalPicker = ({uid, stream, currentSignal, onSignalChange}: {uid: string, stream: string, currentSignal?: string, onSignalChange?: ChangeEventHandler}) => {
    const { data } = useDataKeys(uid, stream);
    let signals: string[];
    if (data === undefined) {
	signals = [];
    } else {
	signals = Object.keys(data);
    }

    return (
	<select defaultValue="Pick a signal" className="select" role="listbox" value={currentSignal} onChange={onSignalChange}>
	  { signals.map(function(signal) {
	      return <option key={signal}>{signal}</option>
	  })}
	</select>
    )
};
