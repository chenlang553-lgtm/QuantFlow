import json
import os
import uuid
from typing import Dict, List, Optional

import uvicorn
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import LogDB, SessionLocal, SettingsDB, StrategyDB, init_db
from trader_engine import engine_manager

app = FastAPI(title="QuantFlow Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("data", exist_ok=True)
init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class StrategyCreate(BaseModel):
    name: str
    description: str = ""
    code: str
    scheduleStart: str
    scheduleEnd: str


class SettingsUpdate(BaseModel):
    exchange: Dict[str, Optional[str]]
    risk: Dict[str, Optional[float]]
    notifications: Dict[str, Optional[str]]


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/strategies")
def get_strategies(db: Session = Depends(get_db)) -> List[Dict[str, object]]:
    strategies = db.query(StrategyDB).all()
    results: List[Dict[str, object]] = []
    for strat in strategies:
        logs = (
            db.query(LogDB)
            .filter(LogDB.strategy_id == strat.id)
            .order_by(LogDB.id.desc())
            .limit(50)
            .all()
        )
        results.append(
            {
                "id": strat.id,
                "name": strat.name,
                "description": strat.description or "",
                "code": strat.code,
                "status": strat.status,
                "scheduleStart": strat.schedule_start,
                "scheduleEnd": strat.schedule_end,
                "pnlDay": strat.pnl_day,
                "logs": [
                    {
                        "id": str(log.id),
                        "timestamp": log.timestamp,
                        "level": log.level,
                        "message": log.message,
                    }
                    for log in logs
                ],
            }
        )
    return results


@app.post("/api/strategies")
def create_strategy(strat: StrategyCreate, db: Session = Depends(get_db)) -> Dict[str, object]:
    new_id = str(uuid.uuid4())
    db_strat = StrategyDB(
        id=new_id,
        name=strat.name,
        description=strat.description,
        code=strat.code,
        schedule_start=strat.scheduleStart,
        schedule_end=strat.scheduleEnd,
    )
    db.add(db_strat)
    db.commit()
    db.refresh(db_strat)
    return {
        "id": db_strat.id,
        "name": db_strat.name,
        "description": db_strat.description or "",
        "code": db_strat.code,
        "status": db_strat.status,
        "scheduleStart": db_strat.schedule_start,
        "scheduleEnd": db_strat.schedule_end,
        "pnlDay": db_strat.pnl_day,
        "logs": [],
    }


@app.put("/api/strategies/{strategy_id}/status")
def update_status(
    strategy_id: str, payload: Dict[str, str], db: Session = Depends(get_db)
) -> Dict[str, str]:
    strategy = db.query(StrategyDB).filter(StrategyDB.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing status field")

    strategy.status = new_status
    db.commit()

    settings_entry = db.query(SettingsDB).filter(SettingsDB.key == "global_config").first()
    config = json.loads(settings_entry.value) if settings_entry else {}
    exchange_config = config.get("exchange", {}) if isinstance(config, dict) else {}

    if new_status == "RUNNING":
        engine_manager.start_strategy(strategy, exchange_config)
    else:
        engine_manager.stop_strategy(strategy_id)

    return {"status": "success"}


@app.delete("/api/strategies/{strategy_id}")
def delete_strategy(strategy_id: str, db: Session = Depends(get_db)) -> Dict[str, str]:
    engine_manager.stop_strategy(strategy_id)
    db.query(StrategyDB).filter(StrategyDB.id == strategy_id).delete()
    db.query(LogDB).filter(LogDB.strategy_id == strategy_id).delete()
    db.commit()
    return {"status": "deleted"}


@app.post("/api/settings")
def save_settings(settings: SettingsUpdate, db: Session = Depends(get_db)) -> Dict[str, str]:
    settings_entry = db.query(SettingsDB).filter(SettingsDB.key == "global_config").first()
    settings_json = json.dumps(settings.model_dump())
    if not settings_entry:
        settings_entry = SettingsDB(key="global_config", value=settings_json)
        db.add(settings_entry)
    else:
        settings_entry.value = settings_json
    db.commit()
    return {"status": "saved"}


@app.get("/api/account")
def get_account(db: Session = Depends(get_db)) -> Dict[str, object]:
    # Try to use cached account info if available in settings (for offline demo)
    settings_entry = db.query(SettingsDB).filter(SettingsDB.key == "global_config").first()
    config = json.loads(settings_entry.value) if settings_entry else {}
    exchange_config = config.get("exchange", {}) if isinstance(config, dict) else {}

    try:
        import ccxt

        if exchange_config.get("apiKey") and exchange_config.get("secretKey"):
            exchange = ccxt.binanceusdm(
                {
                    "apiKey": exchange_config.get("apiKey"),
                    "secret": exchange_config.get("secretKey"),
                    "enableRateLimit": True,
                    "options": {"defaultType": "future"},
                }
            )
            if exchange_config.get("isTestnet"):
                exchange.set_sandbox_mode(True)
            balance = exchange.fetch_balance(params={"type": "future"})
            total_balance = balance.get("total", {}).get("USDT", 0)
            free_balance = balance.get("free", {}).get("USDT", 0)
            return {
                "totalBalance": total_balance,
                "unrealizedPnL": 0,
                "marginBalance": total_balance,
                "availableBalance": free_balance,
                "maintenanceMargin": 0,
                "positions": [],
            }
    except Exception:
        pass

    return {
        "totalBalance": 0,
        "unrealizedPnL": 0,
        "marginBalance": 0,
        "availableBalance": 0,
        "maintenanceMargin": 0,
        "positions": [],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
