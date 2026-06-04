from app.core.security import hash_password, verify_password


def test_password_hash_roundtrip():
    h = hash_password("hunter22")
    assert h != "hunter22"
    assert verify_password("hunter22", h) is True
    assert verify_password("wrong", h) is False


def test_password_long_input_is_truncated():
    long_pw = "x" * 200  # >72 bytes — would crash raw bcrypt
    h = hash_password(long_pw)
    assert verify_password(long_pw, h)
