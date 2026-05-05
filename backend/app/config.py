from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Sales Avatar API"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    api_key_header: str = "X-API-Key"
    # Phase 1: optional shared secret for stub auth
    api_key: str | None = None

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o"
    assist_max_history_messages: int = 48
    assist_max_tool_rounds: int = 8

    # Phase 4 — streaming avatar providers
    avatar_provider: str = "auto"  # auto | mock | heygen | simli
    heygen_api_key: str | None = None
    heygen_avatar_name: str | None = None
    heygen_voice_id: str | None = None
    simli_api_key: str | None = None
    simli_face_id: str | None = None
    simli_token_url: str | None = None
    simli_model: str = "fasttalk"
    simli_max_session_length: int = 3600
    simli_max_idle_time: int = 300

    # Phase 5 — hardening (toggle off locally with RATE_LIMIT_ENABLED=false)
    rate_limit_enabled: bool = True
    rate_limit_default: str = "240/minute"
    rate_limit_assist: str = "30/minute"
    rate_limit_avatar_bootstrap: str = "45/minute"


settings = Settings()
