const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Initialize OpenRouter client (like your working example)
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.REACT_APP_OPENROUTER_API_KEY,
});

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and text files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper function to check if input is JSON
function isJsonInput(message) {
  try {
    JSON.parse(message);
    return true;
  } catch {
    return false;
  }
}

// Text parsing function
function parseTextInput(text) {
  const result = {};
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.trim()) {
      const patterns = [
        /([^:]+):\s*(.+)/,
        /([^=]+)=\s*(.+)/,
        /(\w+)\s+is\s+(.+)/i,
        /age\s+is\s+(\d+)/i,
        /smoking\s+(true|false|yes|no)/i,
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          let key, value;
          
          if (pattern == /age\s+is\s+(\d+)/i) {
            key = 'age';
            value = match[1];
          } else if (pattern == /smoking\s+(true|false|yes|no)/i) {
            key = 'smoker';
            value = match[1];
          } else {
            key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
            value = match[2].trim();
          }
          
          if (key.includes('smok')) key = 'smoker';
          if (key.includes('exerc')) key = 'exercise';
          if (key.includes('diet')) key = 'diet';
          if (key.includes('alcohol')) key = 'alcohol';
          if (key.includes('family')) key = 'family_history';
          
          if (key === 'age' || key === 'weight' || key === 'height') {
            const num = parseInt(value);
            if (!isNaN(num)) value = num;
          }
          
          if (key === 'smoker') {
            value = ['yes', 'true', '1', 'y'].includes(value.toLowerCase());
          }
          
          result[key] = value;
          break;
        }
      }
    }
  });
  
  return result;
}

// AI Health Analysis function
async function analyzeHealthWithAI(healthData, imagePath = null) {
  try {
    let messages = [];
    
    if (imagePath && fs.existsSync(imagePath)) {
      // Vision analysis for images
      const imageBase64 = fs.readFileSync(imagePath, 'base64');
      
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this health survey image and provide a comprehensive health risk assessment. 
              Extract health information and provide analysis in this JSON format:
              {
                "risk_level": "low/medium/high",
                "score": 0-100,
                "factors": ["factor1", "factor2"],
                "recommendations": ["rec1", "rec2", "rec3"],
                "rationale": "Detailed explanation"
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ];
    } else {
      // Text analysis for JSON/text data
      messages = [
        {
          role: "user",
          content: `Analyze this health data and provide a risk assessment in JSON format:
          ${JSON.stringify(healthData, null, 2)}
          
          Return JSON with: risk_level, score, factors, recommendations, rationale`
        }
      ];
    }

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o", // Use the same model as your working example
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    
    // Extract JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('JSON parse failed, using text response');
    }
    
    // Fallback if JSON parsing fails
    return {
      risk_level: "medium",
      score: 50,
      factors: ["AI analysis completed"],
      recommendations: ["Consult healthcare provider"],
      rationale: content
    };
    
  } catch (error) {
    console.error('AI analysis error:', error);
    throw new Error(`AI service error: ${error.message}`);
  }
}

// Local fallback analysis
function localHealthAnalysis(data) {
  const factors = [];
  if (data.smoker === true || data.smoker === 'yes') factors.push('smoking');
  if (data.exercise === 'rarely' || data.exercise === 'never') factors.push('low exercise');
  if (data.diet && data.diet.includes('sugar')) factors.push('poor diet');
  if (data.alcohol && data.alcohol !== 'never') factors.push('alcohol consumption');
  if (data.family_history) factors.push('family history');

  let score = 30;
  if (factors.includes('smoking')) score += 25;
  if (factors.includes('low exercise')) score += 20;
  if (factors.includes('poor diet')) score += 15;

  const riskLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    risk_level: riskLevel,
    score: Math.min(score, 100),
    factors: factors,
    recommendations: [
      factors.includes('smoking') ? 'Quit smoking' : null,
      factors.includes('low exercise') ? 'Exercise regularly' : null,
      factors.includes('poor diet') ? 'Improve diet' : null,
      'Regular health checkups'
    ].filter(Boolean),
    rationale: `Analysis based on ${factors.length} risk factors`,
    source: 'local'
  };
}

// Main analysis endpoint
app.post('/api/profile', async (req, res) => {
  try {
    const inputData = req.body;
    console.log('Received input:', inputData);
    
    let healthData = {};
    
    if (inputData.text) {
      healthData = parseTextInput(inputData.text);
    } else {
      healthData = inputData;
    }
    
    console.log('Health data for analysis:', healthData);
    
    let analysis;
    try {
      // Try AI analysis first
      analysis = await analyzeHealthWithAI(healthData);
      analysis.source = 'ai';
    } catch (aiError) {
      console.log('AI failed, using local analysis:', aiError.message);
      analysis = localHealthAnalysis(healthData);
    }
    
    const response = {
      status: 'ok',
      input_type: inputData.text ? 'text' : 'json',
      parsed_data: {
        answers: healthData,
        confidence: 0.9
      },
      analysis: analysis,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Analysis failed',
      error: error.message 
    });
  }
});

// File upload endpoint
app.post('/api/profile/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('Processing file:', req.file.originalname);
    
    let analysis;
    let extractedText = '';
    
    if (req.file.mimetype.startsWith('image/')) {
      // AI vision analysis for images
      try {
        analysis = await analyzeHealthWithAI({}, req.file.path);
        analysis.source = 'ai_vision';
        extractedText = 'Image analyzed using AI vision';
      } catch (visionError) {
        console.log('Vision analysis failed:', visionError);
        analysis = localHealthAnalysis({});
        analysis.source = 'local_fallback';
        extractedText = 'Vision analysis unavailable, using default assessment';
      }
    } else if (req.file.mimetype === 'text/plain') {
      // Text file analysis
      extractedText = fs.readFileSync(req.file.path, 'utf8');
      const healthData = parseTextInput(extractedText);
      analysis = await analyzeHealthWithAI(healthData);
      analysis.source = 'ai_text';
    } else {
      throw new Error('Unsupported file type');
    }
    
    res.json({
      status: 'ok',
      file_type: req.file.mimetype,
      extracted_text: extractedText.substring(0, 300),
      analysis: analysis,
      notes: 'Analysis completed successfully'
    });
    
    // Clean up file
    setTimeout(() => {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }, 3000);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'File processing failed',
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test AI connection
    const testCompletion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: "Say 'OK' if working" }],
      max_tokens: 10,
    });
    
    res.json({ 
      status: 'ok', 
      message: 'API is running with AI capabilities',
      ai_status: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ 
      status: 'ok', 
      message: 'API is running (AI service unavailable)',
      ai_status: 'disconnected',
      error: error.message
    });
  }
});

// Test endpoint
app.post('/api/test', async (req, res) => {
  try {
    const testData = {
      age: 42,
      smoker: true,
      exercise: "rarely",
      diet: "high sugar"
    };
    
    const analysis = await analyzeHealthWithAI(testData);
    
    res.json({
      status: 'ok',
      test_data: testData,
      analysis: analysis,
      message: 'AI analysis test successful'
    });
    
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Test failed',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Health Risk Profiler running on port ${PORT}`);
 
});