import axios from "axios";

let envHost = import.meta.env.VITE_TILED_URI ;
export const tiledHost = envHost === undefined ? "" : envHost;
export const tiledUri = tiledHost + "/v1/";

export const v1Client = axios.create({
    baseURL: tiledUri,
});



// Retrieve the info about API accepted formats, etc.
export const getApiInfo = async ({client=v1Client}) => {
    const response = await client.get("");
    return response.data;
};


export const getMetadata = async ({path, client=v1Client}) => {
    const response = await client.get(`metadata/${encodeURIComponent(path)}`, {
	params: {
	}
    });
    console.log(response);
    return response.data;
};


// Retrieve set of runs metadata from the API
export const getRuns = async ({pageOffset, pageLimit, filters = new Map(), client = v1Client, sortField= null, catalog = "scans", searchText = "", standardsOnly = false}) => {
    // Set up query parameters
    const params = new URLSearchParams();
    if (sortField !== null) {
	params.append("sort", sortField);
    }
    params.append("fields", "metadata");
    params.append("page[offset]", pageOffset);
    params.append("page[limit]", pageLimit);
    let value;
    for (let [field, value] of filters) {
	params.append("filter[contains][condition][key]", field);
	params.append("filter[contains][condition][value]", `"${value}"`);
    }
    if (standardsOnly) {
	params.append("filter[eq][condition][key]", "start.is_standard");
	params.append("filter[eq][condition][value]", true);
    }
    if (searchText !== "") {
	
	params.append("filter[fulltext][condition][text]", searchText);
    }
    // retrieve list of runs from the API
    const response = await client.get(`search/${catalog}`, {
	params: params,
    });
    // Parse into a sensible list defintion
    const runs = response.data.data.map((run) => {
	const start_doc = run.attributes.metadata.start;
	const stop_doc = (run.attributes.metadata.stop ?? {});
	const date = new Date(start_doc.time * 1000);
	const specs = run.attributes.specs;
	return {
	    "start.uid": run.id,
	    "start.plan_name": start_doc.plan_name,
	    "start.scan_name": start_doc.scan_name ?? null,
	    "start.sample_name": start_doc.sample_name ?? null,
	    "stop.exit_status": stop_doc.exit_status ?? null,
	    "start.time": date.toLocaleString(),
	    "start.proposal": start_doc.proposal ?? null,
	    "start.esaf": start_doc.esaf ?? null,
	    "specs": specs === null ? [] : specs,
	    "structure_family": run.attributes.structure_family,
	};
    });
    return await {
	runs: runs,
	count: response.data.meta.count,
    };
};
