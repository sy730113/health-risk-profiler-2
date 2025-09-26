// simple smoke test for parser
const { parseInput } = require('../utils/parser');

const sample = { age: 42, smoker: true, exercise: 'rarely', diet: 'high sugar' };
console.log(JSON.stringify(parseInput(sample), null, 2));

const ocr = 'Age: 42\nSmoker: yes\nExercise: rarely\nDiet: high sugar';
console.log(JSON.stringify(parseInput({ ocr_text: ocr }), null, 2));