import {
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { v4 as uuidv4 } from "uuid";

import type { ROI, ROIUpdate } from "../plots";
import { COLORS } from "../plots/colors";

const colorCycle = [...Object.values(COLORS)];

/**
 * A component that provides a way to directly modify
 * regions-of-interest for a single array. Each array should have its
 * own RoiTable.
 *
 * @param {ROI[]} rois - The ROI definitions state.
 * @param setRois - A callback to sets the ROIs for this array.
 */
export const RoiTable = ({
  rois,
  setRois,
}: {
  rois: ROI[];
  setRois: (newRois: ROI[]) => void;
}) => {
  const roundValue = (val: number | null) => {
    return val == null ? undefined : Math.round(val);
  };
  const addRoi = () => {
    const theseRois = [
      ...rois,
      {
        isActive: true,
        name: "",
        uid: uuidv4(),
        x0: 0,
        y0: 0,
        x1: 50,
        y1: 50,
      },
    ];
    setRois(theseRois);
  };
  const updateRoi = (index: number, update: ROIUpdate) => {
    setRois([
      ...rois.slice(0, index),
      {
        ...rois[index],
        ...update,
      },
      ...rois.slice(index + 1),
    ]);
  };

  const removeRoi = (index: number) => {
    const newRois = [...rois.slice(0, index), ...rois.slice(index + 1)];
    setRois(newRois);
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
                  <button
                    className="btn btn-xs"
                    title={`Remove ROI ${index}`}
                    onClick={() => removeRoi(index)}
                  >
                    <TrashIcon className="size-4 inline" />
                  </button>
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
                  <input
                    type="text"
                    className="input"
                    placeholder="ROI Name…"
                    value={roi.name}
                    onChange={(e) =>
                      updateRoi(index, { name: e.currentTarget.value })
                    }
                  />
                </td>
                <td>
                  <div className="join">
                    <input
                      type="number"
                      className="input join-item"
                      min={0}
                      value={roundValue(roi.x0)}
                      onChange={(e) =>
                        updateRoi(index, { x0: Number(e.currentTarget.value) })
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
                        updateRoi(index, { x1: Number(e.currentTarget.value) })
                      }
                    />
                  </div>
                </td>
                <td>
                  <div className="join">
                    <input
                      type="number"
                      className="input join-item"
                      min={0}
                      value={roundValue(roi.y0)}
                      onChange={(e) =>
                        updateRoi(index, { y0: Number(e.currentTarget.value) })
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
                        updateRoi(index, { y1: Number(e.currentTarget.value) })
                      }
                    />
                  </div>
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
