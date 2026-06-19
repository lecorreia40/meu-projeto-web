"""Investment memo endpoints (read + create)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_memo_repository
from core.events import EventType
from core.logging import StructuredLogger
from app.dependencies import get_app_logger
from memos.memo_repository import MemoRepository
from memos.memo_schema import InvestmentMemo

router = APIRouter(prefix="/memos", tags=["memos"])


@router.get("", response_model=list[InvestmentMemo])
def list_memos(repo: MemoRepository = Depends(get_memo_repository)) -> list[InvestmentMemo]:
    return repo.list()


@router.get("/{memo_id}", response_model=InvestmentMemo)
def get_memo(
    memo_id: str, repo: MemoRepository = Depends(get_memo_repository)
) -> InvestmentMemo:
    memo = repo.get(memo_id)
    if memo is None:
        raise HTTPException(status_code=404, detail="memo not found")
    return memo


@router.post("", response_model=InvestmentMemo, status_code=201)
def create_memo(
    memo: InvestmentMemo,
    repo: MemoRepository = Depends(get_memo_repository),
    logger: StructuredLogger = Depends(get_app_logger),
) -> InvestmentMemo:
    stored = repo.add(memo)
    logger.info(
        EventType.MEMO_CREATED,
        entity_id=stored.memo_id,
        symbol=stored.symbol,
        model_version=stored.model_version,
        prompt_version=stored.prompt_version,
    )
    return stored
