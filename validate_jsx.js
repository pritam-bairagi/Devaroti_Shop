const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const filePath = 'd:\\Technology\\MERN\\Final Project\\E-commerce\\frontend\\src\\pages\\Shop.jsx';
const content = fs.readFileSync(filePath, 'utf8');

try {
  parser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx'],
  });
  console.log('No syntax errors found.');
} catch (error) {
  console.error('Syntax error found:');
  console.error(`Message: ${error.message}`);
  console.error(`Line: ${error.loc.line}`);
  console.error(`Column: ${error.loc.column}`);
}
