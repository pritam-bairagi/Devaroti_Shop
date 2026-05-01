const fs = require('fs');

const filePath = 'd:\\Technology\\MERN\\Final Project\\E-commerce\\frontend\\src\\pages\\Shop.jsx';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

let stack = [];
lines.forEach((line, index) => {
    const lineNum = index + 1;
    // Simple tag matcher (not perfect but good for standard JSX)
    const openMatches = line.matchAll(/<div(\s|>)/g);
    const closeMatches = line.matchAll(/<\/div>/g);

    for (const match of openMatches) {
        stack.push({ lineNum, char: match.index });
    }
    for (const match of closeMatches) {
        if (stack.length > 0) {
            stack.pop();
        } else {
            console.log(`EXTRA CLOSER at line ${lineNum}`);
        }
    }
});

stack.forEach(op => {
    console.log(`UNCLOSED <div> at line ${op.lineNum}`);
});
console.log(`Final Unclosed Count: ${stack.length}`);
