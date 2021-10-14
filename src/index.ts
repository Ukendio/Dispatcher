import { Result, UnitType } from "@rbxts/rust-classes";
import { DispatcherBuilder } from "dispatcherBuilder";

interface Listener {
	fn: Callback;
	disconnected: boolean;
	connectTraceback: string;
	disconnectTraceback: string;
	next: Listener;
}

/** SOURCE: https://gist.github.com/stravant/b75a322e0919d60dde8a0316d1f09d2f
 * Function which acquires the currently idle handler runner thread, runs the
 * function fn on it, and then releases the thread, returning it to being the
 * currently idle one.
 * If there was a currently idle runner thread already, that's okay, that old
 * one will just get thrown and eventually garbage collected.
 */

let freeRunnerThread = undefined! as thread;

function acquireRunnerThreadAndCallEventHandler(fn: Callback, ...args: unknown[]) {
	const acquiredRunnerThread = freeRunnerThread;
	freeRunnerThread = undefined!;

	fn(...args);

	freeRunnerThread = acquiredRunnerThread;
}

function runEventHandlerInFreeThread(...args: [Callback, unknown]) {
	acquireRunnerThreadAndCallEventHandler(...args);

	for (;;) {
		acquireRunnerThreadAndCallEventHandler(coroutine.yield() as unknown as Callback);
	}
}

export interface Setup {
	listener: Listener;
	dispose: () => void;
}

export type BuildSetup = (fn: Callback) => Setup;

export default class Yessir {
	private currentListHead = undefined! as Listener;

	setup(fn: Callback): Setup {
		const listener = identity<Listener>({
			fn,
			disconnected: false,
			connectTraceback: debug.traceback(),
			disconnectTraceback: undefined!,
			next: this.currentListHead,
		});

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

		return identity<Setup>({
			listener,
			dispose,
		});
	}

	/**
	 * @hidden
	 * we declare this field so that promise can consume it in promise::fromEvent
	 */
	Connect(...args: Parameters<BuildSetup>) {
		return this.setup(...args);
	}

	dispatchPar(...args: unknown[]) {
		let listener = this.currentListHead;

		while (listener !== undefined) {
			if (!listener.disconnected) {
				if (!freeRunnerThread) {
					freeRunnerThread = coroutine.create(runEventHandlerInFreeThread);
				}
				task.spawn(freeRunnerThread, listener.fn, ...args);
			}
			listener = listener.next;
		}
	}
}

export { DispatcherBuilder };

export { interval } from "./interval";
