import "./App.css";
import { Link } from "react-router";
import { RadioIcon, PresentationChartLineIcon, TableCellsIcon } from '@heroicons/react/24/outline'

function App() {
  return (
    <div className="w-full mx-auto max-w-7xl pt-6">
      <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white text-center">
        Hello, Spectroscopist!
      </h1>
      <p className="mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">
        This is the internal website of the{" "}
        <span className="bold">Spectroscopy group</span> at the Advanced Photon
        Source
      </p>
      <div className="grid grid-cols-2 gap-8">
        <div className="card bg-base-100 shadow-sm m-2">
          <div className="card-body">
            <h2 className="card-title">Run Catalog</h2>
            <p>
              Browse the catalog of runs measured at the spectroscopy group
              beamlines.
            </p>
            <div className="card-actions">
              <Link to="/catalog" className="btn btn-primary text-white">
		<PresentationChartLineIcon className="size-6 text-white" />
                Browse
              </Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm m-2">
          <div className="card-body">
            <h2 className="card-title">Beamline Status</h2>
            <p>
              See information about the status of each beamline, such as whether
              data are being collected.
            </p>
            <div className="card-actions">
	      <Link to="/beamlines" className="btn btn-primary text-white">
		<RadioIcon className="size-6 text-white"/>
		Beamlines
	      </Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm m-2">
          <div className="card-body">
            <h2 className="card-title">Tiled UI</h2>
            <p>
              A browsable interface to the Tiled API. Useful for quick checks on
              your data.
            </p>
            <div className="card-actions">
              <a href="/ui/browse" className="btn btn-outline">
		<TableCellsIcon className="size-6 text-white" />
                Browse
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
