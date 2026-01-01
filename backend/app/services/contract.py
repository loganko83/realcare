"""Contract service for business logic."""
import uuid
from datetime import date, timedelta
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contract import Contract, TimelineTask, ContractType, ContractStatus
from app.repositories.contract import ContractRepository, TimelineTaskRepository
from app.schemas.contract import ContractCreate, ContractUpdate, TimelineTaskUpdate


# Default timeline tasks by contract type
DEFAULT_TIMELINE_TASKS = {
    ContractType.SALE: [
        {"title": "Review contract terms", "category": "contract_review", "priority": "high", "d_day_offset": -30},
        {"title": "Verify property registration", "category": "verification", "priority": "high", "d_day_offset": -28},
        {"title": "Schedule property inspection", "category": "inspection", "priority": "high", "d_day_offset": -21},
        {"title": "Apply for mortgage (if needed)", "category": "loan", "priority": "high", "d_day_offset": -21, "is_optional": True},
        {"title": "Prepare down payment", "category": "payment", "priority": "high", "d_day_offset": -14},
        {"title": "Final walkthrough", "category": "inspection", "priority": "medium", "d_day_offset": -3},
        {"title": "Sign final contract", "category": "contract_sign", "priority": "high", "d_day_offset": -1},
        {"title": "Complete payment transfer", "category": "payment", "priority": "high", "d_day_offset": 0},
        {"title": "Receive keys", "category": "handover", "priority": "high", "d_day_offset": 0},
        {"title": "Update address registration", "category": "admin", "priority": "medium", "d_day_offset": 14},
    ],
    ContractType.JEONSE: [
        {"title": "Review contract terms", "category": "contract_review", "priority": "high", "d_day_offset": -30},
        {"title": "Check previous tenant deposits", "category": "verification", "priority": "high", "d_day_offset": -28},
        {"title": "Verify property registration", "category": "verification", "priority": "high", "d_day_offset": -21},
        {"title": "Apply for jeonse loan (if needed)", "category": "loan", "priority": "high", "d_day_offset": -21, "is_optional": True},
        {"title": "Schedule property inspection", "category": "inspection", "priority": "high", "d_day_offset": -14},
        {"title": "Sign contract and pay deposit", "category": "contract_sign", "priority": "high", "d_day_offset": -7},
        {"title": "Final walkthrough", "category": "inspection", "priority": "medium", "d_day_offset": -3},
        {"title": "Complete jeonse payment", "category": "payment", "priority": "high", "d_day_offset": 0},
        {"title": "Receive keys and move in", "category": "handover", "priority": "high", "d_day_offset": 0},
        {"title": "Register confirmed date", "category": "admin", "priority": "high", "d_day_offset": 1},
    ],
    ContractType.MONTHLY_RENT: [
        {"title": "Review contract terms", "category": "contract_review", "priority": "high", "d_day_offset": -14},
        {"title": "Verify landlord and property", "category": "verification", "priority": "high", "d_day_offset": -10},
        {"title": "Schedule property viewing", "category": "inspection", "priority": "high", "d_day_offset": -7},
        {"title": "Prepare deposit amount", "category": "payment", "priority": "high", "d_day_offset": -5},
        {"title": "Sign contract and pay deposit", "category": "contract_sign", "priority": "high", "d_day_offset": -3},
        {"title": "Receive keys and move in", "category": "handover", "priority": "high", "d_day_offset": 0},
        {"title": "Register confirmed date", "category": "admin", "priority": "high", "d_day_offset": 1},
        {"title": "Set up utility transfers", "category": "admin", "priority": "medium", "d_day_offset": 3},
    ],
}


class ContractService:
    """Service for contract operations."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.contract_repo = ContractRepository(session)
        self.task_repo = TimelineTaskRepository(session)

    async def create_contract(
        self,
        user_id: str,
        data: ContractCreate
    ) -> Contract:
        """Create a new contract with default timeline."""
        contract = Contract(
            id=str(uuid.uuid4()),
            user_id=user_id,
            contract_type=ContractType(data.contract_type),
            status=ContractStatus.DRAFT,
            property_address=data.property_address,
            property_description=data.property_description,
            contract_date=data.contract_date,
            move_in_date=data.move_in_date,
            move_out_date=data.move_out_date,
            total_price=data.total_price,
            deposit=data.deposit,
            monthly_rent=data.monthly_rent,
            loan_amount=data.loan_amount,
            has_loan=data.has_loan,
            has_interior_work=data.has_interior_work,
        )

        contract = await self.contract_repo.create(contract)

        # Generate timeline tasks if move_in_date is set
        if data.move_in_date:
            await self._create_timeline_tasks(
                contract.id,
                ContractType(data.contract_type),
                data.move_in_date,
                data.has_loan
            )

        return contract

    async def _create_timeline_tasks(
        self,
        contract_id: str,
        contract_type: ContractType,
        move_in_date: date,
        has_loan: bool
    ) -> None:
        """Create default timeline tasks for contract."""
        template_tasks = DEFAULT_TIMELINE_TASKS.get(contract_type, [])
        tasks = []

        for i, template in enumerate(template_tasks):
            # Skip loan tasks if no loan
            if "loan" in template["category"] and not has_loan:
                continue

            due_date = move_in_date + timedelta(days=template.get("d_day_offset", 0))

            task = TimelineTask(
                id=str(uuid.uuid4()),
                contract_id=contract_id,
                title=template["title"],
                category=template["category"],
                priority=template.get("priority", "medium"),
                due_date=due_date,
                d_day_offset=template.get("d_day_offset"),
                is_optional=template.get("is_optional", False),
                sort_order=i,
            )
            tasks.append(task)

        if tasks:
            await self.task_repo.create_bulk(tasks)

    async def get_contract(
        self,
        contract_id: str,
        user_id: str
    ) -> Contract:
        """Get a contract by ID."""
        contract = await self.contract_repo.get_by_id_with_tasks(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )
        if contract.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this contract"
            )
        return contract

    async def list_contracts(
        self,
        user_id: str,
        contract_status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Contract], int]:
        """List contracts for a user."""
        offset = (page - 1) * page_size
        contracts, total = await self.contract_repo.get_by_user_id(
            user_id=user_id,
            status=contract_status,
            limit=page_size,
            offset=offset
        )
        return contracts, total

    async def update_contract(
        self,
        contract_id: str,
        user_id: str,
        data: ContractUpdate
    ) -> Contract:
        """Update a contract."""
        contract = await self.contract_repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )
        if contract.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this contract"
            )

        update_data = data.model_dump(exclude_unset=True)
        if "status" in update_data and update_data["status"]:
            update_data["status"] = ContractStatus(update_data["status"])

        return await self.contract_repo.update(contract, **update_data)

    async def delete_contract(
        self,
        contract_id: str,
        user_id: str
    ) -> None:
        """Delete a contract."""
        contract = await self.contract_repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )
        if contract.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this contract"
            )
        await self.contract_repo.delete(contract_id)

    async def get_timeline_tasks(
        self,
        contract_id: str,
        user_id: str
    ) -> List[TimelineTask]:
        """Get timeline tasks for a contract."""
        contract = await self.contract_repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )
        if contract.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this contract"
            )
        return await self.task_repo.get_by_contract_id(contract_id)

    async def update_task(
        self,
        task_id: str,
        user_id: str,
        data: TimelineTaskUpdate
    ) -> TimelineTask:
        """Update a timeline task."""
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        contract = await self.contract_repo.get_by_id(task.contract_id)
        if not contract or contract.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this task"
            )

        update_data = data.model_dump(exclude_unset=True)

        # If marking as completed, set completed_at
        if update_data.get("is_completed"):
            await self.task_repo.mark_completed(task_id)
            task = await self.task_repo.get_by_id(task_id)
            return task

        return await self.task_repo.update(task, **update_data)

    async def set_analysis_result(
        self,
        contract_id: str,
        user_id: str,
        risk_score: int,
        analysis_result: dict,
        identified_risks: list,
        recommendations: list
    ) -> Contract:
        """Set analysis result for a contract."""
        contract = await self.contract_repo.get_by_id(contract_id)
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found"
            )
        if contract.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )

        await self.contract_repo.update_analysis(
            contract_id,
            risk_score,
            analysis_result,
            identified_risks,
            recommendations
        )

        return await self.contract_repo.get_by_id(contract_id)
