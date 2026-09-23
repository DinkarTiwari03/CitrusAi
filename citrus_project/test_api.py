import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient

from api import app

client = TestClient(app)


def test_health_check():
    print("Testing GET /health...", flush=True)
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data.get("status") == "ok", f"Expected status 'ok', got {data}"
    print("✓ GET /health PASSED", flush=True)


def test_predict_missing_file():
    print("\nTesting POST /predict without file...", flush=True)
    response = client.post("/predict")
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    print("✓ POST /predict missing file PASSED", flush=True)


def test_predict_invalid_mime_type():
    print("\nTesting POST /predict with invalid MIME type...", flush=True)
    files = {"image": ("test.txt", b"Hello text", "text/plain")}
    response = client.post("/predict", files=files)
    assert response.status_code == 415, f"Expected 415, got {response.status_code}"
    print("✓ POST /predict invalid MIME type PASSED", flush=True)


def test_predict_corrupt_image():
    print("\nTesting POST /predict with corrupt image data...", flush=True)
    files = {"image": ("corrupt.png", b"not an image", "image/png")}
    response = client.post("/predict", files=files)
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    print("✓ POST /predict corrupt image PASSED", flush=True)


def test_predict_real_image():
    print("\nTesting POST /predict with real image (black_spot-1.png)...", flush=True)
    image_path = BASE_DIR / "black_spot-1.png"
    assert image_path.exists(), f"Sample test image not found at: {image_path}"

    with open(image_path, "rb") as img_file:
        files = {"image": ("black_spot-1.png", img_file, "image/png")}
        response = client.post("/predict", files=files)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()

    print("\n--- API RESPONSE SUMMARY ---", flush=True)
    print("Success:", data.get("success"), flush=True)
    print("Disease:", data.get("disease"), flush=True)
    print(f"Confidence: {data.get('confidence')}%", flush=True)
    print("Severity:", data.get("severity"), flush=True)
    print(f"Affected Area: {data.get('affectedArea')}%", flush=True)
    print(f"Leaf Pixels: {data.get('affectedPixels')} / {data.get('totalLeafPixels')}", flush=True)
    print("Priority:", data.get("priority"), flush=True)
    print("Recommendations count:", len(data.get("recommendations", [])), flush=True)
    print("Local sources count:", len(data.get("localSources", [])), flush=True)
    print("Web sources count:", len(data.get("webSources", [])), flush=True)

    # Assertions
    assert data.get("success") is True
    assert data.get("disease") in ["Black spot", "Melanose", "canker", "greening", "healthy"]
    assert isinstance(data.get("confidence"), (int, float)) and data.get("confidence") > 0
    assert data.get("severity") in ["Mild", "Moderate", "Severe", "Critical", "Unknown"]
    assert isinstance(data.get("affectedArea"), (int, float))
    assert isinstance(data.get("totalLeafPixels"), int)
    assert isinstance(data.get("affectedPixels"), int)
    assert data.get("priority") in ["LOW", "MEDIUM", "HIGH", "URGENT"]
    assert len(data.get("recommendations", [])) > 0
    assert isinstance(data.get("localSources"), list)
    assert isinstance(data.get("webSources"), list)
    assert len(data.get("advisory", "")) > 0

    print("✓ POST /predict real image PASSED", flush=True)


if __name__ == "__main__":
    print("=" * 60, flush=True)
    print("RUNNING CITRUS FASTAPI SUITE", flush=True)
    print("=" * 60, flush=True)
    with client:
        test_health_check()
        test_predict_missing_file()
        test_predict_invalid_mime_type()
        test_predict_corrupt_image()
        test_predict_real_image()
    print("\n" + "=" * 60, flush=True)
    print("ALL TESTS PASSED SUCCESSFULLY!", flush=True)
    print("=" * 60, flush=True)
