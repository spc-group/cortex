import {
  CheckIcon,
  XMarkIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

export const ExitStatus = ({ status }: { status?: string }) => {
  switch (status) {
    case "success":
      return (
        <span className="text-success">
          <CheckIcon className="size-4 inline" /> Success
        </span>
      );
      break;
    case "abort":
      return (
        <span className="text-warning">
          <XMarkIcon className="size-4 inline" /> Aborted
        </span>
      );
      break;
    case "failure":
      return (
        <span className="text-error">
          <ExclamationCircleIcon className="size-4 inline" /> Failure
        </span>
      );
      break;
    case null:
    case undefined:
      return <span>Pending…</span>;
      break;
    default:
      return <span>{status}</span>;
      break;
  }
};

//  case "success":
//   statusElement = (<div className="badge badge-dash badge-success"><CheckIcon className="size-4 inline" />Success</div>);
// case "aborted":
//   statusElement = (<div className="badge badge-dash badge-success"><CheckIcon className="size-4 inline" />Success</div>);
