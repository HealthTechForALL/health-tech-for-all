<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# TypeScript + Express + Google Gemini Live API Project

This project is a real-time camera analysis system that uses Google Gemini Live API to identify and analyze health insurance cards and medicine notebooks.

## Key Technologies
- **Backend**: Express.js with TypeScript
- **Frontend**: Vue 3 + TypeScript + Vite
- **AI**: Google Gemini Live API (@google/generative-ai)
- **Camera**: WebRTC getUserMedia API

## Project Structure
- `src/server.ts` - Express server with Gemini API integration (backend only)
- `vue/` - Vue.js frontend directory
  - `vue/main.ts` - Frontend entry point
  - `vue/App.vue` - Main Vue application
  - `vue/components/` - Vue components
  - `vue/index.html` - HTML template
- Real-time image analysis for health insurance cards and medicine notebooks
- WebCamera integration for live capture

## Development Guidelines
- Use TypeScript for all backend code in `src/`
- Use Vue 3 + TypeScript for frontend code in `vue/`
- Follow REST API patterns for endpoints
- Implement proper error handling for camera and API operations
- Use environment variables for sensitive configuration
- Maintain responsive design for mobile and desktop
- API calls should only be triggered manually by button press, not automatically
