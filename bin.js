#!/usr/bin/env node

const { program } = require('commander');
const latexToImage = require('./index');
const path = require('path');
const fs = require('fs');

program
  .version('1.0.0')
  .description('Convert text with LaTeX to an image')
  .argument('<input>', 'Input text or path to a text file')
  .option('-o, --output <path>', 'Output image path', 'output.png')
  .option('-s, --font-size <number>', 'Font size', parseInt, 24)
  .option('-p, --padding <number>', 'Padding', parseInt, 20)
  .option('-w, --width <number>', 'Fixed width in pixels', parseInt)
  .option('-b, --background <color>', 'Background color')
  .option('-t, --theme <string>', 'Theme (modern, handwritten, chalkboard)', 'modern')
  .option('-g, --grounded [level]', 'Export bounding boxes to JSON (char, equation)')
  .option('-d, --debug [level]', 'Draw bounding boxes for debugging (char, equation)')
  .action(async (input, options) => {
    let text = input;
    if (fs.existsSync(input)) {
        text = fs.readFileSync(input, 'utf-8');
    }

    const outputPath = path.resolve(process.cwd(), options.output);
    
    console.log(`Rendering to ${outputPath}...`);
    try {
        await latexToImage(text, outputPath, {
            fontSize: options.fontSize,
            padding: options.padding,
            backgroundColor: options.background,
            width: options.width,
            theme: options.theme,
            grounded: options.grounded,
            debug: options.debug
        });
        console.log('Done!');
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
  });

program.parse(process.argv);
