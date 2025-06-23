# 🗳️ E-Voting System

A secure and modern electronic voting system built with a **Next.js** frontend, a **Django** backend, and **Blockchain** technology for vote integrity.

This project is currently under development. The following instructions will guide you through setting up and running the system in its current state.

---

## 🚀 Getting Started

Follow these steps to set up and run the E-Voting System on your local machine.

### Prerequisites

*   **Node.js** (v18 or later)
*   **Python** (v3.13 or later)
*   **PostgreSQL** (v12 or later)
*   **Truffle** (`npm install -g truffle`)
*   **Ganache** (a local blockchain environment, available at [Truffle's website](https://trufflesuite.com/ganache/))

---

### 1. Backend Setup

First, set up the Django backend, which handles the core logic, API, and database.

**a. Navigate to the backend directory:**
```bash
cd backend
```

**b. Create and activate a virtual environment:**
```bash
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate
```

**c. Install the required Python packages:**
```bash
pip install -r requirements.txt
```

**d. Configure your environment variables:**
Create a `.env` file in the `backend` directory. You can copy the template:
```bash
# (You might need to adjust this command based on your OS)
copy env_template.txt .env
```
Now, open the `backend/.env` file and fill in your actual credentials, especially for the database:
```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_NAME=evoting
DB_USER=postgres
DB_PASSWORD=your_actual_db_password
DB_HOST=localhost
DB_PORT=5433

# Blockchain (update this after deploying the contract)
BLOCKCHAIN_CONTRACT_ADDRESS=0x...
```

**e. Set up the database:**
Make sure your PostgreSQL server is running. Then, create the database tables:
```bash
python manage.py migrate
```

**f. Create a superuser:**
This will allow you to access the Django admin panel.
```bash
python manage.py createsuperuser
```
Follow the prompts to set your username and password.

---

### 2. Blockchain Setup

The system uses a local blockchain (Ganache) and a smart contract for vote immutability.

**a. Start Ganache:**
Open the Ganache application and start a new workspace. It should run on `http://127.0.0.1:7545` by default.

**b. Deploy the smart contract:**
In a **new terminal**, navigate to the **root directory** of the project and run the following Truffle commands:
```bash
# Compile the contract
truffle compile

# Deploy the contract to Ganache
truffle migrate
```
After deployment, Truffle will output a `contract address`. **Copy this address.**

**c. Update your `.env` file:**
Paste the new contract address into your `backend/.env` file:
```env
BLOCKCHAIN_CONTRACT_ADDRESS=THE_NEW_ADDRESS_YOU_COPIED
```

---

### 3. Frontend Setup

Now, set up the Next.js frontend.

**a. Navigate to the root directory.**

**b. Install the Node.js dependencies:**
```bash
npm install
```

**c. Configure your frontend environment:**
You may need to create a `.env.local` file in the root directory if specific frontend variables are required (e.g., the backend API URL).

---

## 🏁 Running the System

To run the full application, you need to start both the backend and frontend servers.

**a. Start the Backend Server:**
In your backend terminal (with the virtual environment activated), run:
```bash
python manage.py runserver
```
The backend should now be running at `http://127.0.0.1:8000`.

**b. Start the Frontend Server:**
In your frontend terminal (at the root directory), run:
```bash
npm run dev
```
The frontend should now be running at `http://localhost:3000`.

---

## 🧪 Running Tests

The project includes tests to ensure its components are working correctly.

**To run the encryption module tests:**
Make sure you are in the `backend` directory with your virtual environment activated.
```bash
python manage.py test apps.encryption
```

**To run all backend tests:**
```bash
python manage.py test
```

*(Note: Additional tests for other modules need to be refactored to be discoverable by the test runner.)*

---

## 🔧 Key Technologies

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS
*   **Backend:** Django, Django REST Framework, Python
*   **Database:** PostgreSQL
*   **Blockchain:** Ethereum (via Ganache), Solidity, Truffle
*   **Security:** Paillier Homomorphic Encryption

## 🌟 Features

### 🔐 Security & Authentication
- **Biometric Authentication**: Face recognition and fingerprint scanning
- **Two-Factor Authentication (2FA)**: SMS/Email verification
- **Multi-Factor Authentication**: Combined biometric + 2FA
- **Role-Based Access Control**: Voters, Election Managers, Admins
- **Rate Limiting**: Prevent abuse and brute force attacks

### 🗳️ Voting System
- **Multiple Election Types**: Single choice, multiple choice, ranked choice, approval voting
- **Encrypted Voting**: Paillier homomorphic encryption
- **Blockchain Integration**: Immutable vote records
- **Real-time Results**: Live vote counting and analytics
- **Vote Verification**: Cryptographic proof of vote integrity

### 🎨 User Experience
- **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS
- **Accessibility**: WCAG 2.1 compliant with screen reader support
- **Multi-language Support**: Internationalization (i18n)
- **Offline Support**: Progressive Web App (PWA) capabilities
- **Mobile Responsive**: Works on all devices

### 📊 Admin Features
- **Election Management**: Create, edit, and manage elections
- **Real-time Analytics**: Live dashboards and reporting
- **Audit Trails**: Complete activity logging
- **User Management**: Voter registration and verification
- **Result Management**: Secure result publication

### 🔧 Technical Features
- **Microservices Architecture**: Scalable and maintainable
- **API-First Design**: RESTful APIs with comprehensive documentation
- **Database Security**: PostgreSQL with encryption
- **Caching**: Redis for performance optimization
- **Monitoring**: Health checks and logging

## 🏗️ Architecture

```
E-Voting System
├── Frontend (Next.js + TypeScript)
│   ├── User Interface
│   ├── Authentication
│   ├── Voting Interface
│   └── Admin Dashboard
├── Backend (Django + Python)
│   ├── API Services
│   ├── Business Logic
│   ├── Security Validation
│   └── Database Models
├── Blockchain (Ethereum)
│   ├── Smart Contracts
│   ├── Vote Verification
│   └── Immutable Records
└── Infrastructure
    ├── PostgreSQL Database
    ├── Redis Cache
    ├── Azure Face API
    └── Deployment Services
```

## 📋 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=evoting
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Azure Face API
AZURE_FACE_API_KEY=your-azure-key
AZURE_FACE_ENDPOINT=your-azure-endpoint

# Blockchain
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_CONTRACT_ADDRESS=your-contract-address
BLOCKCHAIN_PRIVATE_KEY=your-private-key

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-app-password
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://localhost:8545
NEXT_PUBLIC_AZURE_FACE_ENDPOINT=your-azure-endpoint
```

## 🗄️ Database Schema

### Core Models

#### Elections
- `Election`: Main election entity
- `Candidate`: Election candidates
- `Vote`: Encrypted vote records
- `ElectionCategory`: Election categories

#### Users & Authentication
- `User`: Django user model
- `VoterProfile`: Extended voter information
- `BiometricData`: Biometric authentication data

#### Security & Audit
- `ElectionAuditLog`: Activity logging
- `SecurityEvent`: Security monitoring
- `RateLimit`: Rate limiting records

## 🔐 Security Features

### Encryption
- **Paillier Homomorphic Encryption**: Enables encrypted vote counting
- **Shamir's Secret Sharing**: Distributed key management
- **AES-256**: Data encryption at rest

### Authentication
- **Azure Face API**: Face recognition
- **Fingerprint Scanning**: Biometric authentication
- **TOTP 2FA**: Time-based one-time passwords
- **JWT Tokens**: Secure session management

### Blockchain Security
- **Smart Contract Verification**: Vote integrity
- **Immutable Records**: Tamper-proof voting
- **Decentralized Storage**: Distributed trust

## 📊 API Documentation

### Authentication Endpoints
```
POST /api/auth/login/          # User login
POST /api/auth/logout/         # User logout
POST /api/auth/register/       # User registration
POST /api/auth/2fa/verify/     # 2FA verification
POST /api/auth/biometric/      # Biometric authentication
```

### Election Endpoints
```
GET    /api/elections/         # List elections
POST   /api/elections/         # Create election
GET    /api/elections/{id}/    # Get election details
PUT    /api/elections/{id}/    # Update election
DELETE /api/elections/{id}/    # Delete election
```

### Voting Endpoints
```
POST   /api/votes/             # Cast vote
GET    /api/votes/{id}/        # Get vote details
GET    /api/elections/{id}/results/  # Get results
```

### Admin Endpoints
```
GET    /api/admin/analytics/   # Analytics data
GET    /api/admin/audit-logs/  # Audit trail
POST   /api/admin/elections/{id}/approve/  # Approve election
```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
```bash
# Backend coverage
coverage run --source='.' manage.py test
coverage report

# Frontend coverage
npm run test:coverage
```

## 🚀 Deployment

### Development
```bash
# Backend
cd backend
python manage.py runserver

# Frontend
cd frontend
npm run dev

# Blockchain
ganache-cli --port 8545
```

### Production

#### Using Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Manual Deployment
```bash
# Backend
cd backend
python manage.py collectstatic
gunicorn -c gunicorn.conf.py evoting.wsgi:application

# Frontend
cd frontend
npm run build
npm start
```

### Environment Setup
```bash
# Production environment
export DEBUG=False
export ALLOWED_HOSTS=your-domain.com
export DATABASE_URL=postgresql://user:pass@host:port/db
export REDIS_URL=redis://host:port
```

## 📈 Monitoring & Analytics

### Health Checks
- **API Health**: `/api/health/`
- **Database Health**: `/api/health/db/`
- **Redis Health**: `/api/health/cache/`
- **Blockchain Health**: `/api/health/blockchain/`

### Metrics
- **Vote Turnout**: Real-time participation rates
- **System Performance**: Response times and throughput
- **Security Events**: Authentication attempts and failures
- **Error Rates**: Application error monitoring

### Logging
- **Application Logs**: Django logging configuration
- **Access Logs**: Nginx access logs
- **Error Logs**: Error tracking and alerting
- **Audit Logs**: Security and compliance logging

## 🔧 Customization

### Adding New Election Types
1. Extend the `Election` model
2. Add business logic in `business_logic.py`
3. Update API serializers
4. Modify frontend components

### Custom Authentication
1. Implement custom authentication backend
2. Add authentication methods to `auth.py`
3. Update frontend authentication flow
4. Configure security settings

### Blockchain Integration
1. Deploy custom smart contracts
2. Update blockchain client configuration
3. Modify vote processing logic
4. Test integration thoroughly

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- **Python**: PEP 8, Black formatter
- **JavaScript**: ESLint, Prettier
- **TypeScript**: Strict mode enabled
- **Documentation**: Docstrings and comments

### Testing Requirements
- Unit tests for all new features
- Integration tests for API endpoints
- E2E tests for critical user flows
- Security tests for authentication

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guide](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)

### Community
- [GitHub Issues](https://github.com/your-username/e-voting-system/issues)
- [Discussions](https://github.com/your-username/e-voting-system/discussions)
- [Wiki](https://github.com/your-username/e-voting-system/wiki)

### Contact
- **Email**: support@evoting-system.com
- **Discord**: [Join our community](https://discord.gg/evoting)
- **Twitter**: [@EVotingSystem](https://twitter.com/EVotingSystem)

## 🙏 Acknowledgments

- **Django Team**: For the excellent web framework
- **Next.js Team**: For the React framework
- **Ethereum Foundation**: For blockchain technology
- **Azure Team**: For face recognition API
- **Open Source Community**: For all the amazing libraries

---

**Made with ❤️ for secure and transparent democracy** 