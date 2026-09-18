import Plotly from "plotly.js-dist";
import createPlotlyComponent from "react-plotly.js/factory";

// The default import has a bug when importing, so this is a
// workaround
//
// See: https://github.com/plotly/react-plotly.js/issues/143
export default createPlotlyComponent(Plotly);
