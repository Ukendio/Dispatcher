import { Result } from "@rbxts/rust-classes";
import { DispatcherBuilder } from "dispatcherBuilder";
import { noYield } from "./noYield";

interface Listener {
	handler: Callback;
	disconnected: boolean;
	connectTraceback: string;
	disconnectTraceback: string;
	next: Listener;
}

type Setup = (handler: Callback) => { listener: Listener; dispose: () => void };

const tracebackReporter = (message: unknown) => debug.traceback(tostring(message));

export default class Yessir {
	private currentListHead = undefined! as Listener;

	setup(handler: Callback) {
		const listener: Listener = {
			handler: handler,
			disconnected: false,
			connectTraceback: debug.traceback(),
			disconnectTraceback: undefined!,
			next: this.currentListHead,
		};

		const dispose = () => {
			if (listener.disconnected) {
				throw `Listener connected at: \n${listener.connectTraceback}\nwas already disconnected at listener.disconnectTraceback`;
			}

			listener.disconnected = true;
			listener.disconnectTraceback = debug.traceback();

			if (this.currentListHead === listener) {
				this.currentListHead = listener.next;
			} else {
				let previous = this.currentListHead;

				while (previous && previous.next !== listener) {
					previous = previous.next;
				}

				if (previous) {
					previous.next = listener.next;
				}
			}
		};

		this.currentListHead = listener;

		return {
			/**
			 * @hidden
			 * We don't want to expose the listener property
			 */
			listener: listener,
			dispose: dispose,
		};
	}

	/**
	 * @hidden
	 * we declare this field so that promise can consume it in promise::fromEvent
	 */
	Connect(...args: Parameters<Setup>) {
		return this.setup(...args);
	}

	fireUnsafe(...args: unknown[]) {
		let listener = this.currentListHead;

		while (listener !== undefined) {
			if (!listener.disconnected) {
				listener.handler(...args);
			}
			listener = listener.next;
		}
	}

	fireSafe(...args: unknown[]) {
		let listener = this.currentListHead;

		while (listener !== undefined) {
			if (!listener.disconnected) {
				const [ok, result] = xpcall(() => {
					noYield(listener.handler, ...args);
				}, tracebackReporter);

				if (!ok) return Result.err(result as string);
			}
			listener = listener.next;
		}

		return Result.ok({});
	}
}

export { DispatcherBuilder };

export { noYield } from "./noYield";

export { interval } from "./interval";
