# E-Voting System Backend

A secure, blockchain-integrated Django backend for electronic voting with biometric authentication, Paillier encryption, and threshold decryption.

## Features

- **Secure Authentication**: Face recognition, fingerprint, and 2FA
- **Homomorphic Encryption**: Paillier cryptosystem for vote privacy
- **Threshold Decryption**: Shamir's Secret Sharing for secure result decryption
- **Blockchain Integration**: Web3.py for vote verification
- **REST API**: Complete API for frontend integration
- **Admin Interface**: Django admin for election management
- **Audit Logging**: Comprehensive audit trail
- **Rate Limiting**: Protection against abuse

## Architecture

```
backend/
├── config/                  # Django settings and URLs
├── apps/
│   ├── elections/          # Election management
│   ├── voters/            # Voter management and biometric auth
│   ├── encryption/        # Paillier and Shamir cryptography
│   └── api/              # REST API endpoints
├── middleware/            # Audit and rate limiting
├── utils/                # Helper functions and validators
├── tests/                # Test suite
└── deployment/           # Docker and Nginx configs
```

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 13+
- Redis 6+
- Node.js (for blockchain)

### Installation

1. **Clone and setup**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Environment setup**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database setup**:
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

4. **Run development server**:
```bash
python manage.py runserver
```

### Docker Deployment

```bash
cd deployment
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/face-login/` - Face recognition login
- `POST /api/auth/fingerprint-login/` - Fingerprint login
- `POST /api/auth/2fa/` - 2FA verification
- `POST /api/auth/logout/` - Logout

### Elections
- `GET /api/elections/` - List elections
- `POST /api/elections/` - Create election
- `GET /api/elections/{id}/` - Get election details
- `GET /api/elections/{id}/results/` - Get election results
- `POST /api/elections/{id}/decrypt/` - Decrypt results

### Votes
- `POST /api/votes/` - Cast vote
- `GET /api/votes/` - List votes (admin)

### Admin
- `GET /api/admin/analytics/` - System analytics
- `GET /api/admin/users/` - User management
- `GET /api/admin/elections/` - Election management

## Security Features

### Paillier Encryption
- Homomorphic encryption for vote privacy
- Vote aggregation without revealing individual votes
- Threshold decryption for secure result release

### Biometric Authentication
- Azure Face API integration
- Fingerprint verification
- Two-factor authentication

### Blockchain Integration
- Vote verification on blockchain
- Immutable audit trail
- Smart contract integration

## Testing

```bash
# Run all tests
python manage.py test

# Run specific test suites
python manage.py test tests.test_elections
python manage.py test tests.test_voters
python manage.py test tests.test_encryption
```

## Deployment

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure PostgreSQL
- [ ] Set up Redis
- [ ] Configure Azure Face API
- [ ] Set up blockchain network
- [ ] Configure SSL/TLS
- [ ] Set up monitoring
- [ ] Configure backups

### Environment Variables

Required environment variables:
- `SECRET_KEY` - Django secret key
- `DB_*` - Database configuration
- `AZURE_FACE_API_KEY` - Azure Face API key
- `BLOCKCHAIN_*` - Blockchain configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License. 