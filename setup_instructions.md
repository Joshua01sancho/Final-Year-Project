# E-Voting System Setup Instructions

## 1. Environment Configuration

Create a `.env` file in the backend directory with the following content:

```bash
# Django Settings
SECRET_KEY=django-insecure-e-voting-system-2024-secure-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database Settings (PostgreSQL)
DB_NAME=evoting
DB_USER=postgres
DB_PASSWORD=evoting_password_2024
DB_HOST=localhost
DB_PORT=5432

# Redis Settings
REDIS_URL=redis://localhost:6379/0

# Azure Face API Settings
AZURE_FACE_API_KEY=your-azure-face-api-key-here
AZURE_FACE_ENDPOINT=https://your-region.api.cognitive.microsoft.com/

# Blockchain Settings (Ethereum/Ganache)
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
BLOCKCHAIN_PRIVATE_KEY=your-private-key-here

# Security Settings
PAILLIER_KEY_SIZE=2048
PAILLIER_THRESHOLD=3

# Email Settings (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# File Upload Settings
MAX_UPLOAD_SIZE=10485760  # 10MB
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif

# Rate Limiting
RATE_LIMIT_AUTH=5  # requests per 5 minutes
RATE_LIMIT_VOTE=1  # vote per hour per election
RATE_LIMIT_API=100  # requests per hour
```

## 2. Database Setup (PostgreSQL)

### Install PostgreSQL:

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the postgres user

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE evoting;
CREATE USER evoting_user WITH PASSWORD 'evoting_password_2024';
GRANT ALL PRIVILEGES ON DATABASE evoting TO evoting_user;
\q
```

## 3. Azure Face API Setup

1. Go to Azure Portal: https://portal.azure.com
2. Create a new "Face" resource
3. Get your API key and endpoint URL
4. Update the `.env` file with your credentials

## 4. Blockchain Network Setup

### Option A: Local Development (Ganache)
```bash
# Install Ganache
npm install -g ganache-cli

# Start local blockchain
ganache-cli --port 8545 --accounts 10 --defaultBalanceEther 1000
```

### Option B: Test Network (Sepolia)
1. Get test ETH from a faucet
2. Use MetaMask to connect to Sepolia network
3. Update `.env` with your wallet private key

## 5. Install Dependencies and Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic

# Run the development server
python manage.py runserver
```

## 6. Initial Configuration

### Create User Groups:
```python
python manage.py shell

from django.contrib.auth.models import Group
Group.objects.get_or_create(name='ElectionManagers')
Group.objects.get_or_create(name='Voters')
```

### Test the Setup:
1. Visit: http://localhost:8000/admin
2. Login with your superuser credentials
3. Create a test election
4. Test the API endpoints

## 7. Security Enhancements

### Update SECRET_KEY:
```python
import secrets
print(secrets.token_urlsafe(50))
```

### Configure HTTPS (Production):
1. Get SSL certificate
2. Update ALLOWED_HOSTS
3. Set DEBUG=False
4. Configure Nginx with SSL

## 8. Customization

### Add Custom Fields to Models:
Edit the model files in `apps/elections/models.py` and `apps/voters/models.py`

### Add Business Logic:
Implement custom logic in the view files

### Add Validation:
Enhance validators in `utils/validators.py`

## 9. Production Deployment

### Using Docker:
```bash
cd deployment
docker-compose up -d
```

### Manual Deployment:
1. Set up production server
2. Install dependencies
3. Configure Nginx
4. Set up SSL certificates
5. Configure backups

## 10. Monitoring and Maintenance

### Logs:
- Check Django logs: `logs/django.log`
- Check Nginx logs: `/var/log/nginx/`
- Monitor database performance

### Backups:
- Database: `pg_dump evoting > backup.sql`
- Media files: Regular file backups
- Configuration: Version control

## Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   - Check PostgreSQL is running
   - Verify credentials in `.env`
   - Check firewall settings

2. **Azure Face API Error:**
   - Verify API key and endpoint
   - Check network connectivity
   - Verify image format

3. **Blockchain Connection Error:**
   - Check RPC URL
   - Verify network connectivity
   - Check private key format

4. **Import Errors:**
   - Install missing dependencies
   - Check Python version (3.11+)
   - Verify virtual environment

### Support:
- Check Django documentation
- Review error logs
- Test individual components 