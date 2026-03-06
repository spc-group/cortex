// ndarray-unpack.d.ts
// import type {NdArray} from "ndarray.d.ts";

declare module "ndarray-unpack" {
  // Using it as a type hint doesn't seem to count as using it
  import type { NdArray } from "ndarray.d.ts"; // eslint-disable-line

  type Unpacked = number | Unpacked;

  export default function unpack(NdArray): Unpacked[];
}
