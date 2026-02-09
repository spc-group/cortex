import { useEffect } from "react";
import { useNavigate } from "react-router";

export const BeamlineSummary = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("plots");
  });
  return <></>;
};
