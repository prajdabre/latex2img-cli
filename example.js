const latexToImage = require('./index');
const path = require('path');

async function run() {
    const text = `
Hello! Here are some equations:

Einstein's famous equation: $E = mc^2$

The quadratic formula:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

And a more complex one:
$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

Hope you like it!
    `;

    const outputPath = path.join(__dirname, 'test_output.png');
    
    console.log('Rendering LaTeX to image...');
    try {
        await latexToImage(text, outputPath, {
            fontSize: 28,
            padding: 40,
            backgroundColor: '#ffffff'
        });
        console.log(`Successfully saved image to: ${outputPath}`);
    } catch (error) {
        console.error('Error rendering LaTeX:', error);
    }
}

run();
