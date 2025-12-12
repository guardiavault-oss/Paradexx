#!/usr/bin/env tsx
/**
 * Get Test Auth Token
 * Creates a test user and returns an auth token for testing
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function getTestToken() {
    try {
        // Create test user
        const email = `test_${Date.now()}@paradex.test`;
        const password = 'TestPassword123!';
        
        console.log('Creating test user...');
        const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, {
            email,
            password,
            username: `testuser_${Date.now()}`,
        });

        if (registerResponse.data.token) {
            console.log('✅ Test user created and token obtained!');
            console.log(`Token: ${registerResponse.data.token}`);
            return registerResponse.data.token;
        }

        // If registration didn't return token, try login
        console.log('Trying to login...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email,
            password,
        });

        if (loginResponse.data.token || loginResponse.data.session?.token) {
            const token = loginResponse.data.token || loginResponse.data.session?.token;
            console.log('✅ Login successful!');
            console.log(`Token: ${token}`);
            return token;
        }

        throw new Error('Could not obtain token');
    } catch (error: any) {
        if (error.response?.status === 409) {
            // User already exists, try login
            console.log('User already exists, trying login...');
            try {
                const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                    email: 'test@paradex.test',
                    password: 'TestPassword123!',
                });
                const token = loginResponse.data.token || loginResponse.data.session?.token;
                if (token) {
                    console.log('✅ Login successful!');
                    console.log(`Token: ${token}`);
                    return token;
                }
            } catch (loginError) {
                console.error('Login failed:', loginError);
            }
        }
        console.error('Error getting test token:', error.message);
        console.error('Response:', error.response?.data);
        return null;
    }
}

getTestToken().then(token => {
    if (token) {
        console.log('\n✅ Use this token for testing:');
        console.log(`export AUTH_TOKEN=${token}`);
        process.exit(0);
    } else {
        console.log('\n❌ Failed to get token');
        process.exit(1);
    }
});

