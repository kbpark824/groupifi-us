# Groupifi Us

Groupifi Us is a web-based application that automates the process of organizing large groups of people into smaller groups intelligently. The system addresses the common problem faced by coordinators of recurring group-based activities who waste time manually forming groups, re-drawing when rules are violated, and trying to remember past combinations.

## Features

- **Anonymous Group Generation** - Quick one-time group creation without signup
- **User Authentication** - Email/password and Google OAuth support
- **Saved Group Lists** - Manage reusable participant lists
- **Smart Constraints** - Define rules for who should/shouldn't be grouped together
- **Historical Avoidance** - Prevent repetitive pairings across sessions
- **Mobile Responsive** - Works seamlessly on all devices

## Tech Stack

- **Frontend:** React.js 18+ with TypeScript and Tailwind CSS
- **Backend:** PocketBase for authentication and database
- **Deployment:** Render with custom domain (groupifi.us)
- **CI/CD:** GitHub Actions with dual environment setup

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd groupifi-us

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run format       # Format code with Prettier
```

## Deployment

This project uses GitHub Flow with automatic development deployments and manual production deployments.

### Environments

- **Development:** Auto-deploys on push to `main` branch
- **Production:** Manual deployment via GitHub Actions

### GitHub Repository Setup

For complete GitHub repository configuration including branch protection, environments, and CI/CD setup, see [GITHUB_SETUP.md](./GITHUB_SETUP.md).

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── groups/          # Group management components
│   ├── layout/          # Layout and navigation
│   └── ui/              # Generic UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
├── pages/               # Page components
├── types/               # TypeScript definitions
└── contexts/            # React Context providers
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass: `npm run test`
4. Ensure code quality: `npm run lint && npm run type-check`
5. Create a pull request

All pull requests require approval and passing status checks before merging.

## License

This project is private and proprietary.
