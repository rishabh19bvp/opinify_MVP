# Opinify

A location-based social platform for community engagement through polls, news, and discussions.

## Project Structure

```
opinify/
├── api/                  # Backend Express.js server
│   └── src/              # Server source code
├── app/                  # Expo Router app directory
│   └── (tabs)/           # Main application tabs
├── assets/               # Static assets
├── components/           # Reusable UI components
├── constants/            # Application constants
├── docs/                 # Project documentation
├── hooks/                # Custom React hooks
├── mobile/               # Mobile-specific code
│   └── src/              # Mobile source code
├── services/             # Shared service interfaces
├── store/                # Zustand state management
│   └── slices/           # State slices by domain
└── types/                # TypeScript type definitions
```

## Prerequisites

- Node.js v16+
- MongoDB
- Expo CLI
- Git

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```

4. Build and start the server:
   ```bash
   npm run build
   npm start
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## Testing

Run tests with:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test:watch
```

## Development

The project follows a modular architecture with clear separation between frontend and backend components. Each major feature is implemented as a separate module with its own tests and documentation.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
