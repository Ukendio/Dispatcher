declare interface World {}

declare abstract class RunnableSystem {
	run(world: World): void;

	setup(world: World): void;

	dispose(world: World): void;

	runNow(world: World): void;
}
