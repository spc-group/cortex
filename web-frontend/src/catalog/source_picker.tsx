import { useState, useEffect, useRef, useCallback } from "react";
import { isEqual } from "lodash";

import type { Run, LineDatum, DataSource } from "./types";
import { Operation } from "./types";
import { signalSources } from "./signal";
import { useStreams } from "../tiled";
import { useLastChoice } from "../plots";

type Axis = "x" | "s" | "r";

const setsAreEqual = (a: Set<string>, b: Set<string>) => {
  return a.size === b.size && [...a].every((x) => b.has(x));
};

export const SignalPicker = ({
  signalNames,
  setSignal,
  localKey,
}: {
  signalNames: Set<string>;
  setSignal: (signal: string) => void;
  localKey: string;
}) => {
  const [activeSignal, setActiveSignal] = useLastChoice<string>(
    "",
    [...signalNames],
    `${localKey}-signal`,
  );
  useEffect(() => {
    // On first render we want to set the default signal
    // const setSignal = (signalName: string) => {
    const isValidSignal = signalNames.has(activeSignal);
    if (isValidSignal) {
      setSignal(activeSignal);
    } else if (activeSignal !== "") {
      console.warn(`Could not find signal ${activeSignal} in  `, signalNames);
    }
  }, [activeSignal, signalNames, setSignal]);

  const changeSignal = (sig: string) => {
    setActiveSignal(sig);
    // setSignal(sig);
  };

  return (
    <select
      className="select join-item"
      data-testid="select-signal"
      value={activeSignal}
      onChange={(e) => changeSignal(e.currentTarget.value)}
    >
      {[...signalNames].map((name) => {
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
  axis,
  setSource,
}: {
  run: Run;
  localKey: string;
  dimensions?: [string[], string][];
  useHints: boolean;
  axis: Axis;
  setSource: (axis: Axis, source: DataSource) => void;
}) => {
  const signalNames = useRef<Set<string>>(new Set());
  const { streams } = useStreams(run.uid);
  const streamNames = Object.keys(streams);
  const [activeStream, setActiveStream] = useLastChoice<string>(
    "",
    streamNames,
    `${localKey}-stream`,
  );
  const streamName =
    activeStream === "" ? (streamNames?.[0] ?? "") : activeStream;

  let newSources, newHints: Set<string>;
  const hints = useRef<Set<string>>(new Set());
  const sources = useRef<{ [key: string]: DataSource }>({});
  if (streamName === "") {
    newSources = {};
    newHints = new Set();
  } else {
    const stream = streams[streamName];
    // *dimensions* indicates we have scanning hints (e.g. x-axis),
    // *otherwise use stream hints
    if (dimensions == undefined) {
      newHints = new Set(
        Object.values(stream?.hints ?? {})
          .map((hint) => hint.fields)
          .flat(),
      );
    } else {
      newHints = new Set(
        dimensions
          .map(([newHints, stream_]) => {
            return stream_ === streamName.split("/").slice(-1)[0]
              ? newHints
              : [];
          })
          .flat(),
      );
    }
    newSources = signalSources(
      stream.data_keys,
      useHints ? [...newHints] : null,
      {},
      stream,
    );
  }
  // We only want to update these aggregates when they change to let
  // them be dependencies.
  if (JSON.stringify(sources.current) !== JSON.stringify(newSources)) {
    sources.current = newSources;
  }
  if (!setsAreEqual(hints.current, newHints)) {
    hints.current = newHints;
  }
  // Callback for getting the source when the signal changes
  const setSignal = useCallback(
    (signal: string) => {
      const source = sources.current[signal];
      setSource(axis, source);
    },
    [
      // streamName,
      // useHints,
      setSource,
      axis,
      // hints.current,
      // sources.current,
    ],
  );

  // We only want a new object if the things in it have actually changed
  const newSignalNames = new Set(Object.keys(sources.current));
  if (!setsAreEqual(signalNames.current, newSignalNames)) {
    signalNames.current = newSignalNames;
  }

  let signalWidget;
  if (streamName) {
    signalWidget = (
      <>
        <SignalPicker
          signalNames={signalNames.current}
          setSignal={setSignal}
          localKey={localKey}
        />
      </>
    );
  } else {
    signalWidget = <></>;
  }
  return (
    <>
      <select
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
  rowNum,
  setLineInfo,
}: {
  run: Run;
  label: string;
  rowNum: number;
  setLineInfo: (rowNum: number, datum: LineDatum) => void;
}) => {
  const ourInfo = useRef<LineDatum>({ name: "<N/A>" });
  const [hinted, setHinted] = useState<boolean>(true);
  const dimensions = run.metadata.start?.hints?.dimensions ?? [];
  // Curried function so we can take the stream and signal, and build
  // the line definition
  const setSource = useCallback(
    (axis: Axis, source: DataSource) => {
      ourInfo.current[axis] = source;
      // Pass a copy so ours doesn't get mutated
      setLineInfo(rowNum, { ...ourInfo.current });
    },
    [setLineInfo, rowNum],
  );
  const setOperation = (value: LineDatum["operation"] | "") => {
    ourInfo.current["operation"] = value !== "" ? value : null;
    // Pass a copy so ours doesn't get mutated
    setLineInfo(rowNum, { ...ourInfo.current });
  };
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
            axis={"x"}
            setSource={setSource}
          />
        </div>
      </td>
      <td>
        <div className="join">
          <SourcePicker
            run={run}
            localKey={label + "-sig"}
            useHints={hinted}
            axis={"s"}
            setSource={setSource}
          />
        </div>
      </td>
      <td>
        <div className="join">
          <select
            className="select join-item"
            data-testid="select-operation"
            onChange={(e) => {
              setOperation(e.currentTarget.value as LineDatum["operation"]);
            }}
          >
            <option></option>
            <option>{Operation.ADD}</option>
            <option>{Operation.SUBTRACT}</option>
            <option>{Operation.MULTIPLY}</option>
            <option>{Operation.DIVIDE}</option>
          </select>
          <SourcePicker
            run={run}
            localKey={label + "-ref"}
            useHints={hinted}
            axis={"r"}
            setSource={setSource}
          />
        </div>
      </td>
    </tr>
  );
};

export const SingleRunPicker = ({
  run,
  lineInfos,
  setLineInfos,
}: {
  run: Run;
  lineInfos: LineDatum[];
  setLineInfos: (data: LineDatum[]) => void;
}) => {
  const [numRows, setNumRows] = useState<number>(1);
  const addRow = () => {
    setNumRows((prev) => prev + 1);
  };
  const dropRow = () => {
    setNumRows((prev) => Math.max(prev - 1, 0));
  };
  const rowNumbers = [...Array(numRows).keys()];
  const setLineInfo = useCallback(
    (rowNum: number, info: LineDatum) => {
      const newInfos = [
        ...lineInfos.slice(0, rowNum),
        info,
        ...lineInfos.slice(rowNum + 1),
      ];
      // We need to only update on changes to avoid endless recursion
      const hasChanged = !isEqual(lineInfos, newInfos);
      if (hasChanged) {
        setLineInfos(newInfos);
      }
    },
    [lineInfos, setLineInfos],
  );

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
                rowNum={rowNum}
                setLineInfo={setLineInfo}
              />
            );
          })}
        </tbody>
      </table>
    </>
  );
};
