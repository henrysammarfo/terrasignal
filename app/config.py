"""Load settings from .env. All secrets and URLs live here."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Flock AI (required)
    FLOCK_API_KEY: str = ""
    FLOCK_MODEL: str = "qwen3-30b-a3b-instruct-2507"

    # Slack
    SLACK_WEBHOOK_URL: str = ""

    # Supabase webhook (for React dashboard)
    SUPABASE_WEBHOOK_URL: str = ""
    WEBHOOK_API_KEY: str = ""
    # Optional: UUID of auth user to attach agent-generated reports to (from Supabase Auth)
    SUPABASE_AGENT_USER_ID: str = ""

    # OpenClaw (optional)
    OPENCLAW_GATEWAY_URL: str = ""
    OPENCLAW_CHANNEL: str = "default"

    # Agent
    POLL_INTERVAL_MINUTES: int = 15
    MIN_RELEVANCE_SCORE: float = 0.65
    MAX_CLOUD_COVER: int = 20
    BASELINE_YEARS_BACK: int = 1
    # Use Planetary Computer Data API for Sentinel-2 (no rasterio). Set true on Windows if native stack crashes.
    USE_SENTINEL_DATA_API: str = ""

    @property
    def use_sentinel_data_api(self) -> bool:
        return self.USE_SENTINEL_DATA_API.lower() in ("1", "true", "yes")

    # Email (optional)
    SMTP_HOST: str = ""
    SMTP_PORT: str = "587"
    SMTP_USER: str = ""
    SMTP_PASS: str = ""


settings = Settings()
