import { Option, OptionMut } from "@rbxts/rust-classes";

class SingleEvent {
	private listener = OptionMut.none<Callback>();
	private promise = Option.none<Promise<unknown>>();

	constructor(
		executor: (
			dispatch: Callback,
		) => (
			resolve: (value: unknown) => void,
			reject: (reason?: unknown) => void,
			onCancel: (abortHandler: () => void) => boolean,
		) => void,
	) {
		const dispatch = () => {
			coroutine.wrap(this.listener.expect("Unexpected Error"));
		};
		this.promise = Option.some(
			Promise.defer((resolve) => {
				resolve(new Promise(executor(dispatch)).then(() => (this.listener = OptionMut.none())));
			}),
		);
	}

	connect(handler: Callback) {
		assert(this.promise.expect("Unexpected Error").getStatus() === "Started", "Dispatcher has already started");
		this.listener.replace(this.listener.okOrElse(() => handler).expectErr("Dispatcher is already used up"));

		const disconnect = () => {
			this.promise.expect("Unexpected Error").cancel();
			this.listener = OptionMut.none();
		};

		return {
			disconnect: disconnect,
		};
	}
}

export = SingleEvent;
