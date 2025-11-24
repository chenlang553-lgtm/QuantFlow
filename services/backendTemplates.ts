
export const REQUIREMENTS_TXT = `
fastapi==0.109.0
uvicorn==0.27.0
ccxt==4.2.15
pydantic==2.6.0
sqlalchemy==2.0.25
python-dotenv==1.0.1
pandas==2.2.0
requests==2.31.0
`.trim();

export const DOCKERFILE = `
FROM python:3.10-slim

WORKDIR /app

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 创建数据库目录
RUN mkdir -p data

EXPOSE 8000

CMD ["python", "main.py"]
`.trim();

export const DATABASE_PY = `
from sqlalchemy import create_engine, Column, String, Integer, Float, Text, Boolean
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
    name = Column(String)
    description = Column(String, nullable=True)
    code = Column(Text)
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

def init_db():
    Base.metadata.create_all(bind=engine)
`.trim();

export const TRADER_ENGINE_PY = `
import threading
import time
import ccxt.pro as ccxt  # 推荐使用 ccxt.pro 支持 websocket，这里演示基础版
import traceback
import logging
from datetime import datetime
from database import SessionLocal, LogDB

# 配置日志
logger = logging.getLogger("Engine")

class StrategyRunner(threading.Thread):
    def __init__(self, strategy_data, api_key, secret_key, is_testnet):
        super().__init__()
        self.strategy_id = strategy_data.id
        self.code = strategy_data.code
        self.running = True
        self.api_key = api_key
        self.secret_key = secret_key
        self.is_testnet = is_testnet
        self._stop_event = threading.Event()
        
    def log(self, level, message):
        """记录日志到数据库"""
        db = SessionLocal()
        try:
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"[{level}] {message}")
            new_log = LogDB(
                strategy_id=self.strategy_id,
                timestamp=timestamp,
                level=level,
                message=str(message)
            )
            db.add(new_log)
            db.commit()
        except Exception as e:
            print(f"Logging error: {e}")
        finally:
            db.close()

    def run(self):
        self.log("INFO", "Starting Strategy Engine...")
        
        # 1. 初始化交易所
        try:
            exchange = ccxt.binanceusdm({
                'apiKey': self.api_key,
                'secret': self.secret_key,
                'timeout': 30000,
                'enableRateLimit': True
            })
            if self.is_testnet:
                exchange.set_sandbox_mode(True)
            
            # 测试连接
            exchange.load_markets()
            self.log("INFO", "Exchange connected successfully.")
        except Exception as e:
            self.log("ERROR", f"Exchange Connection Failed: {e}")
            self.running = False
            return

        # 2. 准备执行环境
        context = {
            'ccxt': ccxt,
            'exchange': exchange,
            'log': self.log,
            'sleep': time.sleep,
            'buy': lambda symbol, amt: self.place_order(exchange, symbol, 'buy', amt),
            'sell': lambda symbol, amt: self.place_order(exchange, symbol, 'sell', amt)
        }

        # 3. 预编译代码
        try:
            exec(self.code, context)
            if 'on_tick' not in context:
                self.log("ERROR", "No 'on_tick(data)' function found in code.")
                self.running = False
                return
            on_tick = context['on_tick']
        except Exception as e:
            self.log("ERROR", f"Code Compilation Failed: {traceback.format_exc()}")
            self.running = False
            return

        # 4. 主循环
        self.log("INFO", "Entering Event Loop...")
        while self.running and not self._stop_event.is_set():
            try:
                # 模拟获取数据，实际应获取K线
                # data = exchange.fetch_ohlcv('BTC/USDT', '1m', limit=100)
                # 简单起见，传递 ticker
                ticker = exchange.fetch_ticker('BTC/USDT') 
                
                # 执行用户逻辑
                on_tick(ticker)
                
                time.sleep(5) # 5秒一次轮询
            except Exception as e:
                self.log("ERROR", f"Runtime Error: {e}")
                time.sleep(5)

        self.log("INFO", "Strategy Stopped.")

    def stop(self):
        self.running = False
        self._stop_event.set()

    def place_order(self, exchange, symbol, side, amount):
        try:
            # 简单市价单
            order = exchange.create_order(symbol, 'market', side, amount)
            self.log("TRADE", f"{side.upper()} {symbol} {amount} success: {order['id']}")
            return order
        except Exception as e:
            self.log("ERROR", f"Order Failed: {e}")

# 全局引擎管理器
class EngineManager:
    def __init__(self):
        self.runners = {} # strategy_id -> StrategyRunner

    def start_strategy(self, strategy, settings):
        if strategy.id in self.runners:
            self.stop_strategy(strategy.id)
        
        # 解析设置
        api_key = settings.get('apiKey', '')
        secret = settings.get('secretKey', '')
        is_testnet = settings.get('isTestnet', False)

        runner = StrategyRunner(strategy, api_key, secret, is_testnet)
        runner.start()
        self.runners[strategy.id] = runner

    def stop_strategy(self, strategy_id):
        if strategy_id in self.runners:
            self.runners[strategy_id].stop()
            del self.runners[strategy_id]

engine_manager = EngineManager()
`.trim();

export const MAIN_PY = `
import uvicorn
import json
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import SessionLocal, init_db, StrategyDB, LogDB, SettingsDB
from trader_engine import engine_manager

app = FastAPI(title="QuantFlow Backend")

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化数据库
init_db()

# 依赖项
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class StrategyCreate(BaseModel):
    name: str
    description: str = ""
    code: str
    scheduleStart: str
    scheduleEnd: str

class SettingsUpdate(BaseModel):
    exchange: dict
    risk: dict
    notifications: dict

# --- Routes ---

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/strategies")
def get_strategies(db: Session = Depends(get_db)):
    strats = db.query(StrategyDB).all()
    results = []
    for s in strats:
        # 获取最近日志
        logs = db.query(LogDB).filter(LogDB.strategy_id == s.id)\
                 .order_by(LogDB.id.desc()).limit(50).all()
        
        s_dict = {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "code": s.code,
            "status": s.status,
            "scheduleStart": s.schedule_start,
            "scheduleEnd": s.schedule_end,
            "pnlDay": s.pnl_day,
            "logs": [{"id": str(l.id), "timestamp": l.timestamp, "level": l.level, "message": l.message} for l in logs]
        }
        results.append(s_dict)
    return results

@app.post("/api/strategies")
def create_strategy(strat: StrategyCreate, db: Session = Depends(get_db)):
    import uuid
    new_id = str(uuid.uuid4())
    db_strat = StrategyDB(
        id=new_id,
        name=strat.name,
        description=strat.description,
        code=strat.code,
        schedule_start=strat.scheduleStart,
        schedule_end=strat.scheduleEnd
    )
    db.add(db_strat)
    db.commit()
    db.refresh(db_strat)
    return db_strat

@app.put("/api/strategies/{id}/status")
def update_status(id: str, payload: dict, db: Session = Depends(get_db)):
    s = db.query(StrategyDB).filter(StrategyDB.id == id).first()
    if not s:
        raise HTTPException(404, "Strategy not found")
    
    new_status = payload.get('status')
    s.status = new_status
    db.commit()

    # 获取系统设置
    settings_json = db.query(SettingsDB).filter(SettingsDB.key == "global_config").first()
    config = json.loads(settings_json.value) if settings_json else {}
    exchange_config = config.get('exchange', {})

    # 触发引擎
    if new_status == 'RUNNING':
        engine_manager.start_strategy(s, exchange_config)
    elif new_status in ['STOPPED', 'PAUSED']:
        engine_manager.stop_strategy(id)

    return {"status": "success"}

@app.delete("/api/strategies/{id}")
def delete_strategy(id: str, db: Session = Depends(get_db)):
    engine_manager.stop_strategy(id)
    db.query(StrategyDB).filter(StrategyDB.id == id).delete()
    db.query(LogDB).filter(LogDB.strategy_id == id).delete()
    db.commit()
    return {"status": "deleted"}

@app.post("/api/settings")
def save_settings(settings: SettingsUpdate, db: Session = Depends(get_db)):
    # 简单实现：存为 JSON 字符串
    import json
    setting_entry = db.query(SettingsDB).filter(SettingsDB.key == "global_config").first()
    if not setting_entry:
        setting_entry = SettingsDB(key="global_config", value=json.dumps(settings.dict()))
        db.add(setting_entry)
    else:
        setting_entry.value = json.dumps(settings.dict())
    db.commit()
    return {"status": "saved"}

@app.get("/api/account")
def get_account():
    # 生产环境应从 EngineManager 或单例 Exchange 实例获取实时余额
    # 这里返回 Mock 数据作为示例，实际应调用 ccxt
    return {
        "totalBalance": 0,
        "unrealizedPnL": 0,
        "marginBalance": 0,
        "availableBalance": 0,
        "maintenanceMargin": 0,
        "positions": []
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
`.trim();
