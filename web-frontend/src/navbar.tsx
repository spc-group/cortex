import { NavLink } from "react-router";

import logoUrl from "./spc-logo.svg";

const classNames = ({ isActive }: { isActive: boolean }) =>
  isActive ? "btn rounded-field" : "btn btn-ghost rounded-field";

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="">
        <a className="btn btn-ghost text-xl" href="/">
          <img
            alt="Spectroscopy group logo"
            src={logoUrl}
            className="h-8 w-auto"
            /* Make the logo look different so we can tell if we're in the dev server */
            style={
              import.meta.env.MODE == "development"
                ? { filter: "invert(1)" }
                : {}
            }
          />
          Cortex
        </a>
      </div>
      <div className="grow justify-end px-2">
        <div className="items-stretch">
          <NavLink to="/catalog" className={classNames}>
            Catalog
          </NavLink>
          <NavLink to="/beamlines/25-ID-C" className={classNames}>
            25-ID-C
          </NavLink>
          <NavLink to="/beamlines/25-ID-D" className={classNames}>
            25-ID-D
          </NavLink>
        </div>
      </div>
    </div>
  );
}
