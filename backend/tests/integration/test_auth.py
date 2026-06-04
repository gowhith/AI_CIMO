def test_register_and_login(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "a@b.com", "password": "password123", "role": "admin"},
    )
    assert r.status_code == 201
    assert r.json()["email"] == "a@b.com"

    r = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "password123"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password_401(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "a@b.com", "password": "password123", "role": "admin"},
    )
    r = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "WRONG"})
    assert r.status_code == 401


def test_duplicate_email_rejected(client):
    payload = {"email": "x@y.com", "password": "password123", "role": "engineer"}
    client.post("/api/v1/auth/register", json=payload)
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 400


def test_me_requires_token(client):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401
