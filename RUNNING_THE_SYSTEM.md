# Running the E-Voting System

## 🚀 Complete System Status: READY FOR TESTING

Your E-Voting System is now fully functional with blockchain integration!

## 📋 Prerequisites

Make sure you have the following running:
- ✅ PostgreSQL database
- ✅ Ganache GUI (blockchain)
- ✅ Python 3.8+ with virtual environment
- ✅ Node.js 16+ with npm

## 🔧 Setup Instructions

### 1. Start the Backend (Django)

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (if not already active)
# On Windows:
venv\Scripts\activate

# Start Django server
python manage.py runserver
```

**Backend will be available at:** http://localhost:8000

### 2. Start the Frontend (Next.js)

```bash
# In a new terminal, navigate to project root
cd "E-Voting System"

# Install dependencies (if not already done)
npm install

# Start Next.js development server
npm run dev
```

**Frontend will be available at:** http://localhost:3000

### 3. Configure Environment

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp env.example .env.local
```

The `.env.local` file should contain:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BLOCKCHAIN_NETWORK_ID=5777
NEXT_PUBLIC_GANACHE_URL=http://localhost:7545
```

## 🗳️ How to Test the System

### 1. Access the System

1. **Frontend**: Visit http://localhost:3000
2. **Backend Admin**: Visit http://localhost:8000/admin
   - Username: `Joshua`
   - Email: `musukambalejoshua@gmail.com`
   - Password: (the one you set during setup)

### 2. Test Voting Process

1. **Navigate to an election**: Go to http://localhost:3000/user/vote/TEST_ELECTION_1
2. **Select a candidate**: Choose from the available candidates
3. **Submit vote**: Click "Submit Vote" to cast your vote on the blockchain
4. **Verify transaction**: Check Ganache to see the transaction

### 3. Verify Vote on Blockchain

1. **Get transaction hash**: From the voting confirmation
2. **Check Ganache**: View the transaction details
3. **Verify vote**: Use the API endpoint to verify vote integrity

## 🔗 API Endpoints

### Voting Endpoints
- `POST /api/elections/vote/` - Cast a vote
- `GET /api/elections/verify-vote/<vote_hash>/` - Verify a vote

### Example API Usage

```bash
# Cast a vote
curl -X POST http://localhost:8000/api/elections/vote/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "election_id": "TEST_ELECTION_1",
    "candidate_id": "1"
  }'

# Verify a vote
curl -X GET http://localhost:8000/api/elections/verify-vote/YOUR_VOTE_HASH/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Django        │    │   Ganache       │
│   Frontend      │◄──►│   Backend       │◄──►│   Blockchain    │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Port 7545)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Database      │
                       └─────────────────┘
```

## 🔒 Security Features

- ✅ **Blockchain Integration**: Immutable vote records
- ✅ **Encrypted Voting**: Votes are encrypted before blockchain storage
- ✅ **One Vote Per Voter**: Smart contract prevents double voting
- ✅ **Vote Verification**: Cryptographic proof of vote integrity
- ✅ **Authentication**: User authentication required for voting

## 🚨 Important Notes

1. **Private Keys**: Update the private keys in `backend/config/settings.py` with your actual Ganache keys
2. **Database**: The system uses PostgreSQL - ensure it's running
3. **Blockchain**: Ganache must be running for blockchain operations
4. **CORS**: The backend is configured to accept requests from the frontend

## 🐛 Troubleshooting

### Common Issues:

1. **"Election has not started"**: 
   - Check Ganache time settings
   - Use the time advancement script: `truffle exec scripts/advance_time.js`

2. **"Database connection failed"**:
   - Ensure PostgreSQL is running
   - Check database credentials in settings

3. **"Blockchain connection failed"**:
   - Ensure Ganache is running on port 7545
   - Check contract deployment

4. **"CORS errors"**:
   - Ensure both servers are running
   - Check API URL configuration

## 🎉 Ready for Production?

The system is ready for **development and testing**. For production deployment:

1. **Security**: Use environment variables for all sensitive data
2. **Database**: Use a production PostgreSQL instance
3. **Blockchain**: Deploy to a production blockchain (Ethereum mainnet, testnet, or private network)
4. **SSL**: Enable HTTPS for all communications
5. **Monitoring**: Add logging and monitoring
6. **Backup**: Implement database and blockchain backup strategies

## 📞 Support

If you encounter any issues:
1. Check the console logs for both frontend and backend
2. Verify all services are running
3. Check the blockchain transaction logs in Ganache
4. Review the Django admin panel for data consistency

**Your E-Voting System is now ready to host elections! 🗳️✨** 