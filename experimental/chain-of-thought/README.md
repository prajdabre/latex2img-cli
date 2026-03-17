# Experimental: Chain of Thought (CoT) Image Generation

This experiment explores the generation of **sequential derivation steps** as a training resource for STEM AI models. Instead of a single image containing a full derivation, this tool produces a series of images representing the state of an equation at each step of the solution process.

## 🎯 Goal
To provide "state-change" visual data that can help multimodal models learn the procedural logic of mathematical problem solving.

## 🛠 Usage
Run the generator script to produce the sequence:

```bash
node experimental/chain-of-thought/generator.js
```

## 📂 Output
The rendered steps are saved in `experimental/chain-of-thought/outputs/`:
- `step_0_original.png`
- `step_1_subtract.png`
- `step_2_simplify1.png`
... and so on.

## 🧪 Current Equation
The script currently solves:
$$2x + 5 = 10$$

## 🚀 Roadmap
- [ ] Support for multi-branch derivations.
- [ ] Integration with grounded bounding boxes for every step.
- [ ] "Delta" highlighting (visualizing which specific term changed between frames).
