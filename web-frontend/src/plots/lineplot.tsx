import { SignalPicker } from "./signal_picker"

export const LinePlot = ({uid,}: {uid: string}) => {
    return (
	<>
          <div>
            <SignalPicker uid={uid} stream="primary"/>
          </div>
        </>
    );
};
