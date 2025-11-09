import { ReadyState } from 'react-use-websocket';
import { type Run } from '../types.ts';

export const useLatestRun = (beamlineId: string): [Run, ReadyState] => {
    console.log(beamlineId);
    const run = {
        "start.uid": "as;ldkfj",
        "start.plan_name": "xafs_scan",
        "start.sample_name": "NiCoO2",
        "stop.exit_status": "success",
        "start.scan_name": "XANES",
        "start.time": new Date(),
        "start.proposal": "12345",
        "start.esaf": "56789",
        specs: [],
        structure_family: "container",
    };
    return [run, ReadyState.OPEN];
};
