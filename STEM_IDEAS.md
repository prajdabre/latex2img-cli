# Synthetic STEM Training Data Ideas

This document outlines brainstormed ideas for using the `latex2img-cli` engine and related technologies to generate grounded synthetic training data for STEM AI models.

## 1. Symbol-Level Grounding (Grounded Math OCR)
**The Concept**: Generate high-resolution images of mathematical formulas where every individual symbol (operator, variable, digit) is mapped to a precise bounding box.
- **Implementation**: Wrap each symbol in a unique identifier during the KaTeX rendering process. Use Puppeteer's `getBoundingClientRect()` to extract the `[x, y, width, height]` for every symbol.
- **Output**: An image (`.png`) paired with a metadata file (`.json`) containing symbol locations and labels.
- **Utility**: Training data for fine-grained math detection and layout analysis.

## 2. Grounded Circuits & Flowcharts (TikZ-to-Training)
**The Concept**: Programmatically generate scientific diagrams (circuits, logic gates, chemical structures, flowcharts) using the TikZ language.
- **Implementation**: Write a generator that creates random but valid TikZ code. TikZ's internal coordinate system allows for direct extraction of "ground truth" labels (e.g., "This resistor is at pixel coordinates A, B").
- **Output**: Clean SVG/PNG diagrams with a structured map of all components and their connections.
- **Utility**: Teaching multimodal models to perform "Circuit Reasoning" or "Flowchart Tracing."

## 3. Synthetic Data Visualization (Chart-to-Data)
**The Concept**: Create a bridge between raw numerical data and visual charts to train models in "Visual Data Inverse-Extraction."
- **Implementation**: Use D3.js or Chart.js inside the Puppeteer engine to render line graphs, histograms, and scatter plots using synthetic datasets.
- **Output**: The rendered chart image + a JSON file mapping raw data points to their specific pixel locations on the rendered axes.
- **Utility**: Training models to accurately convert images found in PDFs back into raw CSV/spreadsheet data.

## 4. Grounded Step-by-Step "Chain of Thought" Images
**The Concept**: Visualizing the *logical flow* of a derivation or proof.
- **Implementation**: Generate a sequence of images representing steps in a math problem (e.g., $2x + 5 = 15 \Rightarrow 2x = 10 \Rightarrow x = 5$). 
- **Grounding**: In each frame, use a "highlight" or "glow" effect on the terms that are currently being operated on.
- **Utility**: Training models to understand the *procedural* changes in an equation over time rather than just static snapshots.

## 5. Multi-Style Handwriting & Artifact Synthesis
**The Concept**: Generating "messy" but grounded data to bridge the reality gap between digital typeset and physical handwriting.
- **Implementation**: Apply chaotic SVG filters (blur, ink bleed, variable pressure) and randomized affine transformations (skew, tilt, jitter) to the text elements.
- **Grounding**: The model is trained on the "messy" image but evaluated against the perfectly clean LaTeX "gold standard."
- **Utility**: Improving OCR robustness for scanned student papers, homework, and historical scientific manuscripts.

---

*Brainstormed: 2026-03-17*
