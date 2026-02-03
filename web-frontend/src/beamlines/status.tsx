import { OphydProvider } from "../ophyd/provider";
import { usePV } from "../ophyd/pv";

const envHost = import.meta.env.VITE_OPHYD_URI;
const ophydUri = envHost ?? "ws://127.0.0.1:8001";

const IonPumpChannel = ({ prefix }: { prefix: string }) => {
  const pumpNum = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
  }[prefix[prefix.length - 2]];
  const { value: name } = usePV(`${prefix}Pump${pumpNum}Name`);
  const { value: units } = usePV(`${prefix}getPressUnits`);
  return (
    <li className="list-row">
      <div className="w-40">
        <div className="font-bold">{name}</div>
        <div className="text-xs uppercase font-semibold opacity-40">
          Ion-pump
        </div>
      </div>
      <StatusItem pv={`${prefix}Pressure`} units={units} logarithm={true} />
      <StatusItem pv={`${prefix}Current`} logarithm={true} />
      <StatusItem pv={`${prefix}Voltage`} logarithm={false} />
    </li>
  );
};

const VacuumGauge = ({
  prefix,
  sublabel,
}: {
  prefix: string;
  sublabel?: string;
}) => {
  const { value: name } = usePV(`${prefix}.DESC`);
  const { value: units } = usePV(`${prefix}.EGU`);
  return (
    <li className="list-row">
      <div className="w-40">
        <div className="font-bold">{name}</div>
        <div className="text-xs uppercase font-semibold opacity-40">
          {sublabel ?? "Vacuum"}
        </div>
      </div>
      <StatusItem pv={`${prefix}.VAL`} units={units} logarithm={true} />
    </li>
  );
};

const Thermocouple = ({
  prefix,
  sublabel,
}: {
  prefix: string;
  sublabel?: string;
}) => {
  const { value: name } = usePV(`${prefix}.DESC`);
  const { value: rawUnits } = usePV(`${prefix}.EGU`);
  const units = ["F", "C"].includes(rawUnits ?? "") ? `°${rawUnits}` : rawUnits;
  return (
    <li className="list-row">
      <div className="w-40">
        <div className="font-bold">{name}</div>
        <div className="text-xs uppercase font-semibold opacity-40">
          {sublabel ?? "Thermocouple"}
        </div>
      </div>
      <StatusItem pv={`${prefix}.VAL`} units={units} logarithm={false} />
    </li>
  );
};

const CryoCooler = ({ prefix, label }: { prefix: string; label: string }) => {
  const { value: ready } = usePV(`${prefix}CC_READY`);
  return (
    <>
      <h2>
        {label}
        {ready === "On" ? (
          <div
            aria-label="success"
            className={`status status-success m-1`}
          ></div>
        ) : (
          <div className="inline-grid *:[grid-area:1/1]">
            <div
              aria-label="success"
              className={`status status-error m-1`}
            ></div>
            <div
              aria-label="success"
              className={`status status-error animate-ping m-1`}
            ></div>
          </div>
        )}
      </h2>
      <li className="list-row">
        <div className="w-40">
          <div className="font-bold">Temperature</div>
        </div>
        <StatusItem pv={`${prefix}PV_T5`} />
        <StatusItem pv={`${prefix}PV_T6`} />
        {/* Wish list */}
        {/* - 25idVac:LerixCC:CC_READY */}
        {/* - Heater vessel (HV) liquid level: 25idVac:LerixCC:PV_LT23 */}
        {/* - Sub-cooler level: 25idVac:LerixCC:PV_LT19 */}
        {/* - HV Pressure: 25idVac:LerixCC:PV_PT3 */}
        {/* - Closed loop pressure: 25idVac:LerixCC:PV_PT1 */}
      </li>
      <li className="list-row">
        <div className="w-40">
          <div className="font-bold">Heater Vessel Level</div>
        </div>
        <StatusItem pv={`${prefix}PV_LT23`} />
      </li>
      <li className="list-row">
        <div className="w-40">
          <div className="font-bold">Sub-cooler Level</div>
        </div>
        <StatusItem pv={`${prefix}PV_LT19`} />
      </li>
      <li className="list-row">
        <div className="w-40">
          <div className="font-bold">Heater Vessel Pressure</div>
        </div>
        <StatusItem pv={`${prefix}PV_PT3`} />
      </li>
      <li className="list-row">
        <div className="w-40">
          <div className="font-bold">Closed-loop Pressure</div>
        </div>
        <StatusItem pv={`${prefix}PV_PT1`} />
      </li>
    </>
  );
};

const StatusItem = ({
  pv,
  units,
  logarithm,
}: {
  pv: string;
  units?: string | null;
  logarithm?: boolean;
}) => {
  const { value, timestamp, precision, connected } = usePV(pv);
  const { value: pvUnits } = usePV(`${pv}.EGU`);

  // A badge to incidate the status of the connection, or whatever
  let status = (
    <div className="badge badge-sm badge-ghost opacity-25">Connected</div>
  );
  if (!connected) {
    status = (
      <div className="badge badge-sm badge-warning">PV Disconnected</div>
    );
  }
  // Decide what the actual value should look like
  let toDisplay;
  if (!connected) {
    toDisplay = <div className="skeleton h-5 w-28"></div>;
  } else if (logarithm) {
    const exponent = Math.log10(value ?? NaN).toFixed(precision);
    toDisplay = (
      <span>
        <span className="text-xs">10</span>
        <sup className="text-base">{exponent}</sup> {units ?? pvUnits}
      </span>
    );
  } else if (typeof value === "number") {
    toDisplay = (
      <span>
        {(value as number).toFixed(precision)}&thinsp;{units}
      </span>
    );
  } else {
    toDisplay = (
      <span>
        {value}&thinsp;{units}
      </span>
    );
  }

  return (
    <div className="tooltip">
      <div className="tooltip-content">
        <div>{pv}</div>
        <div>{timestamp?.toLocaleString() ?? "never"}</div>
      </div>
      <div>
        <div>{toDisplay}</div>
        <div className="text-xs uppercase font-semibold opacity-60">
          {status}
        </div>
      </div>
    </div>
  );
};

export default function BeamlineStatus() {
  return (
    <OphydProvider uri={ophydUri}>
      <div className="card w-160 bg-base-100 card-md shadow-md m-3">
        <div className="card-body">
          <h2 className="card-title">25-ID-A Vacuum</h2>
          <ul className="list bg-base-100">
            <IonPumpChannel prefix="25idVac:qpc02a:" />
            <IonPumpChannel prefix="25idVac:qpc02b:" />
            <IonPumpChannel prefix="25idVac:qpc02c:" />
            <IonPumpChannel prefix="25idVac:qpc02d:" />
            <IonPumpChannel prefix="25idVac:mpc02a:" />
            <IonPumpChannel prefix="25idVac:mpc02b:" />

            <VacuumGauge prefix="25idVac:VSA6" />
            <VacuumGauge prefix="25idVac:VSA7" />
          </ul>
        </div>
      </div>
      <div className="card w-160 bg-base-100 card-md shadow-md m-3">
        <div className="card-body">
          <h2 className="card-title">25-ID-B Vacuum</h2>
          <ul className="list bg-base-100">
            <IonPumpChannel prefix="25idVac:qpc03a:" />
            <IonPumpChannel prefix="25idVac:qpc03b:" />
            <IonPumpChannel prefix="25idVac:qpc03c:" />
            <IonPumpChannel prefix="25idVac:qpc03d:" />
            <IonPumpChannel prefix="25idVac:qpc04a:" />
            <IonPumpChannel prefix="25idVac:qpc04b:" />
            <IonPumpChannel prefix="25idVac:qpc04c:" />
            <IonPumpChannel prefix="25idVac:qpc04d:" />
            <VacuumGauge prefix="25idVac:VSB5" />
            <VacuumGauge prefix="25idVac:VSB7" />
          </ul>
        </div>
      </div>

      <div className="card w-120 bg-base-100 card-md shadow-md m-3">
        <div className="card-body">
          <h2 className="card-title">25-ID-B Cryo-Coolers</h2>
          <ul className="list bg-base-100">
            <CryoCooler prefix="25idVac:UprobeCC:" label="Microprobe" />
            <CryoCooler prefix="25idVac:LerixCC:" label="Lerix" />
          </ul>
        </div>
      </div>

      <div className="card w-130 bg-base-100 card-md shadow-md m-3">
        <div className="card-body">
          <h2 className="card-title">25-ID-C/D</h2>
          <ul className="list bg-base-100">
            <VacuumGauge prefix="25idVac:MX4:C1:Pressure" sublabel="25-ID-C" />
            <VacuumGauge prefix="25idVac:MX4:D1:Pressure" sublabel="25-ID-D" />
            <Thermocouple prefix="BL25ID-Metasys:TC:CHutchTempM" />
            <Thermocouple prefix="BL25ID-Metasys:TC:DHutchTempM" />
            {/* <Thermocouple prefix="BL25ID-Metasys:TC:EHutchTempM" /> */}
          </ul>
        </div>
      </div>
    </OphydProvider>
  );
}
// 25idVac:qpc03a:Pressure
