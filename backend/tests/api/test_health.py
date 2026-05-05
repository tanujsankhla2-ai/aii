from starlette.testclient import TestClient


def test_health(client: TestClient):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
    assert "X-Request-ID" in res.headers
    assert len(res.headers["X-Request-ID"]) >= 8


def test_request_id_echo(client: TestClient):
    rid = "test-req-echo-123"
    res = client.get("/api/v1/health", headers={"x-request-id": rid})
    assert res.status_code == 200
    assert res.headers["X-Request-ID"] == rid
