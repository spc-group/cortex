import datetime as dt
import io
import json
import logging
import warnings
from collections.abc import Mapping
from pathlib import Path

import h5py
import numpy as np
from tiled.catalog.adapter import CatalogContainerAdapter
from tiled.utils import SerializationError, path_from_uri

log = logging.getLogger(__name__)


async def asdict(node):
    """Convert a catalog node to a dictionary."""
    return {key: val for key, val in await node.items_range(0, None)}


def nxgroup(parent: h5py.Group, name: str, nx_class: str = None) -> h5py.Group:
    group = parent.create_group(name)
    if nx_class is not None:
        group.attrs["NX_class"] = nx_class
    return group


def nxentry(parent: h5py.Group, name: str) -> h5py.Group:
    return nxgroup(parent=parent, name=name, nx_class="NXentry")


def nxdata(parent: h5py.Group, name: str) -> h5py.Group:
    return nxgroup(parent=parent, name=name, nx_class="NXdata")


def nxinstrument(parent: h5py.Group, name: str) -> h5py.Group:
    return nxgroup(parent=parent, name=name, nx_class="NXinstrument")


def nxnote(parent: h5py.Group, name: str) -> h5py.Group:
    return nxgroup(parent=parent, name=name, nx_class="NXnote")


def nxfield(parent: h5py.Group, name: str, value) -> h5py.Dataset:
    field = parent.create_dataset(name, data=value)
    return field


def nxlink(parent: h5py.Group, name: str, target: h5py.Group | str, soft=False):
    """Create a link between datasets within the same file."""
    if soft:
        target_name = target
        link = h5py.SoftLink(target_name)
    else:
        target_name = target.name
        link = target
    parent[name] = link
    # Add metadata attrs
    try:
        parent[name].attrs["target"] = target_name
    except KeyError:
        # Most likely this is a soft link to an open dataset, but in
        # case it's not…
        if not soft:
            raise


def nxexternallink(parent: h5py.Group, name: str, target: str, filepath: Path):
    """Create a link between a dataset in an external file."""
    other_file = str(filepath.resolve().expanduser())
    link = h5py.ExternalLink(other_file, target)
    try:
        parent[name] = link
    except TypeError:
        breakpoint()


async def write_run(
    nxfile: h5py.File,
    node: CatalogContainerAdapter,
    metadata: Mapping[str, Mapping | float | str | int],
):
    """Write a run to the HDF file as a nexus-compatiable entry.

    *node* should be the container for this run. E.g.

    """
    name = metadata["start"]["uid"]
    nxfile.attrs["default"] = name
    entry = nxentry(nxfile, name)
    # Create bluesky groups
    nxdata(entry, "data")
    instrument = nxinstrument(entry, "instrument")
    bluesky = nxnote(instrument, "bluesky")
    nxnote(bluesky, "streams")
    # Write stream data
    write_metadata(metadata, entry=entry)
    streams = (await asdict(node))["streams"]
    for stream_name, stream_node in await streams.items_range(0, None):
        await write_stream(
            name=stream_name,
            node=stream_node,
            entry=entry,
            metadata=stream_node.metadata(),
        )
    # Write attributes
    return entry


def to_hdf_type(value):
    """Some objects cannot be stored as HDF5 types.

    For example, a datetime should be converted to a string.

    Complex structures, like dictionaries, are converted to JSON.

    """
    type_conversions = [
        # (old => new)
        (dt.datetime, str),
        (dict, json.dumps),
        (list, json.dumps),
    ]
    new_types = [new for old, new in type_conversions if isinstance(value, old)]
    new_type = [*new_types, lambda x: x][0]
    return new_type(value)


def write_metadata(metadata: dict[str], entry: h5py.Group):
    """Write run-level metadata to the Nexus file."""
    bluesky_group = entry["instrument/bluesky"]
    md_group = nxnote(bluesky_group, "metadata")
    flattened = {
        f"{doc_name}.{key}": value
        for doc_name, doc in metadata.items()
        for key, value in doc.items()
    }
    items = [(key, value) for key, value in flattened.items() if value is not None]
    for key, value in items:
        value = to_hdf_type(value)
        nxfield(md_group, key, value)
    # Create additional convenient links
    if "start.sample_name" in md_group.keys():
        nxlink(parent=entry, name="sample_name", target=md_group["start.sample_name"])
    if "start.scan_name" in md_group.keys():
        nxlink(parent=entry, name="scan_name", target=md_group["start.scan_name"])
    if "start.plan_name" in md_group.keys():
        nxlink(parent=entry, name="plan_name", target=md_group["start.plan_name"])
        nxlink(
            parent=bluesky_group, name="plan_name", target=md_group["start.plan_name"]
        )
    if "start.uid" in md_group.keys():
        nxlink(parent=entry, name="entry_identifier", target=md_group["start.uid"])
        nxlink(parent=bluesky_group, name="uid", target=md_group["start.uid"])
    for phase in ["start", "stop"]:
        if f"{phase}.time" in flattened.keys():
            timestamp = dt.datetime.fromtimestamp(flattened[f"{phase}.time"])
            nxfield(
                parent=entry,
                name=f"{phase}_time",
                value=timestamp.astimezone().isoformat(),
            )
    if "start.time" in flattened.keys() and "stop.time" in flattened.keys():
        nxfield(
            parent=entry,
            name="duration",
            value=flattened["stop.time"] - flattened["start.time"],
        )


async def write_stream(
    name: str, node, entry: h5py.Group, metadata: Mapping[str, dict] = {}
) -> h5py.Group:
    """Write a stream to the HDF file as a nexus-compatiable entry.

    *node* should be the container for this stream. E.g.

    .. code-block:: python

        write_stream(name="primary", node=run["primary"])

    Parameters
    ==========
    name
      The name for the new HDF5 NXdata group.
    node
      The tiled container for this stream.
    entry
      The HDF5 group/file to add this stream's group to.
    metadata
      Descriptions of the individual datasets to create and hint.

    Returns
    =======
    grp
      The HDF5 group used to hold this stream's data.

    """
    stream_group = nxnote(entry["instrument/bluesky/streams"], name)
    # Make sure we have access to these data
    stream = await asdict(node)
    try:
        internal = await stream["internal"].read()
    except KeyError:
        # We don't have an internal dataset for some reason
        internal = None
    for col_name, desc in metadata["data_keys"].items():
        data_group = nxdata(stream_group, col_name)
        if "external" in desc:
            sources = stream[col_name].data_sources
            if len(sources) == 1 and "dataset" in sources[0].parameters:
                # Include a symlink to the original HDF5 file
                source = sources[0]
                dataset = source.parameters["dataset"]
                fpath = Path(path_from_uri(source.assets[0].data_uri))
                nxexternallink(
                    parent=data_group, name="value", target="/".join(dataset), filepath=fpath
                )
            else:
                # Copy the array itself into the new file
                #   This might be really slow…
                warnings.warn(
                    f"Could not link external dataset {col_name} in NeXus file. "
                    "Copying entire array"
                )
                arr = await stream[col_name].read()
                nxfield(data_group, "value", arr)
        else:
            # Save internal dataset
            try:
                nxfield(data_group, "value", internal[col_name].values)
            except KeyError:
                raise SerializationError(
                    f"Could not find internal dataset '{col_name}'"
                )
            if "units" in desc.keys():
                data_group["value"].attrs["units"] = desc["units"]
            data_group.attrs["signal"] = "value"
            try:
                times = internal[f"ts_{col_name}"].values
            except KeyError:
                log.error(
                    f"Could not find timestamps for internal dataset '{col_name}'"
                )
            else:
                nxfield(data_group, "EPOCH", times)
                # nxdata["EPOCH"] = NXfield(times)
                data_group["time"] = times - np.min(times)
                # nxdata["time"] = times - np.min(times)
                data_group["time"].attrs["units"] = "s"
                data_group.attrs["axes"] = "time"
    # Add links to the main NXdata group
    if name == "baseline":
        # We don't want to see baseline fields in the data NXdata group
        stream_hints = {}
    else:
        stream_hints = metadata.get("hints", {})
    root_nxdata = entry["data"]
    for device, hints in stream_hints.items():
        for field in hints.get("fields", []):
            # Make sure the field name is not already used in another stream
            link_name = field if field not in root_nxdata.keys() else f"field_{name}"
            # Write the link
            link_target = "/".join([stream_group.name, field, "value"])
            try:
                nxlink(root_nxdata, link_name, link_target, soft=True)
                # root_nxdata[link_name] = NXlinkfield(stream_group[field]["value"])
            except RuntimeError:
                raise SerializationError(
                    f"Could not link hinted '{name}' field: '{field}'"
                )
    return stream_group


async def serialize_nexus(mimetype, node, metadata, filter_for_access):
    """Encode everything below this node as HDF5.

    Assumes that *node* is a BlueskyRun.

    Follows the NeXuS XAS spectroscopy definition."

    """
    buff = io.BytesIO()
    root_node = node

    with h5py.File(buff, mode="w") as nxfile:
        # Write data entry to the nexus file
        tree = await write_run(nxfile=nxfile, node=node, metadata=metadata)
    return buff.getbuffer()
