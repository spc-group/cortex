import { LivePlot } from "./liveplot";

export default function BeamlinePanels() {
  // console.log(ReadyState);
  // const socketUrl = "ws:localhost:8000/api/v1/stream/single/?envelope_format=msgpack";
  // const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  // if (lastMessage != null) {
  // 	decodeFromBlob(lastMessage.data).then(console.log);
  // }
  // const socketUrl2 = "ws://localhost:8000/api/v1/stream/single/x/?envelope_format=msgpack";
  // const { lastMessage: lastMessage2 } = useWebSocket(socketUrl2);
  // if (lastMessage2 != null) {
  // 	decodeFromBlob(lastMessage2.data).then(console.log);
  // }

  return (
    <div className="w-full mx-auto max-w-7xl pt-6">
      <div className="collapse bg-base-100 border border-base-300">
        <input type="radio" name="my-accordion-1" />
        <div className="collapse-title font-semibold">9-BM</div>
        <div className="collapse-content text-sm">Beamline info here!</div>
      </div>
      <div className="collapse bg-base-100 border border-base-300">
        <input type="radio" name="my-accordion-1" />
        <div className="collapse-title font-semibold">20-BM</div>
        <div className="collapse-content text-sm">Beamline info goes here</div>
      </div>
      <div className="collapse bg-base-100 border border-base-300">
        <input type="radio" name="my-accordion-1" defaultChecked />
        <div className="collapse-title font-semibold">25-ID μProbe</div>
        <div className="collapse-content text-sm">
          {/* <div class="stats shadow"> */}
          {/* 	<div class="stat"> */}
          {/* 	  <div class="stat-figure text-secondary"> */}
          {/* 	  </div> */}
          {/* 	  <div class="stat-title">Run Engine</div> */}
          {/* 	  <div class="stat-value"><div className="skeleton h-10 w-32"></div></div> */}
          {/* 	  <div class="stat-desc">Jan 1st - Feb 1st</div> */}
          {/* 	</div> */}

          {/* </div> */}

          <LivePlot beamlineId="25-ID-C" />
        </div>
      </div>

      <div className="collapse bg-base-100 border border-base-300">
        <input type="radio" name="my-accordion-1" />
        <div className="collapse-title font-semibold">25-ID Lerix</div>
        <div className="collapse-content text-sm">Beamline info goes here</div>
      </div>
    </div>
  );
}
