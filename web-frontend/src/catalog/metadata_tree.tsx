import { useState } from "react";
import type { ReactNode } from "react";
import type { RunMetadata } from "./types";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

export type MDMapping = {
  [key: string]: MDMapping | unknown;
};

/**
 * The heading for a nested metadata object.
 *
 * Wraps its children in a collapsible heading.
 */
const Twisty = ({ name, children }: { name: string; children: ReactNode }) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  return (
    <div className="collapse" key={name}>
      <input
        type="checkbox"
        checked={isOpen}
        className="!pb-1"
        onChange={(e) => setOpen(e.currentTarget.checked)}
      />
      <div className="collapse-title p-0 text-sm">
        <ChevronRightIcon
          className={"size-4 inline mr-1" + (isOpen ? " rotate-90" : "")}
        />
        {name}&hellip;
      </div>
      <div className="collapse-content text-sm m-0 pl-5 !pb-0">{children}</div>
    </div>
  );
};

/**
 * One branch of the metadata tree.
 *
 * Could be a single key-value pair, or a nest object that becomes its
 * own branch
 */
const Branch = (props: { md: MDMapping; parentPath: string }) => {
  const { md, parentPath } = props;
  return (
    <>
      {Object.entries(md)
        // Sort in alphabetical order
        .toSorted(([nameA], [nameB]) => {
          return nameA.toLowerCase() > nameB.toLowerCase() ? 1 : -1;
        })
        // Turn into tree widgets
        .map(([name, value]) => {
          const path = `${parentPath}.${name}`;
          const isTreeNode =
            typeof value === "object" && value != null && !Array.isArray(value);
          if (isTreeNode) {
            return (
              <Twisty name={name} key={path}>
                <Branch md={value as MDMapping} parentPath={path} />
              </Twisty>
            );
          } else {
            return (
              <div className="pl-5 group" key={path}>
                <span>{name}:</span>
                <pre className="inline mx-1">{JSON.stringify(value)}</pre>
              </div>
            );
          }
        })}
    </>
  );
};

/**
 * A tree of nested metadata. Rendered as expandable sub trees.
 */
export const MetadataTree = ({ runMetadata }: { runMetadata: RunMetadata }) => {
  return (
    <div className="collapse bg-base-100 border border-base-300">
      <input type="checkbox" />
      <div className="collapse-title font-semibold">Run Metadata</div>
      <div className="collapse-content">
        <Branch md={runMetadata} parentPath="run_md" />
      </div>
    </div>
  );
};
