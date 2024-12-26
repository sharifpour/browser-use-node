import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { $ } from "bun";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get all TypeScript files from examples directory
const examplesDir = path.join(__dirname, '../examples');
const outputDir = path.join(__dirname, '../dist');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all TypeScript files
const exampleFiles = fs.readdirSync(examplesDir)
  .filter(file => file.endsWith('.ts'));

// Compile each example file
for (const file of exampleFiles) {
  const inputPath = path.join(examplesDir, file);
  const outputFile = file.replace('.ts', '');

  console.log(`Building ${file}...`);

  try {
    await $`bun build --compile --outfile ${path.join(outputDir, outputFile)} ${inputPath}`;
    console.log(`Successfully built ${file}`);
  } catch (error) {
    console.error(`Error building ${file}:`, error);
    process.exit(1);
  }
}

console.log('All examples built successfully!');
