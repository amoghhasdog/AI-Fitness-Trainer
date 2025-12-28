const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Initialize OpenAI (only if API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('⚠️  WARNING: OPENAI_API_KEY environment variable is not set. AI features will not work.');
}

// File paths
const COUNTER_FILE = path.join(__dirname, 'data', 'generation_counter.json');

// Ensure data directory exists
async function ensureDataDir() {
  await fs.ensureDir(path.dirname(COUNTER_FILE));
  
  // Initialize counter file if it doesn't exist
  if (!(await fs.pathExists(COUNTER_FILE))) {
    await fs.writeJson(COUNTER_FILE, { totalGenerations: 0, totalVisits: 0 });
  } else {
    // Ensure totalVisits exists in existing file
    try {
      const data = await fs.readJson(COUNTER_FILE);
      if (data.totalVisits === undefined) {
        data.totalVisits = 0;
        await fs.writeJson(COUNTER_FILE, data);
      }
    } catch (error) {
      console.error('Error updating counter file:', error);
    }
  }
}

// Get generation counter
async function getGenerationCount() {
  try {
    const data = await fs.readJson(COUNTER_FILE);
    return data.totalGenerations || 0;
  } catch (error) {
    console.error('Error reading counter:', error);
    return 0;
  }
}

// Increment generation counter
async function incrementGenerationCount() {
  try {
    const data = await fs.readJson(COUNTER_FILE);
    const currentCount = data.totalGenerations || 0;
    const newCount = currentCount + 1;
    data.totalGenerations = newCount;
    await fs.writeJson(COUNTER_FILE, data);
    return newCount;
  } catch (error) {
    console.error('Error updating counter:', error);
    return 0;
  }
}

// Get visit counter
async function getVisitCount() {
  try {
    const data = await fs.readJson(COUNTER_FILE);
    return data.totalVisits || 0;
  } catch (error) {
    console.error('Error reading visit counter:', error);
    return 0;
  }
}

// Increment visit counter
async function incrementVisitCount() {
  try {
    const data = await fs.readJson(COUNTER_FILE);
    const currentCount = data.totalVisits || 0;
    const newCount = currentCount + 1;
    data.totalVisits = newCount;
    await fs.writeJson(COUNTER_FILE, data);
    return newCount;
  } catch (error) {
    console.error('Error updating visit counter:', error);
    return 0;
  }
}

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const generatePlanLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many plan generations. Please wait 15 minutes before generating another plan.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.get('/api/generation-count', async (req, res) => {
  try {
    const count = await getGenerationCount();
    res.json({ totalGenerations: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get generation count' });
  }
});

app.get('/api/visit-count', async (req, res) => {
  try {
    const count = await getVisitCount();
    res.json({ totalVisits: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get visit count' });
  }
});

// Increment visit counter (called on page load/reload)
app.post('/api/increment-visit', async (req, res) => {
  try {
    const newCount = await incrementVisitCount();
    res.json({ totalVisits: newCount });
  } catch (error) {
    console.error('Error incrementing visit count:', error);
    res.status(500).json({ error: 'Failed to increment visit count' });
  }
});

app.post('/api/generate-plan', generatePlanLimit, async (req, res) => {
  try {
    // Check if OpenAI is configured
    if (!openai) {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.',
        details: 'The server is missing the required API key to generate plans.'
      });
    }

    const {
      planType,
      age,
      gender,
      height,
      weight,
      fitnessLevel,
      timeAvailability,
      targetGoals,
      targetMuscles,
      dietRestrictions,
      gymBudget,
      equipmentBudget,
      foodBudget,
      supplementBudget,
      allergies,
      preferredMeals,
      cookingTime
    } = req.body;

    // Create comprehensive prompt for AI
    let prompt = `Create a personalized ${planType} for a ${age}-year-old ${gender} who is ${height} tall and weighs ${weight}. 

User Profile:
- Fitness Level: ${fitnessLevel}
- Available Time: ${timeAvailability}
- Primary Goals: ${targetGoals.join(', ')}
- Target Muscle Groups: ${targetMuscles.join(', ')}
- Diet Restrictions: ${dietRestrictions.join(', ')}
- Allergies: ${allergies || 'None specified'}
- Budget Information:
  - Gym: $${gymBudget}/month
  - Equipment: $${equipmentBudget}
  - Food: $${foodBudget}/month
  - Supplements: $${supplementBudget}/month

`;

    if (planType.includes('workout') || planType === 'both') {
      prompt += `
WORKOUT PLAN REQUIREMENTS:
- Design for ${fitnessLevel} fitness level
- ${equipmentBudget === 0 ? 'Focus on bodyweight/calisthenics exercises (no equipment needed)' : `Include exercises for available equipment budget of $${equipmentBudget}`}
- Target: ${targetMuscles.join(', ')}
- Time constraint: ${timeAvailability}
- Include proper warm-up and cool-down
- Provide exercise descriptions and proper form tips
- Include progression suggestions
- Format as structured weekly plan

`;
    }

    if (planType.includes('diet') || planType === 'both') {
      prompt += `
DIET PLAN REQUIREMENTS:
- Account for dietary restrictions: ${dietRestrictions.join(', ')}
- Avoid allergies: ${allergies || 'None'}
- Budget-friendly meals within $${foodBudget}/month
- Preferred meals: ${preferredMeals}
- Cooking time available: ${cookingTime}
- Include macro breakdown
- Provide meal prep suggestions
- Include healthy snack options
- Consider supplement recommendations within $${supplementBudget}/month budget

`;
    }

    prompt += `
Please format the response in a clear, structured way with:
1. Summary of the plan
2. Detailed daily/weekly schedule
3. Important tips and notes
4. Budget breakdown
5. Progress tracking suggestions

Make this beginner-friendly with clear explanations and safety considerations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional fitness trainer and nutritionist specializing in creating personalized workout and diet plans for beginners and teens. Provide comprehensive, safe, and beginner-friendly advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const generatedPlan = completion.choices[0].message.content;
    
    // Increment counter
    const newCount = await incrementGenerationCount();
    
    res.json({
      plan: generatedPlan,
      totalGenerations: newCount,
      planType: planType
    });

  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ 
      error: 'Failed to generate plan',
      details: error.message 
    });
  }
});

// Initialize and start server
async function startServer() {
  await ensureDataDir();
  app.listen(PORT, () => {
    console.log(`Simple Strength server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
