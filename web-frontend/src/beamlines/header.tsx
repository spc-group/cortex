import { NavLink } from "react-router";

export const BeamlineHeader = ({ title }: { title: string }) => {
  const toClassName = ({ isActive }: {isActive: boolean}) => (isActive ? "tab tab-active" : "tab");
  return (
    <>
      <h1 className="m-4 text-2xl font-bold tracking-tight text-heading">
        {title}
      </h1>
      <div role="tablist" className="tabs tabs-border">
        <NavLink
          to="../plots"
          relative="path"
          role="tab"
          className={toClassName}
        >
          Plots
        </NavLink>
        {/* <NavLink to="../queue" relative="path" role="tab" className={toClassName}>Queue</NavLink> */}
        <NavLink
          to="../equipment"
          relative="path"
          role="tab"
          className={toClassName}
        >
          Equipment Status
        </NavLink>
      </div>
    </>
  );
};
