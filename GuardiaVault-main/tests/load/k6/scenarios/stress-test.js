/**
 * K6 Stress Test for GuardiaVault
 * Gradually increases load to find system breaking point
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50 users
    { duration: '5m', target: 50 },    // Stay at 50 for 5 minutes
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 for 5 minutes
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 for 5 minutes
    { duration: '2m', target: 500 },   // Ramp up to 500 users (stress)
    { duration: '5m', target: 500 },   // Stay at 500 for 5 minutes
    { duration: '5m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.15'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Test various endpoints under stress
  const endpoints = [
    { url: '/api/health', method: 'GET', name: 'Health' },
    { url: '/api/vaults', method: 'GET', name: 'GetVaults', auth: true },
    { url: '/api/guardians', method: 'GET', name: 'GetGuardians', auth: true },
  ];

  // Random endpoint selection
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  let response;
  const headers = { 'Content-Type': 'application/json' };

  // Add auth if needed (simplified - in real test you'd maintain sessions)
  if (endpoint.auth) {
    headers.Authorization = 'Bearer test-token';
  }

  if (endpoint.method === 'GET') {
    response = http.get(`${BASE_URL}${endpoint.url}`, {
      headers,
      tags: { name: endpoint.name },
    });
  }

  const success = check(response, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'response time acceptable': (r) => r.timings.duration < 2000,
  });

  apiDuration.add(response.timings.duration);
  errorRate.add(!success);

  sleep(Math.random() * 3 + 1); // Random think time 1-4 seconds
}
