"""Contract repository for database operations."""
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select, update, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.contract import Contract, TimelineTask, ContractType, ContractStatus


class ContractRepository:
    """Repository for contract database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, contract_id: str) -> Optional[Contract]:
        """Get contract by ID."""
        result = await self.session.execute(
            select(Contract).where(Contract.id == contract_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id_with_tasks(self, contract_id: str) -> Optional[Contract]:
        """Get contract by ID with timeline tasks."""
        result = await self.session.execute(
            select(Contract)
            .options(selectinload(Contract.timeline_tasks))
            .where(Contract.id == contract_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Contract], int]:
        """Get contracts by user ID with pagination."""
        conditions = [Contract.user_id == user_id]
        if status:
            conditions.append(Contract.status == ContractStatus(status))

        # Get total count
        count_query = select(func.count(Contract.id)).where(and_(*conditions))
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        result = await self.session.execute(
            select(Contract)
            .where(and_(*conditions))
            .order_by(Contract.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        contracts = list(result.scalars().all())

        return contracts, total

    async def create(self, contract: Contract) -> Contract:
        """Create a new contract."""
        self.session.add(contract)
        await self.session.commit()
        await self.session.refresh(contract)
        return contract

    async def update(self, contract: Contract, **kwargs) -> Contract:
        """Update contract fields."""
        for key, value in kwargs.items():
            if hasattr(contract, key) and value is not None:
                setattr(contract, key, value)
        await self.session.commit()
        await self.session.refresh(contract)
        return contract

    async def update_status(self, contract_id: str, status: ContractStatus) -> None:
        """Update contract status."""
        await self.session.execute(
            update(Contract)
            .where(Contract.id == contract_id)
            .values(status=status)
        )
        await self.session.commit()

    async def update_analysis(
        self,
        contract_id: str,
        risk_score: int,
        analysis_result: dict,
        identified_risks: list,
        recommendations: list
    ) -> None:
        """Update contract analysis results."""
        await self.session.execute(
            update(Contract)
            .where(Contract.id == contract_id)
            .values(
                risk_score=risk_score,
                analysis_result=analysis_result,
                identified_risks=identified_risks,
                recommendations=recommendations
            )
        )
        await self.session.commit()

    async def set_verified(
        self,
        contract_id: str,
        tx_hash: str
    ) -> None:
        """Mark contract as verified on blockchain."""
        await self.session.execute(
            update(Contract)
            .where(Contract.id == contract_id)
            .values(
                is_verified=True,
                blockchain_tx_hash=tx_hash,
                verified_at=datetime.now(timezone.utc)
            )
        )
        await self.session.commit()

    async def delete(self, contract_id: str) -> None:
        """Delete a contract."""
        contract = await self.get_by_id(contract_id)
        if contract:
            await self.session.delete(contract)
            await self.session.commit()


class TimelineTaskRepository:
    """Repository for timeline task database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, task_id: str) -> Optional[TimelineTask]:
        """Get task by ID."""
        result = await self.session.execute(
            select(TimelineTask).where(TimelineTask.id == task_id)
        )
        return result.scalar_one_or_none()

    async def get_by_contract_id(
        self,
        contract_id: str
    ) -> List[TimelineTask]:
        """Get tasks for a contract."""
        result = await self.session.execute(
            select(TimelineTask)
            .where(TimelineTask.contract_id == contract_id)
            .order_by(TimelineTask.sort_order, TimelineTask.due_date)
        )
        return list(result.scalars().all())

    async def create(self, task: TimelineTask) -> TimelineTask:
        """Create a new task."""
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def create_bulk(self, tasks: List[TimelineTask]) -> List[TimelineTask]:
        """Create multiple tasks."""
        self.session.add_all(tasks)
        await self.session.commit()
        for task in tasks:
            await self.session.refresh(task)
        return tasks

    async def update(self, task: TimelineTask, **kwargs) -> TimelineTask:
        """Update task fields."""
        for key, value in kwargs.items():
            if hasattr(task, key) and value is not None:
                setattr(task, key, value)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def mark_completed(self, task_id: str) -> None:
        """Mark task as completed."""
        await self.session.execute(
            update(TimelineTask)
            .where(TimelineTask.id == task_id)
            .values(
                is_completed=True,
                completed_at=datetime.now(timezone.utc)
            )
        )
        await self.session.commit()

    async def delete(self, task_id: str) -> None:
        """Delete a task."""
        task = await self.get_by_id(task_id)
        if task:
            await self.session.delete(task)
            await self.session.commit()
