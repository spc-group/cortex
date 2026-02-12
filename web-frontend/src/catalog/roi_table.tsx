import {
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";

import type { ROI } from "./types";
import { COLORS } from "../plots/colors";

const colorCycle = [...Object.values(COLORS)];

export const RoiTable = ({
  rois,
  addRoi,
  updateRoi,
  removeRoi,
}: {
  rois: ROI[];
  addRoi: () => void;
  updateRoi: (index: number, update: object) => void;
  removeRoi: (index: number) => void;
}) => {
  const roundValue = (val: number | null) => {
    return val == null ? undefined : Math.round(val);
  };
  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th>Horizontal</th>
            <th>Vertical</th>
          </tr>
        </thead>
        <tbody>
          {rois.map((roi, index) => {
            return (
              <tr key={`roi-row-${index}`}>
                <td>
                  {index > 0 ? (
                    <button
                      className="btn btn-xs"
                      title={`Remove ROI ${index}`}
                      onClick={() => removeRoi(index)}
                    >
                      <TrashIcon className="size-4 inline" />
                    </button>
                  ) : (
                    <></>
                  )}
                </td>
                <td>
                  <label className="swap">
                    <input
                      type="checkbox"
                      checked={roi.isActive}
                      onChange={(e) =>
                        updateRoi(index, { isActive: e.currentTarget.checked })
                      }
                    />
                    <EyeIcon className="swap-on size-5 fill-current" />
                    <EyeSlashIcon className="swap-off size-5 fill-current opacity-30" />
                  </label>
                </td>
                <td>
                  <div
                    className="aspect-1/1 w-5 rounded-sm outline -outline-offset-1 outline-black/10 sm:rounded-md dark:outline-white/10"
                    style={{ backgroundColor: colorCycle[index] }}
                  />
                </td>
                <td>
                  {index > 0 ? (
                    <input
                      type="text"
                      className="input"
                      placeholder="ROI Name…"
                      value={roi.name}
                      onChange={(e) =>
                        updateRoi(index, { name: e.currentTarget.value })
                      }
                    />
                  ) : (
                    roi.name
                  )}
                </td>
                <td>
                  {index === 0 ? (
                    <span>&mdash;</span>
                  ) : (
                    <div className="join">
                      <input
                        type="number"
                        className="input join-item"
                        min={0}
                        value={roundValue(roi.x0)}
                        onChange={(e) =>
                          updateRoi(index, { x0: e.currentTarget.value })
                        }
                      />
                      <span className="btn btn-light btn-disabled join-item">
                        &mdash;
                      </span>
                      <input
                        type="number"
                        className="input join-item"
                        min={0}
                        value={roundValue(roi.x1)}
                        onChange={(e) =>
                          updateRoi(index, { x1: e.currentTarget.value })
                        }
                      />
                    </div>
                  )}
                </td>
                <td>
                  {index === 0 ? (
                    <span>&mdash;</span>
                  ) : (
                    <div className="join">
                      <input
                        type="number"
                        className="input join-item"
                        min={0}
                        value={roundValue(roi.y0)}
                        onChange={(e) =>
                          updateRoi(index, { y0: e.currentTarget.value })
                        }
                      />
                      <div className="btn btn-light btn-disabled join-item">
                        &mdash;
                      </div>
                      <input
                        type="number"
                        className="input join-item"
                        min={0}
                        value={roundValue(roi.y1)}
                        onChange={(e) =>
                          updateRoi(index, { y1: e.currentTarget.value })
                        }
                      />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="btn btn-xs" onClick={addRoi}>
        <PlusIcon className="size-4 inline" />
        Add ROI
      </button>
    </>
  );
};
