# Wine Picker

A modern web application that analyzes wine labels and menus using AI, providing detailed information, ratings, and reviews from wine experts.

## Features

- Upload images of wine labels or menus
- AI-powered analysis using OpenAI's Vision API
- Real-time web search for authentic wine reviews
- Extract and normalize ratings from multiple sources
- Display wine details, ratings, and expert reviews
- Apple-inspired clean, responsive UI design

## Technologies

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: Static typing for better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **OpenAI API**: For image analysis and wine identification
- **Serper API**: For fetching real wine reviews from the web

## Getting Started

### Prerequisites

- Node.js 14.x or later
- NPM or Yarn package manager
- OpenAI API key
- Serper API key (Google Search API)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/wine-picker-next.git
   cd wine-picker-next
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SERPER_API_KEY=your_serper_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

The application can be easily deployed to platforms like Vercel, Netlify, or any other hosting service that supports Next.js:

```bash
npm run build
# or
yarn build
```

## Project Structure

- `/pages`: Page components and API routes
- `/components`: Reusable React components
- `/utils`: Utility functions and type definitions
- `/public`: Static assets
- `/styles`: Global styles

## API Routes

The application uses Next.js API routes to securely handle external API calls:

- `/api/analyze-wine`: Handles image analysis with OpenAI and fetches wine reviews

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key for image analysis |
| `SERPER_API_KEY` | Your Serper API key for web search functionality |

## License

This project is licensed under the MIT License - see the LICENSE file for details. 