# Simple Strength

A comprehensive web application that generates personalized workout and diet plans using AI, specifically designed for beginners and teens.

## Features

- **Personalized Plans**: AI-generated workout and diet plans based on individual characteristics and preferences
- **Flexible Options**: Choose workout only, diet only, or both plans
- **Comprehensive Questionnaire**: Covers body characteristics, time availability, goals, diet restrictions, and budget
- **Budget-Friendly**: Includes calisthenics/bodyweight exercises for zero equipment budget
- **Supplement Recommendations**: Personalized supplement suggestions within budget
- **Generation Tracking**: Persistent counter tracking total plans generated across all users
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Mobile-Friendly**: Fully responsive design for all devices

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AI-Fitness-Trainer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```
Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

4. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
AI-Fitness-Trainer/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # CSS styles
│   └── script.js       # Frontend JavaScript
├── data/
│   └── generation_counter.json  # Persistent counter storage
├── server.js           # Express server
├── package.json        # Dependencies
├── env.example         # Environment variables template
└── README.md          # This file
```

## API Endpoints

### GET `/api/generation-count`
Returns the total number of plans generated.

Response:
```json
{
  "totalGenerations": 42
}
```

### POST `/api/generate-plan`
Generates a personalized fitness and/or diet plan.

Request body includes user data from the questionnaire form.

Response:
```json
{
  "plan": "Generated plan text...",
  "totalGenerations": 43,
  "planType": "both"
}
```

## Questionnaire Sections

1. **Basic Information**: Age, gender, height, weight
2. **Fitness Level**: Beginner, intermediate, or advanced
3. **Time Availability**: Daily time commitment
4. **Goals**: Weight loss, muscle gain, strength, endurance, flexibility, general fitness
5. **Target Muscle Groups**: Chest, back, shoulders, arms, core, legs, full body
6. **Dietary Preferences**: Vegetarian, vegan, gluten-free, keto, etc.
7. **Budget**: Gym membership, equipment, food, supplements

## Key Features

### Smart Budget Handling
- **$0 Equipment Budget**: Automatically suggests bodyweight/calisthenics exercises
- **Low Food Budget**: Provides budget-friendly meal suggestions
- **Supplement Recommendations**: Only suggests supplements within specified budget

### AI Integration
- Uses OpenAI GPT-4 for high-quality plan generation
- Comprehensive prompts ensure personalized, safe recommendations
- Beginner-friendly explanations and safety considerations

### Persistent Data
- Generation counter survives server restarts
- Data stored in JSON file (easily upgradeable to database)

### User Experience
- Single-page application with smooth transitions
- Real-time form validation
- Toast notifications for feedback
- Mobile-responsive design
- Accessibility considerations

## Deployment

### Option 1: Traditional Hosting
Deploy to any hosting service that supports Node.js (Heroku, DigitalOcean, AWS, etc.)

### Option 2: Static + Serverless
- Frontend: Deploy to Netlify, Vercel, or GitHub Pages
- Backend: Convert to serverless functions

### Environment Variables for Production
```bash
OPENAI_API_KEY=your_production_api_key
PORT=3000
NODE_ENV=production
```

## Customization

### Adding New Questions
1. Add form fields to `public/index.html`
2. Update form data collection in `public/script.js`
3. Modify the AI prompt in `server.js` to use new data

### Styling
- Modify `public/styles.css` for visual changes
- CSS variables make theme customization easy
- Responsive breakpoints included

### AI Model
- Change the model in `server.js` (currently using GPT-4)
- Adjust `max_tokens` and `temperature` for different outputs

## Security Considerations

- API key stored securely in environment variables
- Input validation on both client and server
- Rate limiting recommended for production
- HTTPS required for production deployment

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Graceful degradation for older browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please create an issue in the repository.
