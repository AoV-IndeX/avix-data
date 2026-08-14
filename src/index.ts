import { CompileError, runCompiler } from "./compile/compiler.js";

runCompiler().catch((error: unknown) => {
  if (error instanceof CompileError) {
    console.error(`\n❌ ${error.message}`);
    console.error(JSON.stringify(error.details, null, 2));
  } else {
    console.error("\n❌ Unexpected compiler error:", error);
  }

  process.exitCode = 1;
});
