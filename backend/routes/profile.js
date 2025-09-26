const express = require('express');
const router = express.Router();
const parser = require('../utils/parser');
const aiExtractor = require('../utils/aiExtractor');
const scorer = require('../utils/scorer');

// Handle all inputs - let AI handle missing data
router.post('/', async (req, res) => {
  try {
    console.log('Received profile analysis request:', req.body);
    
    const inputData = req.body;
    
    let parsedData;
    
    // Check if it's text input from frontend
    if (inputData.text) {
      console.log('Processing text input:', inputData.text);
      parsedData = await parser.parseText(inputData.text);
    } else {
      // Regular JSON input
      parsedData = await parser.parseInput(inputData);
    }
    
    console.log('Parsed data:', parsedData);
    
    // Always proceed with analysis, even with missing fields
    // Let AI handle the incomplete data
    
    // Use AI for complete analysis in one go
    const aiAnalysis = await aiExtractor.completeAnalysis(parsedData);
    
    res.json({
      status: 'ok',
      parsed_data: parsedData,
      factors: {
        factors: aiAnalysis.factors || [],
        confidence: aiAnalysis.confidence || 0.8,
        notes: aiAnalysis.notes || 'AI analysis completed'
      },
      risk_assessment: {
        risk_level: aiAnalysis.risk_level || 'medium',
        score: aiAnalysis.score || 50,
        rationale: aiAnalysis.rationale || ['Based on available health data'],
        confidence: aiAnalysis.confidence || 0.8
      },
      recommendations: {
        recommendations: aiAnalysis.recommendations || ['Consult with healthcare provider'],
        status: 'ok'
      },
      analysis_notes: aiAnalysis.notes || 'Analysis completed with available data'
    });
    
  } catch (error) {
    console.error('Profile analysis error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Analysis failed',
      error: error.message 
    });
  }
});

// Handle file upload
router.post('/upload', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File upload received:', req.file.originalname);
    
    // Extract text from file using AI
    const extractedText = await aiExtractor.extractTextFromFile(req.file);
    console.log('Extracted text:', extractedText);
    
    // Parse the extracted text
    const parsedData = await parser.parseText(extractedText);
    
    // Use AI for complete analysis
    const aiAnalysis = await aiExtractor.completeAnalysis(parsedData);
    
    res.json({
      status: 'ok',
      extracted_text: extractedText,
      parsed_data: parsedData,
      factors: {
        factors: aiAnalysis.factors || [],
        confidence: aiAnalysis.confidence || 0.8
      },
      risk_assessment: {
        risk_level: aiAnalysis.risk_level || 'medium',
        score: aiAnalysis.score || 50,
        rationale: aiAnalysis.rationale || ['Based on extracted health data']
      },
      recommendations: {
        recommendations: aiAnalysis.recommendations || ['Consult with healthcare provider'],
        status: 'ok'
      }
    });
    
  } catch (error) {
    console.error('File upload analysis error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'File analysis failed',
      error: error.message 
    });
  }
});

module.exports = router;