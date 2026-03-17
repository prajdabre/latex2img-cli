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
 * @param {string} options.width - Optional fixed width in pixels.
 * @param {string} options.theme - Theme: 'modern', 'handwritten', or 'chalkboard' (default: 'modern').
 * @param {boolean|string} options.grounded - Extraction level: 'char', 'equation', or false (default: false).
 * @param {boolean|string} options.debug - Visual debug level: 'char', 'equation', or false (default: false).
 * @param {number} options.noise - Noise level from 0 to 1 (default: 0).
 */
async function latexToImage(text, outputPath, options = {}) {
    const {
        padding = 20,
        fontSize = 24,
        backgroundColor: userBgColor,
        width: fixedWidth,
        theme = 'modern',
        grounded = false,
        debug = false,
        noise = 0
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
    <svg style="position: absolute; width: 0; height: 0;">
        <filter id="inkBleed">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
        <filter id="dirtyScan">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="destat" />
            <feComponentTransfer in="destat" result="alpha">
                <feFuncA type="linear" slope="0.1" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="alpha" mode="multiply" />
        </filter>
    </svg>
    <div id="container">
        <div id="content"></div>
    </div>
    <script>
        const text = ${JSON.stringify(text)};
        document.getElementById('content').textContent = text;
        
        window.renderMath = async (shouldGround, shouldDebug, noiseLevel) => {
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
            const content = document.getElementById('content');

            // Apply noise if requested
            if (noiseLevel > 0) {
                const intensity = parseFloat(noiseLevel);
                
                // 1. Global distortions
                const globalRot = (Math.random() - 0.5) * 2 * intensity; // -intensity to +intensity deg
                const globalSkew = (Math.random() - 0.5) * intensity;
                container.style.transform = 'rotate(' + globalRot + 'deg) skew(' + globalSkew + 'deg)';
                
                // 2. Individual symbol jitter
                const symbols = container.querySelectorAll('.katex .mord, .katex .mop, .katex .mbin, .katex .mrel, .katex .mopen, .katex .mclose, .katex .mpunct, .katex .minner');
                symbols.forEach(s => {
                    if (s.children.length === 0) {
                        const sRot = (Math.random() - 0.5) * 10 * intensity;
                        const sScale = 1 + (Math.random() - 0.5) * 0.1 * intensity;
                        const sY = (Math.random() - 0.5) * 4 * intensity;
                        const sX = (Math.random() - 0.5) * 2 * intensity;
                        s.style.display = 'inline-block';
                        s.style.transform = 'translate(' + sX + 'px, ' + sY + 'px) rotate(' + sRot + 'deg) scale(' + sScale + ')';
                        s.style.opacity = 1 - (Math.random() * 0.2 * intensity);
                    }
                });

                // 3. Filters for bad scan look
                let filters = [];
                if (Math.random() < 0.5 * intensity) filters.push('blur(' + (Math.random() * 0.5 * intensity) + 'px)');
                if (Math.random() < intensity) filters.push('contrast(' + (1 + (Math.random() - 0.5) * 0.5 * intensity) + ')');
                if (Math.random() < intensity) filters.push('brightness(' + (1 + (Math.random() - 0.5) * 0.3 * intensity) + ')');
                
                // Ink bleed SVG filter
                if (Math.random() < 0.8 * intensity) {
                    content.style.filter = 'url(#inkBleed) ' + filters.join(' ');
                } else {
                    content.style.filter = filters.join(' ');
                }

                // Global dirt/scan filter
                if (Math.random() < 0.3 * intensity) {
                    container.style.filter = 'url(#dirtyScan)';
                }
            }
            
            await new Promise(r => setTimeout(r, 50));
            const containerRect = container.getBoundingClientRect();
            
            // Expand viewport to measure full content
            const allElements = container.querySelectorAll('*');
            let maxRight = 0;
            let maxBottom = 0;
            
            allElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    if (rect.right > maxRight) maxRight = rect.right;
                    if (rect.bottom > maxBottom) maxBottom = rect.bottom;
                }
            });
            
            // Fallback to container dimensions if no children found
            maxRight = Math.max(maxRight, containerRect.right);
            maxBottom = Math.max(maxBottom, containerRect.bottom);

            const result = {
                width: maxRight,
                height: maxBottom,
                boxes: []
            };

            const drawBox = (rect, color, label) => {
                const box = document.createElement('div');
                box.style.position = 'absolute';
                box.style.left = (rect.left - containerRect.left) + 'px';
                box.style.top = (rect.top - containerRect.top) + 'px';
                box.style.width = rect.width + 'px';
                box.style.height = rect.height + 'px';
                box.style.border = '1.5px solid ' + color;
                box.style.boxSizing = 'border-box';
                box.style.pointerEvents = 'none';
                box.style.zIndex = '9999';
                if (label) {
                    const l = document.createElement('span');
                    l.textContent = label;
                    l.style.position = 'absolute';
                    l.style.top = '-14px';
                    l.style.left = '0';
                    l.style.fontSize = '10px';
                    l.style.background = color;
                    l.style.color = 'white';
                    l.style.padding = '0 2px';
                    box.appendChild(l);
                }
                container.appendChild(box);
            };

            const normalizeLevel = (raw) => {
                if (raw === true || raw === 'char') return 'char';
                if (raw === 'equation') return 'equation';
                return 'none';
            };

            const gLevel = normalizeLevel(shouldGround);
            const dLevel = normalizeLevel(shouldDebug);

            if (gLevel === 'char' || dLevel === 'char') {
                const elements = container.querySelectorAll('.katex .mord, .katex .mop, .katex .mbin, .katex .mrel, .katex .mopen, .katex .mclose, .katex .mpunct, .katex .minner');
                elements.forEach(el => {
                    if (el.children.length === 0 && el.textContent.trim().length > 0) {
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            if (gLevel === 'char') {
                                result.boxes.push({
                                    text: el.textContent.trim(),
                                    box: [
                                        Math.round(rect.left - containerRect.left),
                                        Math.round(rect.top - containerRect.top),
                                        Math.round(rect.width),
                                        Math.round(rect.height)
                                    ],
                                    label: Array.from(el.classList).find(c => c.startsWith('m')) || 'char'
                                });
                            }
                            if (dLevel === 'char') {
                                drawBox(rect, 'rgba(231, 76, 60, 0.8)'); // Red for symbols
                            }
                        }
                    }
                });
            }

            if (gLevel === 'equation' || dLevel === 'equation') {
                const equations = container.querySelectorAll('.katex-display, .katex:not(.katex-display .katex)');
                equations.forEach(eq => {
                    const rect = eq.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        if (gLevel === 'equation') {
                            result.boxes.push({
                                text: eq.textContent.trim(),
                                box: [
                                    Math.round(rect.left - containerRect.left),
                                    Math.round(rect.top - containerRect.top),
                                    Math.round(rect.width),
                                    Math.round(rect.height)
                                ],
                                label: 'equation'
                            });
                        }
                        if (dLevel === 'equation') {
                            drawBox(rect, 'rgba(52, 152, 219, 0.9)', 'equation');
                        }
                    }
                });
            }

            return result;
        };
    </script>
</body>
</html>`;

        await page.setContent(html);

        await page.waitForFunction(() => typeof renderMathInElement !== 'undefined');
        const dimensions = await page.evaluate((g, d, n) => window.renderMath(g, d, n), grounded, debug, noise);
        
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

        // Save grounding data if requested
        if (grounded && dimensions.boxes.length > 0) {
            const metadataPath = outputPath.replace(/\.[^/.]+$/, "") + ".json";
            fs.writeFileSync(metadataPath, JSON.stringify({
                text,
                image: path.basename(outputPath),
                groundingLevel: grounded === true ? 'char' : grounded,
                noiseLevel: noise,
                dimensions: { width: dimensions.width, height: dimensions.height },
                boxes: dimensions.boxes
            }, null, 2));
        }

    } finally {
        await browser.close();
    }
}

module.exports = latexToImage;
