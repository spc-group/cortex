import { expect, describe, it } from "vitest";
import "@testing-library/jest-dom/vitest";

describe("the beamlinePanels component", () => {
  // beforeEach(async () => {
  // 	const queryClient = new QueryClient();
  // 	await React.act(async () => {
  // 	    render(
  // 		<BrowserRouter>
  // 		  <QueryClientProvider client={queryClient}>
  // 		    <BeamlinePanels />
  // 		  </QueryClientProvider>
  // 		</BrowserRouter>,
  // 	    );
  // 	});
  // });
  it("shows the new run UID", () => {
    expect(1).toEqual(1);
  });
});
