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
 * @param {string} options.theme - Theme: 'modern', 'handwritten', or 'chalkboard' (default: 'modern').
 */
async function latexToImage(text, outputPath, options = {}) {
    const {
        padding = 20,
        fontSize = 24,
        backgroundColor: userBgColor,
        width: fixedWidth,
        theme = 'modern'
    } = options;

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    });

    // Theme configurations
    const themes = {
        modern: {
            bg: userBgColor || 'white',
            color: '#1a1a1a',
            font: "'Inter', sans-serif",
            googleFont: "Inter:wght@400;500;600"
        },
        handwritten: {
            bg: userBgColor || '#fffdf5', // Creamy paper look
            color: '#1a2a4a', // Ink blue
            font: "'Architects Daughter', cursive",
            googleFont: "Architects+Daughter"
        },
        chalkboard: {
            bg: userBgColor || '#2c3e50', // Slate blue/dark
            color: '#ffffff', // Chalk white
            font: "'Patrick Hand', cursive",
            googleFont: "Patrick+Hand"
        }
    };

    const activeTheme = themes[theme] || themes.modern;
    const backgroundColor = activeTheme.bg;

    try {
        const page = await browser.newPage();

        // Initial large viewport
        await page.setViewport({
            width: fixedWidth || 2400,
            height: 1200,
            deviceScaleFactor: 2
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${activeTheme.googleFont}&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background-color: ${backgroundColor === 'transparent' ? 'transparent' : backgroundColor};
            -webkit-font-smoothing: antialiased;
            display: inline-block;
        }
        #container {
            display: inline-block;
            min-width: ${fixedWidth ? fixedWidth + 'px' : 'auto'};
            padding: ${padding}px;
            font-family: ${activeTheme.font};
            font-size: ${fontSize}px;
            line-height: 1.6;
            color: ${activeTheme.color};
            box-sizing: border-box;
            overflow: visible;
            ${theme === 'handwritten' ? 'transform: rotate(-0.2deg);' : ''}
            ${theme === 'chalkboard' ? 'text-shadow: 1px 1px 2px rgba(255,255,255,0.2);' : ''}
        }
        #content { 
            white-space: pre-wrap;
            word-wrap: break-word;
            filter: ${theme === 'handwritten' ? 'opacity(0.9) contrast(1.1) brightness(0.95)' : 'none'};
        }
        .katex-display { margin: 0.5em 0; overflow-x: visible; overflow-y: hidden; }
        /* Soften the math to match handwriting theme */
        ${theme === 'handwritten' ? '.katex { font-weight: 500; }' : ''}
        ${theme === 'chalkboard' ? '.katex { opacity: 0.95; }' : ''}
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
                    {left: '\\\\[', right: '\\\\\]', display: true}
                ],
                throwOnError : false
            });
            await document.fonts.ready;
            
            // Wait a tiny bit for KaTeX to finish layout
            await new Promise(r => setTimeout(r, 50));

            const container = document.getElementById('container');
            
            // Expand viewport to measure full content
            const allElements = container.querySelectorAll('*');
            let maxRight = 0;
            let maxBottom = 0;
            
            allElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.right > maxRight) maxRight = rect.right;
                if (rect.bottom > maxBottom) maxBottom = rect.bottom;
            });
            
            // Fallback to container dimensions if no children found
            const containerRect = container.getBoundingClientRect();
            maxRight = Math.max(maxRight, containerRect.right);
            maxBottom = Math.max(maxBottom, containerRect.bottom);

            return {
                width: maxRight,
                height: maxBottom
            };
        };
    </script>
</body>
</html>`;

        await page.setContent(html);

        await page.waitForFunction(() => typeof renderMathInElement !== 'undefined');
        const dimensions = await page.evaluate(() => window.renderMath());
        
        // Match viewport to content
        await page.setViewport({
            width: Math.ceil(dimensions.width),
            height: Math.ceil(dimensions.height),
            deviceScaleFactor: 2
        });

        await new Promise(r => setTimeout(r, 150));

        const element = await page.$('#container');
        await element.screenshot({
            path: outputPath,
            omitBackground: backgroundColor === 'transparent'
        });

    } finally {
        await browser.close();
    }
}

module.exports = latexToImage;
