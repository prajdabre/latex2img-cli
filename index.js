const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Converts text containing LaTeX to an image.
 * @param {string} text - The text to render (can contain $...$ or $$...$$).
 * @param {string} outputPath - Path to save the output image (e.g., 'output.png').
 * @param {object} options - Options for rendering.
 * @param {number} options.padding - Padding around the content (default: 20).
 * @param {number} options.fontSize - Font size in pixels (default: 24).
 * @param {string} options.backgroundColor - Background color (default: 'white').
 * @param {number} options.width - Optional fixed width in pixels.
 */
async function latexToImage(text, outputPath, options = {}) {
    const {
        padding = 20,
        fontSize = 24,
        backgroundColor = 'white',
        width: fixedWidth
    } = options;

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    });

    try {
        const page = await browser.newPage();

        // HTML template with KaTeX and Google Fonts for robustness
        const html = `
<!DOCTYPE html>
<html>
<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background-color: ${backgroundColor === 'transparent' ? 'transparent' : backgroundColor};
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
        }
        #container {
            display: ${fixedWidth ? 'block' : 'inline-block'};
            width: ${fixedWidth ? fixedWidth + 'px' : 'auto'};
            padding: ${padding}px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: ${fontSize}px;
            line-height: 1.6;
            color: #1a1a1a;
            box-sizing: border-box;
        }
        #content { 
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="content"></div>
    </div>
    <script>
        const text = ${JSON.stringify(text)};
        document.getElementById('content').textContent = text;
        
        window.renderMath = async () => {
            renderMathInElement(document.getElementById('content'), {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\\\(', right: '\\\\)', display: false},
                    {left: '\\\\[', right: '\\\\]', display: true}
                ],
                throwOnError : false
            });
            // Wait for fonts to be ready
            await document.fonts.ready;
            // Additional wait for KaTeX to finish any internal processing
            return true;
        };
    </script>
</body>
</html>`;

        await page.setContent(html);

        // Wait for KaTeX scripts and fonts
        await page.waitForFunction(() => typeof renderMathInElement !== 'undefined');
        await page.evaluate(() => window.renderMath());
        
        // Wait an extra bit for layout to settle
        await new Promise(r => setTimeout(r, 100));

        // Select the container element
        const element = await page.$('#container');
        const boundingBox = await element.boundingBox();
        
        if (!boundingBox) {
            throw new Error('Could not calculate bounding box of content');
        }

        await page.setViewport({
            width: Math.ceil(boundingBox.width) || 800,
            height: Math.ceil(boundingBox.height) || 600,
            deviceScaleFactor: 2
        });

        await element.screenshot({
            path: outputPath,
            omitBackground: backgroundColor === 'transparent'
        });

    } finally {
        await browser.close();
    }
}

module.exports = latexToImage;
