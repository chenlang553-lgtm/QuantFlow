import logging
import random
import threading
import time
import traceback
from datetime import datetime
from typing import Any, Callable, Dict, Optional

from database import LogDB, SessionLocal

logger = logging.getLogger("Engine")
logger.setLevel(logging.INFO)


class MockExchange:
    """A lightweight exchange stub used when real credentials are missing."""

    def __init__(self) -> None:
        self._order_counter = 0

    def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        price = 30000 + random.uniform(-500, 500)
        return {
            "symbol": symbol,
            "last": price,
            "bid": price - 5,
            "ask": price + 5,
            "timestamp": int(time.time() * 1000),
        }

    def create_order(self, symbol: str, order_type: str, side: str, amount: float) -> Dict[str, Any]:
        self._order_counter += 1
        return {
            "id": f"mock-{self._order_counter}",
            "symbol": symbol,
            "type": order_type,
            "side": side,
            "amount": amount,
            "price": self.fetch_ticker(symbol)["last"],
            "status": "closed",
        }


class StrategyRunner(threading.Thread):
    def __init__(self, strategy_data, exchange_config: Dict[str, Any]):
        super().__init__()
        self.strategy_id = strategy_data.id
        self.code = strategy_data.code
        self.schedule_start = strategy_data.schedule_start
        self.schedule_end = strategy_data.schedule_end
        self.running = True
        self._stop_event = threading.Event()
        self.exchange_config = exchange_config or {}
        self.context: Dict[str, Any] = {}

    def log(self, level: str, message: Any) -> None:
        db = SessionLocal()
        try:
            timestamp = datetime.now().strftime("%H:%M:%S")
            new_log = LogDB(
                strategy_id=self.strategy_id,
                timestamp=timestamp,
                level=level,
                message=str(message),
            )
            db.add(new_log)
            db.commit()
        finally:
            db.close()
        logger.log(getattr(logging, level, logging.INFO), f"[{self.strategy_id}] {message}")

    def _init_exchange(self):
        api_key = self.exchange_config.get("apiKey")
        secret_key = self.exchange_config.get("secretKey")
        is_testnet = self.exchange_config.get("isTestnet", False)

        if api_key and secret_key:
            try:
                import ccxt

                exchange = ccxt.binanceusdm(
                    {
                        "apiKey": api_key,
                        "secret": secret_key,
                        "enableRateLimit": True,
                        "options": {"defaultType": "future"},
                    }
                )
                if is_testnet:
                    exchange.set_sandbox_mode(True)
                exchange.load_markets()
                self.log("INFO", "Exchange connected successfully")
                return exchange
            except Exception as exc:  # pragma: no cover - depends on runtime env
                self.log("ERROR", f"Exchange init failed, falling back to mock: {exc}")
        self.log("INFO", "Using mock exchange")
        return MockExchange()

    def _compile_user_code(self) -> Optional[Callable[[Any], None]]:
        context: Dict[str, Any] = {
            "log": self.log,
            "sleep": time.sleep,
            "datetime": datetime,
        }
        self.context = context
        try:
            exec(self.code, context)
            on_tick = context.get("on_tick")
            if not callable(on_tick):
                self.log("ERROR", "Strategy missing required on_tick function")
                return None
            return on_tick
        except Exception:
            self.log("ERROR", f"Code compilation failed: {traceback.format_exc()}")
            return None

    def _in_schedule(self) -> bool:
        now_time = datetime.now().time()
        try:
            start_dt = datetime.strptime(self.schedule_start, "%H:%M").time()
            end_dt = datetime.strptime(self.schedule_end, "%H:%M").time()
        except ValueError:
            return True

        if start_dt <= end_dt:
            return start_dt <= now_time <= end_dt
        return now_time >= start_dt or now_time <= end_dt

    def run(self) -> None:
        self.log("INFO", "Starting strategy runner")
        exchange = self._init_exchange()
        on_tick = self._compile_user_code()
        if on_tick is None:
            self.running = False
            return

        self.context.update(
            {
                "exchange": exchange,
                "buy": lambda symbol, amt: self.place_order(exchange, symbol, "buy", amt),
                "sell": lambda symbol, amt: self.place_order(exchange, symbol, "sell", amt),
            }
        )

        while self.running and not self._stop_event.is_set():
            if not self._in_schedule():
                self.log("INFO", "Outside schedule window, stopping strategy")
                break
            try:
                ticker = exchange.fetch_ticker("BTC/USDT")
                on_tick(ticker)
            except Exception as exc:
                self.log("ERROR", f"Runtime error: {exc}")
            time.sleep(5)

        self.log("INFO", "Strategy stopped")

    def stop(self) -> None:
        self.running = False
        self._stop_event.set()

    def place_order(self, exchange: Any, symbol: str, side: str, amount: float) -> Any:
        try:
            order = exchange.create_order(symbol, "market", side, amount)
            self.log("TRADE", f"{side.upper()} {symbol} {amount}: {order}")
            return order
        except Exception as exc:  # pragma: no cover - depends on runtime env
            self.log("ERROR", f"Order failed: {exc}")
            return None


class EngineManager:
    def __init__(self) -> None:
        self.runners: Dict[str, StrategyRunner] = {}

    def start_strategy(self, strategy, exchange_config: Dict[str, Any]) -> None:
        self.stop_strategy(strategy.id)
        runner = StrategyRunner(strategy, exchange_config)
        runner.daemon = True
        runner.start()
        self.runners[strategy.id] = runner

    def stop_strategy(self, strategy_id: str) -> None:
        runner = self.runners.pop(strategy_id, None)
        if runner:
            runner.stop()

    def stop_all(self) -> None:
        for strategy_id in list(self.runners):
            self.stop_strategy(strategy_id)


engine_manager = EngineManager()
m�$�jh��h���)���c��⚚+��