/**
 * Test Backend Connection
 * Simple script to verify backend is working correctly
 */

const API_BASE_URL = 'http://localhost:8080/api';

async function testBackend() {
  console.log('🧪 Testing Backend Connection...\n');

  // Test 1: Check if backend is running
  console.log('1️⃣ Testing backend availability...');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });
    
    if (response.status === 400 || response.status === 401) {
      console.log('✅ Backend is running and responding\n');
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}\n`);
    }
  } catch (error) {
    console.error('❌ Backend is not accessible:', error.message);
    console.log('💡 Make sure to run: mvn spring-boot:run\n');
    return;
  }

  // Test 2: Register a test user
  console.log('2️⃣ Registering test user...');
  const testUser = {
    name: 'Test User',
    email: `test.${Date.now()}@example.com`, // Unique email
    password: 'password123',
  };

  try {
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful!');
      console.log('📝 User data:', {
        userId: registerData.userId,
        name: registerData.name,
        email: registerData.email,
        tokenLength: registerData.token?.length,
      });
      console.log('\n');

      // Test 3: Login with the registered user
      console.log('3️⃣ Testing login with registered user...');
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful!');
        console.log('🔐 Token received:', loginData.token.substring(0, 50) + '...');
        console.log('\n');

        // Test 4: Get current user with token
        console.log('4️⃣ Testing authenticated endpoint...');
        const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          console.log('✅ Authenticated request successful!');
          console.log('👤 Current user:', meData.name);
          console.log('\n');
          console.log('🎉 All tests passed! Backend is working correctly.\n');
        } else {
          console.error('❌ Authenticated request failed:', meResponse.status);
        }
      } else {
        const errorData = await loginResponse.json();
        console.error('❌ Login failed:', errorData);
      }
    } else {
      const errorData = await registerResponse.json();
      console.error('❌ Registration failed:', errorData);
      
      if (registerResponse.status === 400) {
        console.log('💡 Validation error - check if Firebase is configured correctly');
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testBackend().catch(console.error);
