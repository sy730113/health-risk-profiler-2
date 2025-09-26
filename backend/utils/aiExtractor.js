// const axios = require('axios');
// const fs = require('fs');

// class AIExtractor {
//   constructor() {
//     this.apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
//     this.baseURL = 'https://openrouter.ai/api/v1';
//   }

//   async extractTextFromFile(file) {
//     try {
//       if (file.mimetype === 'text/plain') {
//         return fs.readFileSync(file.path, 'utf8');
//       }
//       if (file.mimetype.startsWith('image/')) {
//         return await this.extractTextFromImage(file);
//       }
//       if (file.mimetype === 'application/pdf') {
//         return await this.extractTextFromPDF(file);
//       }
//       throw new Error(`Unsupported file type: ${file.mimetype}`);
//     } catch (error) {
//       throw new Error(`Text extraction failed: ${error.message}`);
//     }
//   }

//   async extractTextFromImage(imageFile) {
//     try {
//       const imageBase64 = fs.readFileSync(imageFile.path, 'base64');
      
//       const response = await axios.post(
//         `${this.baseURL}/chat/completions`,
//         {
//           model: "google/gemini-flash-1.5:free",
//           messages: [
//             {
//               role: "user",
//               content: [
//                 {
//                   type: "text",
//                   text: "Extract all health survey data from this image. Return ONLY the raw data in key-value format."
//                 },
//                 {
//                   type: "image_url",
//                   image_url: {
//                     url: `data:${imageFile.mimetype};base64,${imageBase64}`
//                   }
//                 }
//               ]
//             }
//           ],
//           max_tokens: 1000
//         },
//         {
//           headers: {
//             'Authorization': `Bearer ${this.apiKey}`,
//             'Content-Type': 'application/json',
//             'HTTP-Referer': 'http://localhost:3000',
//             'X-Title': 'Health Risk Profiler'
//           },
//           timeout: 30000
//         }
//       );

//       return response.data.choices[0].message.content;
//     } catch (error) {
//       console.error('Image text extraction failed:', error.response?.data || error.message);
//       throw new Error(`Image processing failed: ${error.message}`);
//     }
//   }

//   async extractTextFromPDF(pdfFile) {
//     try {
//       const text = fs.readFileSync(pdfFile.path, 'utf8');
//       return text.substring(0, 5000);
//     } catch (error) {
//       return "PDF content extraction would require a proper PDF parser library";
//     }
//   }

//   async extractFactors(answers) {
//     try {
//       console.log('Extracting factors from answers:', answers);
      
//       const response = await axios.post(
//         `${this.baseURL}/chat/completions`,
//         {
//           model: "google/gemini-flash-1.5:free",
//           messages: [
//             {
//               role: "system",
//               content: `You are a health risk factor analyzer. Analyze the health survey data and identify risk factors. 
//               Even if some fields are missing, make reasonable inferences based on available data.
//               Return ONLY valid JSON with this exact format:
//               {
//                 "factors": ["factor1", "factor2", ...],
//                 "confidence": 0.95,
//                 "notes": "Brief explanation of analysis"
//               }`
//             },
//             {
//               role: "user",
//               content: `Analyze this health data (missing fields are okay): ${JSON.stringify(answers)}`
//             }
//           ],
//           max_tokens: 500,
//           temperature: 0.1
//         },
//         {
//           headers: {
//             'Authorization': `Bearer ${this.apiKey}`,
//             'Content-Type': 'application/json',
//             'HTTP-Referer': 'http://localhost:3000'
//           },
//           timeout: 30000
//         }
//       );

//       const content = response.data.choices[0].message.content;
//       console.log('Raw AI response for factors:', content);
      
//       const jsonMatch = content.match(/\{[\s\S]*\}/);
//       const jsonString = jsonMatch ? jsonMatch[0] : content;
      
//       return JSON.parse(jsonString);
//     } catch (error) {
//       console.error('Factor extraction failed:', error.response?.data || error.message);
//       return this.fallbackFactorExtraction(answers);
//     }
//   }

//   async generateRecommendations(riskAssessment, factors) {
//     try {
//       const response = await axios.post(
//         `${this.baseURL}/chat/completions`,
//         {
//           model: "google/gemini-flash-1.5:free",
//           messages: [
//             {
//               role: "system",
//               content: `You are a health advisor. Provide specific, actionable, non-diagnostic recommendations. 
//               Return ONLY valid JSON with this exact format:
//               {
//                 "recommendations": ["rec1", "rec2", ...],
//                 "status": "ok"
//               }`
//             },
//             {
//               role: "user",
//               content: `Risk level: ${riskAssessment.risk_level}, Risk factors: ${factors.factors.join(', ')}. Provide practical health recommendations.`
//             }
//           ],
//           max_tokens: 500,
//           temperature: 0.1
//         },
//         {
//           headers: {
//             'Authorization': `Bearer ${this.apiKey}`,
//             'Content-Type': 'application/json'
//           },
//           timeout: 30000
//         }
//       );

//       const content = response.data.choices[0].message.content;
//       const jsonMatch = content.match(/\{[\s\S]*\}/);
//       const jsonString = jsonMatch ? jsonMatch[0] : content;
      
//       return JSON.parse(jsonString);
//     } catch (error) {
//       console.error('Recommendation generation failed:', error.response?.data || error.message);
//       return this.fallbackRecommendations(riskAssessment, factors);
//     }
//   }

//   async completeAnalysis(parsedData) {
//     try {
//       // Use AI to handle the entire analysis in one go, even with missing data
//       const response = await axios.post(
//         `${this.baseURL}/chat/completions`,
//         {
//           model: "google/gemini-flash-1.5:free",
//           messages: [
//             {
//               role: "system",
//               content: `You are a health risk profiler. Analyze the available health survey data and provide a complete assessment.
//               Even if some fields are missing, make reasonable analysis based on available information.
              
//               Return ONLY valid JSON with this exact structure:
//               {
//                 "factors": ["risk factor 1", "risk factor 2"],
//                 "risk_level": "low/medium/high",
//                 "score": 0-100,
//                 "rationale": ["reason 1", "reason 2"],
//                 "recommendations": ["recommendation 1", "recommendation 2"],
//                 "confidence": 0.95,
//                 "notes": "Analysis notes"
//               }`
//             },
//             {
//               role: "user",
//               content: `Analyze this health survey data: ${JSON.stringify(parsedData.answers)}. 
//               Missing fields: ${parsedData.missing_fields.join(', ')}. 
//               Provide a complete health risk assessment.`
//             }
//           ],
//           max_tokens: 1000,
//           temperature: 0.1
//         },
//         {
//           headers: {
//             'Authorization': `Bearer ${this.apiKey}`,
//             'Content-Type': 'application/json'
//           },
//           timeout: 30000
//         }
//       );

//       const content = response.data.choices[0].message.content;
//       const jsonMatch = content.match(/\{[\s\S]*\}/);
//       const jsonString = jsonMatch ? jsonMatch[0] : content;
      
//       return JSON.parse(jsonString);
//     } catch (error) {
//       console.error('Complete analysis failed:', error.response?.data || error.message);
//       throw error;
//     }
//   }

//   fallbackFactorExtraction(answers) {
//     const factors = [];
//     if (answers.smoker === true || answers.smoker === 'yes') factors.push('smoking');
//     if (answers.exercise === 'rarely' || answers.exercise === 'never') factors.push('low exercise');
//     if (answers.diet && answers.diet.includes('sugar')) factors.push('poor diet');
//     if (answers.alcohol && answers.alcohol !== 'never') factors.push('alcohol consumption');
//     if (answers.family_history) factors.push('family history');

//     return {
//       factors: factors,
//       confidence: 0.8,
//       notes: 'Fallback analysis based on available data'
//     };
//   }

//   fallbackRecommendations(riskAssessment, factors) {
//     const recommendations = [];
//     if (factors.factors.includes('smoking')) {
//       recommendations.push('Consider smoking cessation programs');
//     }
//     if (factors.factors.includes('low exercise')) {
//       recommendations.push('Aim for regular physical activity');
//     }
//     if (factors.factors.includes('poor diet')) {
//       recommendations.push('Improve dietary habits with more fruits and vegetables');
//     }
    
//     return {
//       recommendations: recommendations.length > 0 ? recommendations : ['Maintain regular health check-ups'],
//       status: 'ok'
//     };
//   }
// }

// module.exports = new AIExtractor();