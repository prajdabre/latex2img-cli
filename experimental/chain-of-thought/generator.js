const latexToImage = require('../../index');
const path = require('path');
const fs = require('fs');

async function generateChain() {
    const steps = [
        { label: 'original', text: 'Solve for x:\n$$2x + 5 = 10$$' },
        { label: 'subtract', text: 'Subtract 5 from both sides:\n$$2x = 10 \\mathbin{\\textcolor{#3498db}{- 5}}$$' },
        { label: 'simplify1', text: 'Simplify:\n$$2x = \\textcolor{#3498db}{5}$$' },
        { label: 'divide', text: 'Divide by 2:\n$$x = \\textcolor{#3498db}{\\frac{5}{2}}$$' },
        { label: 'final', text: 'Result:\n$$x = \\textcolor{#3498db}{2.5}$$' }
    ];

    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Generating Chain of Thought sequence...');

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const fileName = `step_${i}_${step.label}.png`;
        const outputPath = path.join(outputDir, fileName);

        console.log(`Rendering ${fileName}...`);
        try {
            await latexToImage(step.text, outputPath, {
                fontSize: 32,
                padding: 40,
                backgroundColor: '#ffffff',
                width: 500
            });
        } catch (error) {
            console.error(`Error at step ${i}:`, error);
        }
    }

    console.log('\nSequence generated successfully in experimental/chain-of-thought/outputs/');
}

generateChain();
