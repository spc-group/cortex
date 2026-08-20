import { useState } from "react";

import type { Stream, Run, LineDatum } from "./types";
import { signalSources } from "./signal";
import { useStreams } from "../tiled";
import { useLastChoice } from "../plots";

export const SignalPicker = ({
  stream,
  hints,
  useHints,
}: {
  stream: Stream;
  hints: string[];
  useHints: boolean;
}) => {
  const sources = signalSources(
    stream.data_keys,
    useHints ? hints : null,
    {},
    stream,
  );

  return (
    <select
      className="select join-item"
      value="x-stage"
      onChange={(e) => {
        console.log(sources[e.target.value]);
      }}
    >
      {Object.keys(sources).map((name) => {
        return <option key={name}>{name}</option>;
      })}
    </select>
  );
};

// If *dimensions* is not provided, the stream's hints will be used
const SourcePicker = ({
  run,
  localKey,
  dimensions,
  useHints,
}: {
  run: Run;
  localKey: string;
  dimensions?: [string[], string][];
  useHints: boolean;
}) => {
  const { streams } = useStreams(run.uid);
  const streamNames = Object.keys(streams);
  const [activeStream, setActiveStream] = useLastChoice<string>(
    "",
    streamNames,
    localKey,
  );
  const streamName =
    activeStream === "" ? (streamNames?.[0] ?? "") : activeStream;

  let signalWidget;
  if (streamName) {
    const stream = streams[streamName];
    // *dimensions* indicates we have scanning hints (e.g. x-axis),
    // *otherwise use stream hints
    let hints;
    if (dimensions == undefined) {
      hints = Object.values(stream?.hints ?? {})
        .map((hint) => hint.fields)
        .flat();
    } else {
      hints = dimensions
        .map(([hints, stream_]) => {
          return stream_ === activeStream.split("/").slice(-1)[0] ? hints : [];
        })
        .flat();
    }
    signalWidget = (
      <>
        <SignalPicker stream={stream} useHints={useHints} hints={hints} />
      </>
    );
  } else {
    signalWidget = <></>;
  }
  return (
    <>
      <select
        data-testid={"select-" + localKey}
        className="select join-item"
        value={streamName}
        onChange={(e) => {
          setActiveStream(e.currentTarget.value);
        }}
      >
        {streamNames.map((streamName) => {
          return (
            <option value={streamName} key={streamName}>
              {streamName}/
            </option>
          );
        })}
      </select>
      {signalWidget}
    </>
  );
};

const SourceRow = ({
  run,
  label,
  setLine,
}: {
  run: Run;
  label: string;
  setLine: (datum: LineDatum) => void;
}) => {
  const [hinted, setHinted] = useState<boolean>(true);
  const dimensions = run.metadata.start?.hints?.dimensions ?? [];
  if (false) {
    // To-do: call this with actual signal picker info
    setLine({
      x: { path: "", dataKey: { dtype: "<f8", shape: [] }, name: "" },
      s: { path: "", dataKey: { dtype: "<f8", shape: [] }, name: "" },
      name: "signal",
    });
  }
  return (
    <tr>
      <td>{label}</td>
      <td>
        <input
          className="checkbox"
          type="checkbox"
          checked={hinted}
          onChange={(e) => {
            setHinted(e.currentTarget.checked);
          }}
        />
      </td>
      <td>
        <div className="join">
          <SourcePicker
            run={run}
            localKey={label + "-X"}
            dimensions={dimensions}
            useHints={hinted}
          />
        </div>
      </td>
      <td>
        <div className="join">
          <SourcePicker run={run} localKey={label + "-sig"} useHints={hinted} />
        </div>
      </td>
      <td>
        <div className="join">
          <select className="select join-item">
            <option></option>
            <option>+</option>
            <option>−</option>
            <option>×</option>
            <option>÷</option>
          </select>
          <SourcePicker run={run} localKey={label + "-ref"} useHints={hinted} />
        </div>
      </td>
    </tr>
  );
};

export const SingleRunPicker = ({
  run,
  setLineData,
}: {
  run: Run;
  setLineData: (nextState: LineDatum[]) => void;
}) => {
  const [numRows, setNumRows] = useState<number>(1);
  const addRow = () => {
    setNumRows((prev) => prev + 1);
  };
  const dropRow = () => {
    setNumRows((prev) => Math.max(prev - 1, 0));
  };
  const rowNumbers = [...Array(numRows).keys()];
  const setLine = (rowNum: number) => (datum: LineDatum) => {
    console.log(rowNum, datum);
  };
  if (false) {
    // To-do do this in `setLine()` above
    setLineData([]);
  }
  return (
    <>
      <div className="join">
        <button className="btn btn-sm join-item" onClick={dropRow}>
          −
        </button>
        <button className="btn btn-sm join-item" onClick={addRow}>
          +
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Hints?</th>
            <th>X</th>
            <th>Signal</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          {rowNumbers.map((rowNum) => {
            return (
              <SourceRow
                run={run}
                label={String(rowNum)}
                key={rowNum}
                setLine={setLine(rowNum)}
              />
            );
          })}
        </tbody>
      </table>
    </>
  );
};
