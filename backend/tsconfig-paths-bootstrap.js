const tsConfig = require("./tsconfig.json");
require("tsconfig-paths").register({
  baseUrl: tsConfig.compilerOptions.outDir,
  paths: tsConfig.compilerOptions.paths,
});
