// Debug script to test authentication flow
const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testAuthFlow() {
  console.log('=== Testing Authentication Flow ===');
  
  try {
    // 1. Test login
    console.log('\n1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login/`, {
      username: 'testuser',
      password: 'testpass123'
    });
    
    console.log('Login response:', {
      status: loginResponse.status,
      success: loginResponse.data.success,
      hasToken: !!loginResponse.data.data?.token,
      token: loginResponse.data.data?.token ? 'TOKEN_PRESENT' : 'NO_TOKEN'
    });
    
    if (loginResponse.data.data?.token) {
      const token = loginResponse.data.data.token;
      
      // 2. Test user/me endpoint with token
      console.log('\n2. Testing user/me endpoint...');
      const userResponse = await axios.get(`${API_BASE}/user/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('User/me response:', {
        status: userResponse.status,
        user: userResponse.data
      });
      
      // 3. Test vote endpoint with token
      console.log('\n3. Testing vote endpoint...');
      const voteResponse = await axios.post(`${API_BASE}/vote/`, {
        election_id: '5',
        candidate_id: '10'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Vote response:', {
        status: voteResponse.status,
        data: voteResponse.data
      });
      
    } else {
      console.log('❌ No token received from login');
    }
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testAuthFlow(); 