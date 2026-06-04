def test_admin_can_create_service(client, admin_headers):
    r = client.post(
        "/api/v1/services",
        json={"name": "payment", "error_threshold": 3, "window_seconds": 60},
        headers=admin_headers,
    )
    assert r.status_code == 201, r.text
    assert r.json()["name"] == "payment"


def test_engineer_cannot_create_service(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "e@e.com", "password": "password123", "role": "engineer"},
    )
    tok = client.post(
        "/api/v1/auth/login", json={"email": "e@e.com", "password": "password123"}
    ).json()["access_token"]
    r = client.post(
        "/api/v1/services",
        json={"name": "svc", "error_threshold": 3, "window_seconds": 60},
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert r.status_code == 403


def test_duplicate_service_rejected(client, admin_headers):
    body = {"name": "dup", "error_threshold": 5, "window_seconds": 60}
    client.post("/api/v1/services", json=body, headers=admin_headers)
    r = client.post("/api/v1/services", json=body, headers=admin_headers)
    assert r.status_code == 400
