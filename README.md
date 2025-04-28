# MyWine

AI-powered wine identification and rating app using OpenAI GPT-4o.

## Deployment Information

- **Production Site**: [MyWine App](https://pickmywine-live.web.app)
- **Latest Update**: April 2025 - Firebase deployment with GPT-4o API
- **Features**: Direct OpenAI integration with Firebase Functions
- **Documentation**: See the [docs](./docs) directory for detailed information

## Features

- Upload images of wine labels or menus
- AI-powered analysis using OpenAI's GPT-4o Vision API
- Display wine details, AI ratings, and AI-generated summaries
- Apple-inspired clean, responsive UI design
- Web snippets from real wine reviews

## Technologies

- **Next.js**: React framework with static export
- **TypeScript**: Static typing for better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Firebase**: Hosting, Functions, and Storage
- **OpenAI API**: For image analysis and wine identification
- **Serper API**: For fetching real wine reviews from the web

## Getting Started

### Prerequisites

- Node.js 14.x or later
- NPM or Yarn package manager
- Firebase CLI (`npm install -g firebase-tools`)
- OpenAI API key
- Serper API key (Google Search API)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/mywine.git
   cd mywine
   ```

2. Install dependencies:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env.local` and update with your API keys
   - Copy `functions/.env.example` to `functions/.env` and update

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

For deployment instructions, see [Deployment Guide](./docs/DEPLOYMENT.md).

### Quick Firebase Deployment

```bash
# Deploy to Firebase
./deploy-firebase.sh
```

## Project Structure

- `/pages`: Page components and API routes
- `/components`: Reusable React components
- `/utils`: Utility functions and type definitions
- `/public`: Static assets
- `/styles`: Global styles
- `/functions`: Firebase Cloud Functions
- `/tests`: Test files organized by category
- `/docs`: Project documentation

## Development

Please follow our [Branching Strategy](./docs/BRANCHING.md) and read our [Contributing Guide](./docs/CONTRIBUTING.md) before submitting pull requests.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key for image analysis |
| `SERPER_API_KEY` | Your Serper API key for web search functionality |
| `FIREBASE_*` | Firebase configuration variables |

## License

This project is licensed under the MIT License. 