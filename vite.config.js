import { defineConfig } from "vite";

// base relatif: build bisa dibuka dari subpath mana pun (mis. GitHub Pages /nama-repo/)
export default defineConfig({
  base: "./",
});
