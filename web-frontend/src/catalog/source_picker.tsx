import { useState, useEffect, useRef, useCallback } from "react";
import { isEqual } from "lodash";

import type { Run, LineInfo, DataSource } from "./types";
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
  setSignal: (signal: string | null) => void;
  localKey: string;
}) => {
  const firstSignal = [...signalNames]?.[0] ?? "";
  const [savedSignal, setSavedSignal] = useLastChoice<string>(
    firstSignal,
    [...signalNames],
    `${localKey}-signal`,
  );
  const activeSignal = savedSignal ? savedSignal : firstSignal;
  const parentKey = localKey.split("-").slice(0, -1).join("-");
  useEffect(() => {
    // On first render we want to set the default signal
    let newSignal: string;
    if (activeSignal) {
      newSignal = activeSignal;
    } else if (firstSignal) {
      // We don't have a valid last choice, so just use the first
      // signal for now
      newSignal = firstSignal;
    } else {
      return;
    }
    const isValidSignal = signalNames.has(newSignal);
    if (isValidSignal) {
      setSignal(newSignal);
    } else if (firstSignal) {
      setSignal(firstSignal);
    } else {
      setSignal(null);
    }
  }, [activeSignal, signalNames, setSignal, firstSignal]);

  const changeSignal = (sig: string) => {
    setSavedSignal(sig);
  };

  return (
    <select
      className="select join-item"
      data-testid="select-signal"
      value={activeSignal}
      onChange={(e) => changeSignal(e.currentTarget.value)}
    >
      {[...signalNames].map((name, idx) => {
        return <option key={`${parentKey}-signal${idx}`}>{name}</option>;
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
  setSource: (axis: Axis, source: DataSource | null) => void;
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
    (signal: string | null) => {
      const source = signal != null ? sources.current[signal] : null;
      setSource(axis, source);
    },
    [setSource, axis],
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
          localKey={`${localKey}-${streamName}`}
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
        {streamNames.map((streamName, idx) => {
          return (
            <option value={streamName} key={`${localKey}-stream${idx}`}>
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
  hinted,
  setLineInfo,
}: {
  run: Run;
  label: string;
  rowNum: number;
  hinted: boolean;
  setLineInfo: (rowNum: number, datum: LineInfo) => void;
}) => {
  const ourInfo = useRef<LineInfo>({ name: "<N/A>" });
  const dimensions = run.metadata.start?.hints?.dimensions ?? [];
  // Curried function so we can take the stream and signal, and build
  // the line definition
  const setSource = useCallback(
    (axis: Axis, source: DataSource | null) => {
      if (source == null) {
        delete ourInfo.current[axis];
      } else {
        ourInfo.current[axis] = source;
      }
      // Pass a copy so ours doesn't get mutated
      setLineInfo(rowNum, { ...ourInfo.current });
    },
    [setLineInfo, rowNum],
  );
  const setOperation = (value: string) => {
    type OperationKey = keyof typeof Operation;
    ourInfo.current["operation"] = Operation?.[value as OperationKey] ?? null;
    // Pass a copy so ours doesn't get mutated
    setLineInfo(rowNum, { ...ourInfo.current });
  };
  return (
    <tr>
      <td>{label}</td>
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
              setOperation(e.currentTarget.value);
            }}
          >
            <option></option>
            {Object.entries(Operation).map(([key, val]) => {
              return (
                <option value={key} key={`${label}-operation-${key}`}>
                  {val}
                </option>
              );
            })}
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
  lineInfos: LineInfo[];
  setLineInfos: (data: LineInfo[]) => void;
}) => {
  const [hinted, setHinted] = useState<boolean>(true);
  const [numRows, setNumRows] = useState<number>(1);
  const addRow = () => {
    setNumRows((prev) => prev + 1);
  };
  const dropRow = () => {
    setNumRows((prev) => Math.max(prev - 1, 0));
  };
  const rowNumbers = [...Array(numRows).keys()];
  const setLineInfo = useCallback(
    (rowNum: number, info: LineInfo) => {
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
      <div>
        <div className="join">
          <button className="btn btn-sm join-item" onClick={dropRow}>
            −
          </button>
          <button className="btn btn-sm join-item" onClick={addRow}>
            +
          </button>
        </div>
        <label htmlFor="hintedCheckbox">Hinted Only</label>
        <input
          className="checkbox"
          id="hintedCheckbox"
          type="checkbox"
          checked={hinted}
          onChange={(e) => {
            setHinted(e.currentTarget.checked);
          }}
        />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Horizontal</th>
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
                hinted={hinted}
                setLineInfo={setLineInfo}
              />
            );
          })}
        </tbody>
      </table>
    </>
  );
};
