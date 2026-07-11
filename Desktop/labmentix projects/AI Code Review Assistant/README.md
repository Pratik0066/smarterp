# AI Code Review Assistant

A full-stack web application that helps developers improve code quality using AI and static code analysis.

## Tech Stack

- **Frontend:** React.js + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL + Sequelize ORM
- **Authentication:** JWT
- **AI Integration:** OpenAI API
- **Static Analysis:** Custom ESLint-like analyzer

## Features

- User authentication (signup, login, logout, profile management)
- Code snippet pasting with Monaco Editor
- File upload for source code analysis
- Static code analysis (syntax errors, unused variables, code style)
- AI-powered code review (bugs, code smells, improvements, security)
- Complexity analysis (cyclomatic complexity, lines of code, functions)
- Review history with search and filtering
- Interactive dashboard with charts

## Getting Started

```bash
# Install dependencies
npm run install:all

# Set up backend environment
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials and OpenAI API key

# Start development servers
npm run dev
```

## Environment Variables

See `backend/.env` for required configuration.

## Project Structure

```
AI Code Review Assistant/
├── backend/
│   ├── config/         # Database config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, validation
│   ├── models/        # Sequelize models
│   ├── routes/        # API routes
│   └── utils/         # Helper functions
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── context/    # React context
│   │   ├── pages/      # Page components
│   │   └── services/   # API services
│   └── ...
└── package.json
```
