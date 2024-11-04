// Convert to ES modules syntax
import { watchFile, writeFileSync, readFileSync } from "fs";

// Create a test file
writeFileSync("test.txt", "initial content");

// Watch for changes
console.log("Watching for file changes...");
watchFile("test.txt", (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log("File was modified");
    console.log("Current content:", readFileSync("test.txt", "utf8"));
  }
});
