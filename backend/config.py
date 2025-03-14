from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    BASE_DATA_PATH: str

    class Config:
        env_file = ".env"

settings = Settings() 