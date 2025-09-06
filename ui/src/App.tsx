import './App.css';
import { Link } from "react-router";

function App() {

    return (
	<div className="w-full mx-auto max-w-7xl pt-6">
          <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white text-center">Hello, Spectroscopist!</h1>
          <p className="mb-6 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">This is the internal website of the <span className="bold">Spectroscopy group</span> at the Advanced Photon Source</p>
          <div className="grid grid-cols-2 gap-8">
            <div className="card bg-base-100 shadow-sm m-2">
              {/* <figure> */}
              {/*   <img */}
              {/*     src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp" */}
              {/*     alt="Shoes" /> */}
              {/* </figure> */}
              <div className="card-body">
                <h2 className="card-title">Run Catalog</h2>
                <p>Browse the catalog of runs measured at the spectroscopy group beamlines.</p>
                <div className="card-actions">
                  <Link to="/catalog" className="btn btn-primary text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
</svg>
                    Browse
                  </Link>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm m-2">
              <div className="card-body">
                <h2 className="card-title">Beamline Status</h2>
                <p>See information about the status of each beamline, such as whether data are being collected.</p>
                <div className="card-actions">
                  <button className="btn disabled">Coming soon…</button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm m-2">
              <div className="card-body">
                <h2 className="card-title">Tiled UI</h2>
                <p>A browsable interface to the Tiled API. Useful for quick checks on your data.</p>
                <div className="card-actions">
                  <a href="/ui/browse" className="btn btn-outline"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
</svg>Browse</a>
                </div>
              </div>
            </div>
	    
        </div>
        </div>
    );
}

export default App
