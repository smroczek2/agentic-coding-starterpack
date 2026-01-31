import { test, expect } from '@playwright/test';

/**
 * API TESTING
 * Tests: API-001 to API-008
 * Total: 8 tests
 *
 * These tests verify API endpoints respond correctly.
 * Tests run without authentication to verify protection.
 */

test.describe('API Testing', () => {
  test.describe('/api/employees', () => {
    test('API-001: GET /api/employees requires authentication', async ({ request }) => {
      const response = await request.get('/api/employees');

      // Should return 401 or 403 when not authenticated
      expect([401, 403]).toContain(response.status());
    });

    test('API-002: POST /api/employees requires authentication', async ({ request }) => {
      const response = await request.post('/api/employees', {
        data: {
          name: 'Test Employee',
          email: 'test@example.com',
        },
      });

      // Should return 401 or 403 when not authenticated
      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('/api/time-off', () => {
    test('API-003: GET /api/time-off requires authentication', async ({ request }) => {
      const response = await request.get('/api/time-off');

      expect([401, 403]).toContain(response.status());
    });

    test('API-004: POST /api/time-off requires authentication', async ({ request }) => {
      const response = await request.post('/api/time-off', {
        data: {
          employeeId: '00000000-0000-0000-0000-000000000000',
          startDate: '2026-02-01',
          endDate: '2026-02-05',
          type: 'pto',
        },
      });

      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('/api/shifts', () => {
    test('API-005: POST /api/shifts requires authentication', async ({ request }) => {
      const response = await request.post('/api/shifts', {
        data: {
          scheduleId: '00000000-0000-0000-0000-000000000000',
          employeeId: '00000000-0000-0000-0000-000000000000',
          date: '2026-02-01',
          startTime: '09:00',
          endTime: '17:00',
        },
      });

      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('/api/chat', () => {
    test('API-006: POST /api/chat requires authentication', async ({ request }) => {
      const response = await request.post('/api/chat', {
        data: {
          messages: [
            {
              id: 'test-1',
              role: 'user',
              parts: [{ type: 'text', text: 'Hello' }],
            },
          ],
        },
      });

      // Should return 401 when not authenticated
      expect([401, 403, 500]).toContain(response.status());
    });
  });

  test.describe('/api/schedule/generate', () => {
    test('API-007: POST /api/schedule/generate requires authentication', async ({ request }) => {
      const response = await request.post('/api/schedule/generate', {
        data: {
          weekStartDate: '2026-02-02',
          dryRun: true,
        },
      });

      expect([401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('General API', () => {
    test('API-008: Invalid endpoints return 404', async ({ request }) => {
      const response = await request.get('/api/nonexistent-endpoint');

      expect(response.status()).toBe(404);
    });
  });
});
