import Plot from 'react-plotly.js';
// import WebSocket from "ws";
import { useLatestRun } from "./latest_run.tsx";

export default function LivePlot({beamlineId}: {beamlineId: string}) {
    const [metadata] = useLatestRun(beamlineId);

    // const socketUrl = "ws://localhost:8000/api/v1/stream/single"
    // const {data, dataReadyState} = useLatestData(metadata.uid);
    
    // const { sendMessage, lastMessage, readyState } = useWebSocket(
    //     socketUrl,
    //     { queryParams: {api_key: "secret"} },
    // );
    // console.log(readyState);
    // console.log(lastMessage);
    const data = {
        x: [1, 2, 3, 4],
        y: [1, 4, 9, 16],
    };
    return (
        <div className="flex">
          <div className="flex-1 w=1/2" />
	  <Plot
            data={[
                {
      	            x: data.x,
      	            y: data.y,
      	            type: 'scatter',
      	            mode: 'lines+markers',
      	            marker: {color: 'red'},
                },
            ]}
            layout={ {margin: {l: 30, r: 10, b: 30, t: 10}, } }
      	    className="h-90"
          />

          {/* A table of metadata values next to the plot */}
          
          <div className="flex-4 w-1/2">
            <ul className="list bg-base-100 rounded-box shadow-md w-1/2">
              {/* <h1 className="">{ metadata.uid }</h1> */}
              <li className="list-row">
                <span className="font-bold" >UID:</span>
                <div>{ metadata["start.uid"] }</div>
              </li>
              <li className="list-row">
                <span className="font-bold" >Plan:</span>
                <div>{ metadata["start.plan_name"] }</div>
              </li>
              <li className="list-row">
                <span className="font-bold" >Start:</span>
                <div>{ metadata["start.time"].toString() }</div>
              </li>
            </ul>
          </div>
        </div>
    );
}
