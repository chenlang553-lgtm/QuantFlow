from sqlalchemy import Column, Float, Integer, String, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQL_ALCHEMY_DATABASE_URL = "sqlite:///./data/quantflow.db"

engine = create_engine(
    SQL_ALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class StrategyDB(Base):
    __tablename__ = "strategies"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    code = Column(Text, nullable=False)
    status = Column(String, default="STOPPED")
    schedule_start = Column(String, default="00:00")
    schedule_end = Column(String, default="23:59")
    pnl_day = Column(Float, default=0.0)


class LogDB(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    strategy_id = Column(String, index=True)
    timestamp = Column(String)
    level = Column(String)
    message = Column(String)


class SettingsDB(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True)
    value = Column(Text)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
