import Log from "@rbxts/log";
import SingleEvent from "./singleEvent";

export function interval(duration: number, callback: Callback) {
	const event = new SingleEvent((dispatch) => (_listener, _promise, isCancelled) => {
		let loop: Callback = async () => {
			return Promise.try(dispatch)
				.andThenCall(Promise.delay, duration)
				.then(() => {
					if (
						!isCancelled(() => {
							Log.Warn("[Event] Rejected");
							loop = undefined!;
						})
					) {
						return loop();
					}
				});
		};

		loop();
	});

	return {
		event: event,
		callback: callback,
	};
}
