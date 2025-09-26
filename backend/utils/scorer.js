// class Scorer {
//   calculateRisk(factors) {
//     const factorWeights = {
//       'smoking': 25,
//       'poor diet': 20,
//       'low exercise': 15,
//       'alcohol consumption': 15,
//       'obesity': 20,
//       'family history': 10,
//       'high stress': 10
//     };
    
//     let score = 0;
//     const rationale = [];
    
//     factors.factors.forEach(factor => {
//       if (factorWeights[factor.toLowerCase()]) {
//         score += factorWeights[factor.toLowerCase()];
//         rationale.push(factor);
//       }
//     });
    
//     // Cap score at 100
//     score = Math.min(score, 100);
    
//     let risk_level = 'low';
//     if (score >= 70) risk_level = 'high';
//     else if (score >= 40) risk_level = 'medium';
    
//     return {
//       risk_level: risk_level,
//       score: score,
//       rationale: rationale,
//       confidence: factors.confidence || 0.85
//     };
//   }
// }

// module.exports = new Scorer();