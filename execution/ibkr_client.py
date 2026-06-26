"""Interactive Brokers (paper) adapter — SCAFFOLD ONLY (Phase 9).

This implements :class:`BrokerInterface` so the future IBKR paper integration
slots in without touching callers. In the Sprint 3 MVP it is **not connected**
and is **fail-closed**: it never opens a socket, ``is_connected()`` is ``False``,
and ``submit_order`` refuses to do anything. Connecting is deferred to Phase 9
and, even then, will be paper-only with live trading gated elsewhere.

No ``ib_insync``/network dependency is imported here, so the MVP stays offline.
"""

from __future__ import annotations

from core.exceptions import BrokerError
from execution.broker_interface import BrokerInterface
from execution.order_schema import Fill, Order


class IBKRPaperBroker(BrokerInterface):
    """Disconnected scaffold for the IBKR *paper* gateway."""

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 7497,          # 7497 = TWS paper; 4002 = Gateway paper
        client_id: int = 1,
    ) -> None:
        self._host = host
        self._port = port
        self._client_id = client_id
        self._connected = False

    @property
    def name(self) -> str:
        return "ibkr-paper"

    @property
    def supports_live(self) -> bool:
        # This adapter targets the IBKR *paper* gateway only.
        return False

    def is_connected(self) -> bool:
        return self._connected

    def connect(self) -> None:
        """Open a connection to the IBKR paper gateway.

        Not implemented in the MVP — deferred to Phase 9. Raising here keeps the
        system fail-closed: nothing can trade through an unimplemented path.
        """
        raise NotImplementedError(
            "IBKR paper connection is implemented in Phase 9; it is disabled in the MVP."
        )

    def submit_order(self, order: Order, *, mark_price: float) -> Fill:
        if not self._connected:
            raise BrokerError(
                "IBKR adapter is not connected; refusing to submit (no-trade)."
            )
        # Unreachable in the MVP (connect() always raises). Belt-and-suspenders:
        raise BrokerError("IBKR order submission is not enabled in the MVP.")
