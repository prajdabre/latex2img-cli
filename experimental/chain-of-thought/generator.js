const latexToImage = require('../../index');
const path = require('path');
const fs = require('fs');

/**
 * Renders a specific problem from a JSON file
 * @param {string} jsonPath 
 */
async function processProblem(jsonPath) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const problemName = path.basename(jsonPath, '.json');
    const outputsBaseDir = path.join(__dirname, 'outputs', problemName);

    if (!fs.existsSync(outputsBaseDir)) {
        fs.mkdirSync(outputsBaseDir, { recursive: true });
    }

    console.log(`\nProcessing Problem: ${problemName}`);
    
    for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        const fileName = `step_${i}_${step.label}.png`;
        const outputPath = path.join(outputsBaseDir, fileName);

        console.log(`  - Rendering ${fileName}...`);
        try {
            await latexToImage(step.text, outputPath, {
                fontSize: 32,
                padding: 40,
                backgroundColor: '#ffffff',
                width: 600
            });
        } catch (error) {
            console.error(`Error at step ${i}:`, error);
        }
    }
}

async function run() {
    const problemsDir = path.join(__dirname, 'problems');
    
    // Fallback if no problems folder exists yet
    if (!fs.existsSync(problemsDir)) {
        console.log('No problems/ folder found. Run the script with a JSON path or create the folder.');
        return;
    }

    const files = fs.readdirSync(problemsDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
        await processProblem(path.join(problemsDir, file));
    }

    console.log('\nAll sequences generated in experimental/chain-of-thought/outputs/');
}

run();
