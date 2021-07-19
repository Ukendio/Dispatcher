import { Vec } from "@rbxts/rust-classes";

class Stage {
	public groups = Vec.vec<RunnableSystem>();

	setup(world: World) {
		this.groups.iter().forEach((system) => system.setup(world));
	}

	dispose(world: World) {
		this.groups.iter().forEach((system) => system.dispose(world));
	}

	execute(world: World) {
		this.groups.iter().forEach((system) => system.runNow(world));
	}
}

export class StageBuilder {
	public ids!: Array<Array<Vec<number>>>;
	public stages!: Vec<Stage>;

	insert<T extends RunnableSystem>(dependency: Vec<RunnableSystem>, id: number, system: T) {
		const stage = this.stages.len();
		const group = 0;

		this.ids[stage][group].push(id);
		this.stages.asPtr()[stage].groups.asPtr()[group];
	}
}
