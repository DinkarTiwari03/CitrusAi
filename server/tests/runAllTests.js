import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import request from 'supertest';
import { app } from '../src/app.js';
import { setupTestDatabase, teardownTestDatabase } from './testHelper.js';
import { aiService } from '../src/services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLE_IMAGE_PATH = path.resolve(__dirname, '../../citrus_project/black_spot-1.png');

let createdPredictionId = null;

async function runTests() {
  console.log('====================================================');
  console.log('CITRUS ADVISORY BACKEND (PHASE 2) TEST SUITE');
  console.log('====================================================\n');

  await setupTestDatabase();

  try {
    // -------------------------------------------------------------
    // TEST 1: GET /api/health
    // -------------------------------------------------------------
    console.log('[Test 1] GET /api/health');
    const healthRes = await request(app).get('/api/health');
    assert.strictEqual(healthRes.status, 200, `Expected 200, got ${healthRes.status}`);
    assert.strictEqual(healthRes.body.success, true);
    assert.strictEqual(healthRes.body.data.status, 'ok');
    assert.ok(healthRes.body.data.services.backend);
    assert.ok(healthRes.body.data.services.database);
    console.log('  ✓ Health endpoint returned status ok and service diagnostics\n');

    // -------------------------------------------------------------
    // TEST 2: 404 Route Not Found
    // -------------------------------------------------------------
    console.log('[Test 2] GET /api/nonexistent-route (404)');
    const notFoundRes = await request(app).get('/api/nonexistent-route');
    assert.strictEqual(notFoundRes.status, 404);
    assert.strictEqual(notFoundRes.body.success, false);
    console.log('  ✓ 404 catch-all returned structured error envelope\n');

    // -------------------------------------------------------------
    // TEST 3: POST /api/predictions/analyze without file
    // -------------------------------------------------------------
    console.log('[Test 3] POST /api/predictions/analyze without file (400)');
    const noFileRes = await request(app)
      .post('/api/predictions/analyze')
      .field('notes', 'testing without file');
    assert.strictEqual(noFileRes.status, 400);
    assert.strictEqual(noFileRes.body.success, false);
    assert.ok(noFileRes.body.message.includes('Image file is required'));
    console.log('  ✓ Missing file rejected with 400 Bad Request\n');

    // -------------------------------------------------------------
    // TEST 4: POST /api/predictions/analyze with invalid MIME type
    // -------------------------------------------------------------
    console.log('[Test 4] POST /api/predictions/analyze with text file (415)');
    const invalidMimeRes = await request(app)
      .post('/api/predictions/analyze')
      .attach('image', Buffer.from('plain text content'), 'sample.txt');
    assert.strictEqual(invalidMimeRes.status, 415);
    assert.strictEqual(invalidMimeRes.body.success, false);
    assert.ok(invalidMimeRes.body.message.includes('Unsupported file format'));
    console.log('  ✓ Invalid MIME type rejected with 415 Unsupported Media Type\n');

    // -------------------------------------------------------------
    // TEST 5: Check AI service status for end-to-end test
    // -------------------------------------------------------------
    console.log('[Test 5] Checking upstream Python FastAPI service at:', aiService.apiUrl);
    const isAiOnline = await aiService.checkHealth();

    if (!isAiOnline) {
      console.warn('  ⚠️ Upstream Python AI API is offline at', aiService.apiUrl);
      console.warn('  ⚠️ Testing upstream unavailable error handling (503)...');

      const mockBuffer = fs.existsSync(SAMPLE_IMAGE_PATH)
        ? fs.readFileSync(SAMPLE_IMAGE_PATH)
        : Buffer.from([0x89, 0x50, 0x4e, 0x47]); // dummy png header

      const e2eFailRes = await request(app)
        .post('/api/predictions/analyze')
        .attach('image', mockBuffer, 'leaf.png');

      assert.strictEqual(e2eFailRes.status, 503);
      assert.strictEqual(e2eFailRes.body.success, false);
      assert.ok(e2eFailRes.body.message.includes('Python AI API is unavailable'));
      console.log('  ✓ Upstream unavailable error handled gracefully with 503\n');
    } else {
      console.log('  ✓ Python AI API is online! Running live end-to-end prediction test...');
      assert.ok(fs.existsSync(SAMPLE_IMAGE_PATH), `Sample image not found at ${SAMPLE_IMAGE_PATH}`);

      const analyzeRes = await request(app)
        .post('/api/predictions/analyze')
        .attach('image', SAMPLE_IMAGE_PATH);

      assert.strictEqual(analyzeRes.status, 201, `Expected 201, got ${analyzeRes.status}: ${JSON.stringify(analyzeRes.body)}`);
      assert.strictEqual(analyzeRes.body.success, true);
      const prediction = analyzeRes.body.data;

      assert.ok(prediction._id, 'Missing generated MongoDB _id');
      assert.ok(['Black spot', 'Melanose', 'canker', 'greening', 'healthy'].includes(prediction.disease));
      assert.ok(prediction.confidence > 0 && prediction.confidence <= 100);
      assert.ok(['Mild', 'Moderate', 'Severe', 'Critical', 'Unknown'].includes(prediction.severity));
      assert.ok(typeof prediction.affectedArea === 'number');
      assert.ok(Array.isArray(prediction.recommendations));
      assert.ok(prediction.recommendations.length > 0);
      assert.ok(Array.isArray(prediction.localSources));
      assert.ok(Array.isArray(prediction.webSources));
      assert.ok(prediction.advisory.length > 0);
      assert.ok(prediction.imageReference.originalName);

      createdPredictionId = prediction._id;

      console.log('  ✓ End-to-End Prediction completed & persisted in MongoDB:');
      console.log(`    ID: ${prediction._id}`);
      console.log(`    Disease: ${prediction.disease} (${prediction.confidence}%)`);
      console.log(`    Severity: ${prediction.severity} (${prediction.affectedArea}%)`);
      console.log(`    Priority: ${prediction.priority}`);
      console.log(`    Recommendations count: ${prediction.recommendations.length}`);
      console.log(`    Local Sources count: ${prediction.localSources.length}`);
      console.log(`    Web Sources count: ${prediction.webSources.length}\n`);
    }

    // -------------------------------------------------------------
    // TEST 6: GET /api/predictions (list history)
    // -------------------------------------------------------------
    console.log('[Test 6] GET /api/predictions (list)');
    const listRes = await request(app).get('/api/predictions');
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.success, true);
    assert.ok(Array.isArray(listRes.body.data.predictions));
    assert.ok(listRes.body.data.pagination);
    assert.strictEqual(listRes.body.data.pagination.page, 1);
    console.log(`  ✓ Retrieved ${listRes.body.data.predictions.length} historical predictions with pagination\n`);

    // -------------------------------------------------------------
    // TEST 7: GET /api/predictions/:id
    // -------------------------------------------------------------
    if (createdPredictionId) {
      console.log(`[Test 7a] GET /api/predictions/${createdPredictionId} (valid ID)`);
      const getByIdRes = await request(app).get(`/api/predictions/${createdPredictionId}`);
      assert.strictEqual(getByIdRes.status, 200);
      assert.strictEqual(getByIdRes.body.success, true);
      assert.strictEqual(getByIdRes.body.data._id, createdPredictionId);
      console.log('  ✓ Retrieved exact prediction document from MongoDB\n');
    }

    console.log('[Test 7b] GET /api/predictions/507f1f77bcf86cd799439011 (non-existent ID)');
    const notFoundIdRes = await request(app).get('/api/predictions/507f1f77bcf86cd799439011');
    assert.strictEqual(notFoundIdRes.status, 404);
    assert.strictEqual(notFoundIdRes.body.success, false);
    console.log('  ✓ Non-existent ID returned 404 Not Found\n');

    console.log('[Test 7c] GET /api/predictions/invalid-id-format (malformed ID)');
    const invalidIdRes = await request(app).get('/api/predictions/invalid-id-format');
    assert.strictEqual(invalidIdRes.status, 400);
    assert.strictEqual(invalidIdRes.body.success, false);
    console.log('  ✓ Malformed ID returned 400 Bad Request\n');

    // -------------------------------------------------------------
    // TEST 8: GET /api/predictions/stats
    // -------------------------------------------------------------
    console.log('[Test 8] GET /api/predictions/stats');
    const statsRes = await request(app).get('/api/predictions/stats');
    assert.strictEqual(statsRes.status, 200, `Expected 200, got ${statsRes.status}`);
    assert.strictEqual(statsRes.body.success, true);
    assert.ok(typeof statsRes.body.data.total === 'number');
    assert.ok(Array.isArray(statsRes.body.data.diseaseDistribution));
    assert.ok(Array.isArray(statsRes.body.data.severityDistribution));
    assert.ok(Array.isArray(statsRes.body.data.priorityDistribution));
    assert.ok(statsRes.body.data.confidenceStats);
    assert.ok(Array.isArray(statsRes.body.data.recentAnalyses));
    console.log(`  ✓ Aggregated stats returned: total=${statsRes.body.data.total}, diseases=${statsRes.body.data.diseaseDistribution.length}\n`);

    // -------------------------------------------------------------
    // TEST 9: Search, filter & sort on /api/predictions
    // -------------------------------------------------------------
    console.log('[Test 9] GET /api/predictions with search, priority filter, and sorting');
    const filteredRes = await request(app)
      .get('/api/predictions')
      .query({ search: 'canker', priority: 'HIGH', sortBy: 'confidence', order: 'desc' });
    assert.strictEqual(filteredRes.status, 200);
    assert.strictEqual(filteredRes.body.success, true);
    assert.ok(Array.isArray(filteredRes.body.data.predictions));
    console.log('  ✓ Search, priority filter and sorting handled cleanly\n');

    console.log('====================================================');
    console.log('ALL PHASE 2 & 4 BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } finally {
    await teardownTestDatabase();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
