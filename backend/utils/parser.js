// class Parser {
//   parseInput(input) {
//     try {
//       // If input is already an object (JSON case)
//       if (typeof input === 'object') {
//         return this.parseFlexible(input);
//       }
      
//       // If input is string (text case)
//       if (typeof input === 'string') {
//         return this.parseText(input);
//       }
      
//       throw new Error('Unsupported input format');
//     } catch (error) {
//       throw new Error(`Parsing failed: ${error.message}`);
//     }
//   }

//   parseText(text) {
//     try {
//       // Try to parse as JSON first
//       try {
//         const jsonData = JSON.parse(text);
//         return this.parseFlexible(jsonData);
//       } catch (e) {
//         // If not JSON, parse as key-value text
//         return this.parseKeyValueText(text);
//       }
//     } catch (error) {
//       throw new Error(`Text parsing failed: ${error.message}`);
//     }
//   }

//   parseKeyValueText(text) {
//     console.log('Parsing text:', text);
    
//     const lines = text.split('\n');
//     const result = {};
    
//     // Define all possible field variations
//     const fieldMappings = {
//       'age': ['age', 'years old', 'year'],
//       'smoker': ['smoker', 'smoking', 'smokes', 'tobacco'],
//       'exercise': ['exercise', 'physical activity', 'workout', 'fitness'],
//       'diet': ['diet', 'food', 'eating', 'nutrition'],
//       'alcohol': ['alcohol', 'drinking', 'drinks', 'alcoholic'],
//       'family_history': ['family history', 'family medical', 'genetic', 'hereditary'],
//       'weight': ['weight', 'kg', 'pounds', 'lbs'],
//       'height': ['height', 'tall', 'feet', 'cm', 'inches']
//     };
    
//     lines.forEach(line => {
//       if (line.trim()) {
//         // Try different patterns to extract key-value pairs
//         const patterns = [
//           /([^:]+):\s*(.+)/,                    // Key: Value
//           /([^=]+)=\s*(.+)/,                    // Key=Value
//           /(\w+)\s+is\s+(.+)/i,                 // Key is Value
//           /(\w+)\s+-\s+(.+)/,                   // Key - Value
//           /([^0-9]+)(\d+)/                      // Key Number (like "age 42")
//         ];
        
//         for (const pattern of patterns) {
//           const match = line.match(pattern);
//           if (match) {
//             let key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
//             let value = match[2] ? match[2].trim() : '';
            
//             // If pattern 5 was used (Key Number), value is in match[2]
//             if (pattern == /([^0-9]+)(\d+)/ && match[2]) {
//               value = match[2].trim();
//             }
            
//             // Map the key to standard field names
//             key = this.mapKeyToStandard(key, fieldMappings);
            
//             if (key && value) {
//               // Convert values to appropriate types
//               result[key] = this.convertValue(key, value);
//               break;
//             }
//           }
//         }
//       }
//     });
    
//     console.log('Parsed result:', result);
//     return this.parseFlexible(result);
//   }

//   parseFlexible(data) {
//     // Accept whatever data we have, no validation for missing fields
//     const result = {};
//     const allPossibleFields = ['age', 'smoker', 'exercise', 'diet', 'alcohol', 'family_history', 'weight', 'height'];
//     const providedFields = [];
    
//     allPossibleFields.forEach(field => {
//       if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
//         result[field] = data[field];
//         providedFields.push(field);
//       }
//     });
    
//     console.log('Provided fields:', providedFields);
    
//     return {
//       answers: result,
//       missing_fields: allPossibleFields.filter(field => !providedFields.includes(field)),
//       confidence: this.calculateConfidence(providedFields.length, allPossibleFields.length),
//       status: 'complete' // Always mark as complete, let AI handle missing data
//     };
//   }

//   mapKeyToStandard(key, fieldMappings) {
//     for (const [standardKey, variations] of Object.entries(fieldMappings)) {
//       for (const variation of variations) {
//         if (key.includes(variation) || variation.includes(key)) {
//           return standardKey;
//         }
//       }
//     }
//     return key;
//   }

//   convertValue(key, value) {
//     if (key === 'age' || key === 'weight' || key === 'height') {
//       const num = parseInt(value);
//       return isNaN(num) ? value : num;
//     }
    
//     if (key === 'smoker') {
//       if (typeof value === 'boolean') return value;
//       if (typeof value === 'string') {
//         return ['yes', 'true', '1', 'y', 'positive'].includes(value.toLowerCase());
//       }
//       return Boolean(value);
//     }
    
//     return value;
//   }

//   calculateConfidence(providedCount, totalCount) {
//     const completeness = providedCount / totalCount;
//     return Math.round(completeness * 100) / 100;
//   }
// }

// module.exports = new Parser();