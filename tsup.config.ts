import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    // corpus-free entry for bundle-size-sensitive consumers: annotate(text)
    // and the tokenizer, without the embedded Qur'an text
    core: "src/core.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  esbuildOptions(options) {
    options.charset = "utf8"; // keep Arabic literals as UTF-8, not \u escapes
  },
});
