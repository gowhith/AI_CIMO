def _make_service(client, headers):
    return client.post(
        "/api/v1/services",
        json={"name": "payment-service", "error_threshold": 3, "window_seconds": 60},
        headers=headers,
    ).json()


def test_ingest_log_and_search(client, admin_headers):
    svc = _make_service(client, admin_headers)
    sid = svc["id"]

    r = client.post(
        "/api/v1/logs",
        json={"service_id": sid, "level": "ERROR", "message": "DB connection timeout"},
    )
    assert r.status_code == 201

    r = client.get(
        "/api/v1/logs",
        params={"service_id": sid, "level": "ERROR"},
        headers=admin_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert "timeout" in data[0]["message"]


def test_create_incident_generates_ai_summary(client, admin_headers):
    svc = _make_service(client, admin_headers)
    sid = svc["id"]

    for _ in range(4):
        client.post(
            "/api/v1/logs",
            json={"service_id": sid, "level": "ERROR", "message": "Database connection pool exhausted"},
        )

    r = client.post(
        "/api/v1/incidents",
        json={"service_id": sid, "title": "DB pool exhausted", "severity": "critical"},
        headers=admin_headers,
    )
    assert r.status_code == 201
    iid = r.json()["id"]

    # Stub RCA should have fired synchronously on creation.
    r = client.get(f"/api/v1/incidents/{iid}/summary", headers=admin_headers)
    assert r.status_code == 200
    summary = r.json()
    assert summary["incident_id"] == iid
    assert "database" in summary["possible_root_cause"].lower()
    assert summary["model_used"]


def test_dashboard_summary_aggregates(client, admin_headers):
    _make_service(client, admin_headers)
    r = client.get("/api/v1/dashboard/summary", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["services_monitored"] == 1
    assert "open_incidents" in body
