# AI Code Review Assistant

A full-stack web application that helps developers improve code quality using AI-powered reviews and static code analysis.

## Features

- **Code Submission** - Paste code snippets, upload files (drag-and-drop), or type directly in Monaco Editor
- **Static Analysis** - Detects bugs, security issues, code style violations, and more across JavaScript, Python, TypeScript, Java
- **AI Code Review** - Powered by OpenAI API for bug detection, code smells, performance tips, and refactoring suggestions
- **Complexity Analysis** - Cyclomatic complexity, function/class counts, maintainability scoring
- **Code Explanation** - AI-generated explanations of what your code does
- **Auto Documentation** - Generate JSDoc/docstrings automatically
- **Review Dashboard** - Interactive charts, score trends, language distribution
- **Review History** - Search, filter, sort, bulk delete, and JSON export
- **User Authentication** - JWT-based signup, login, profile management, password change

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Styling | Tailwind CSS |
| Code Editor | Monaco Editor |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Sequelize ORM |
| Auth | JWT (JSON Web Tokens) |
| AI | OpenAI API (gpt-3.5-turbo) |
| File Upload | Multer |
| Validation | Express Validator |
| Security | Helmet, Rate Limiting |

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- OpenAI API key (optional - mock reviews work without it)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/ai-code-review-assistant.git
cd ai-code-review-assistant

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Set up environment
cd ../backend
cp .env .env.example
# Edit .env with your PostgreSQL credentials and OpenAI API key
```

### Running the App

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
AI Code Review Assistant/
├── backend/
│   ├── config/
│   │   └── database.js          # Sequelize/PostgreSQL config
│   ├── controllers/
│   │   ├── aiController.js      # OpenAI integration + mock reviews
│   │   ├── analysisController.js # Static analysis engine
│   │   ├── authController.js    # JWT authentication
│   │   ├── projectController.js # Project CRUD
│   │   └── reviewController.js  # Review CRUD + stats
│   ├── middleware/
│   │   ├── auth.js              # JWT auth middleware
│   │   ├── upload.js            # Multer file upload config
│   │   └── validate.js          # Express validation rules
│   ├── models/
│   │   ├── User.js              # User model with bcrypt
│   │   ├── Project.js           # Project model
│   │   ├── Review.js            # Review model with JSON fields
│   │   └── ReviewFinding.js     # Individual findings/issues
│   ├── routes/
│   │   ├── authRoutes.js        # /api/auth/*
│   │   ├── projectRoutes.js     # /api/projects/*
│   │   ├── reviewRoutes.js      # /api/reviews/*
│   │   ├── analysisRoutes.js    # /api/analysis/*
│   │   ├── aiRoutes.js          # /api/ai/*
│   │   └── uploadRoutes.js      # /api/upload/*
│   ├── uploads/                 # Temporary file uploads
│   ├── utils/helpers.js         # Token generation utilities
│   └── server.js                # Express server entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx       # Responsive navigation
│       │   └── Footer.jsx       # App footer
│       ├── context/
│       │   └── AuthContext.jsx   # Auth state management
│       ├── pages/
│       │   ├── Login.jsx         # Login page
│       │   ├── Signup.jsx        # Registration page
│       │   ├── ForgotPassword.jsx # Password reset
│       │   ├── Dashboard.jsx     # Main dashboard with charts
│       │   ├── NewReview.jsx     # Code review editor
│       │   ├── ReviewDetail.jsx  # Full review report
│       │   ├── ReviewHistory.jsx # Searchable history
│       │   └── Profile.jsx       # User profile settings
│       └── services/
│           └── api.js           # Axios API client
├── package.json                  # Root scripts
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (auth required)
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset

### Code Review
- `POST /api/analysis/analyze` - Static code analysis
- `POST /api/ai/review` - AI-powered code review
- `POST /api/ai/explain` - Get code explanation
- `POST /api/ai/docs` - Generate documentation
- `POST /api/reviews/submit` - Submit a complete review
- `GET /api/reviews` - Get all reviews (with search/filter)
- `GET /api/reviews/:id` - Get review details
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/stats/overview` - Dashboard statistics

### File Upload
- `POST /api/upload/upload` - Upload source code file

## Environment Variables

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_code_review
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your_openai_api_key  # Optional
FRONTEND_URL=http://localhost:5173
```

## Database Schema

### Users
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | User's full name |
| email | String | Unique email |
| password | String | Bcrypt hashed |

### Projects
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to Users |
| project_name | String | Project name |
| github_url | String | Optional GitHub URL |

### Reviews
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK to Projects |
| review_type | Enum | snippet/file/repository |
| language | String | Programming language |
| code_snippet | Text | Source code |
| overall_score | Integer | 0-100 score |
| static_analysis | JSONB | Analysis results |
| ai_review | JSONB | AI review results |
| complexity | JSONB | Complexity metrics |

### Review Findings
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| review_id | UUID | FK to Reviews |
| severity | Enum | error/warning/info/suggestion |
| category | String | Issue category |
| issue | Text | Issue description |
| explanation | Text | Detailed explanation |
| suggested_fix | Text | How to fix |

## License

MIT
