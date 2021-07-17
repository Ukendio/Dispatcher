import { ServerScriptService } from "@rbxts/services";
import TestEz from "@rbxts/testez";

const results = TestEz.TestBootstrap.run([ServerScriptService.tests]);
if (results.errors.size() > 0 || results.failureCount > 0) {
	xpcall();
}
