import { Vec } from "@rbxts/rust-classes";
import { newDispatcher } from "dispatcher";
import { StageBuilder } from "stage";

export class DispatcherBuilder {
	private stagesBuilder = new StageBuilder();
	private currentId = 0;
	private map = new Map<string, RunnableSystem>();

	private nextId() {
		return this.currentId++;
	}

	add<T extends string, R extends string>(system: RunnableSystem, name: T, dependencyList: Array<R>) {
		const id = this.nextId();

		const entry = Vec.vec();
		const dependencies = Vec.vec<string>(...dependencyList)
			.iter()
			.map((x) => (this.map.get(x)! !== undefined ? this.map.get(x)! : error(`No such system registered(${x})`)))
			.collect();

		if (name.size() > 0) {
			if (entry.isEmpty()) {
				entry.insert(id, dependencies);
			}
		}

		return this;
	}

	build() {
		return newDispatcher();
	}
}
