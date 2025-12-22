"""
Timeline Generator Service
Generates smart move-in timeline based on contract details
"""

from datetime import date, timedelta
from typing import List
from uuid import uuid4

from app.api.v1.endpoints.contracts import (
    ContractCreate,
    TimelineTask,
    TaskStatus,
    TaskPriority,
    TaskCategory,
    SubtaskInfo,
)


def generate_id() -> str:
    """Generate unique ID."""
    return str(uuid4())[:8]


def generate_timeline(contract: ContractCreate) -> List[TimelineTask]:
    """Generate timeline tasks based on contract details."""

    move_in_date = contract.dates.move_in_date
    tasks: List[TimelineTask] = []

    # Base timeline templates
    base_tasks = [
        # D-60: Initial preparation
        {
            "d_day": -60,
            "category": TaskCategory.DOCUMENTS,
            "title": "Review contract documents",
            "description": "Verify all contract documents and property registry",
            "priority": TaskPriority.CRITICAL,
            "subtasks": [
                "Check property registry (building ledger)",
                "Verify ownership and liens",
                "Review contract terms",
                "Confirm special conditions",
            ],
        },
        # D-14: Moving preparation
        {
            "d_day": -14,
            "category": TaskCategory.MOVING,
            "title": "Book moving company",
            "description": "Reserve moving service and start packing",
            "priority": TaskPriority.HIGH,
            "subtasks": [
                "Get quotes from 3+ moving companies",
                "Book moving date and time",
                "Start packing non-essentials",
                "Notify current landlord (if renting)",
            ],
        },
        # D-10: Balance preparation
        {
            "d_day": -10,
            "category": TaskCategory.FINANCE,
            "title": "Prepare balance payment",
            "description": "Ensure all funds are ready for closing",
            "priority": TaskPriority.CRITICAL,
            "subtasks": [
                "Confirm total amount needed",
                "Arrange fund transfers",
                "Prepare bank checks if needed",
                "Document all payment preparations",
            ],
        },
        # D-7: Utilities transfer
        {
            "d_day": -7,
            "category": TaskCategory.UTILITIES,
            "title": "Transfer utilities",
            "description": "Arrange utility transfers to your name",
            "priority": TaskPriority.MEDIUM,
            "subtasks": [
                "Contact electricity provider",
                "Transfer gas service",
                "Set up internet installation",
                "Register water service",
            ],
        },
        # D-5: Pre-move cleaning
        {
            "d_day": -5,
            "category": TaskCategory.CLEANING,
            "title": "Schedule move-in cleaning",
            "description": "Book professional cleaning before moving in",
            "priority": TaskPriority.MEDIUM,
            "subtasks": [
                "Book cleaning service",
                "Request deep cleaning",
                "Schedule for after interior completion",
            ],
        },
        # D-3: Final inspection
        {
            "d_day": -3,
            "category": TaskCategory.INSPECTION,
            "title": "Final property inspection",
            "description": "Do thorough inspection before balance payment",
            "priority": TaskPriority.CRITICAL,
            "subtasks": [
                "Check all fixtures and appliances",
                "Verify interior work completion",
                "Document any issues",
                "Confirm with seller/landlord",
            ],
        },
        # D-1: Balance payment
        {
            "d_day": -1,
            "category": TaskCategory.FINANCE,
            "title": "Balance payment",
            "description": "Complete final payment and receive keys",
            "priority": TaskPriority.CRITICAL,
            "subtasks": [
                "Meet at agreed location",
                "Verify property condition",
                "Make balance payment",
                "Receive keys and documents",
            ],
        },
        # D-Day: Move in
        {
            "d_day": 0,
            "category": TaskCategory.MOVE_IN,
            "title": "Move-in day",
            "description": "Move into your new home",
            "priority": TaskPriority.CRITICAL,
            "subtasks": [
                "Supervise moving process",
                "Check all items upon arrival",
                "Test all utilities",
                "Complete move-in checklist",
            ],
        },
        # D+1: Post-move tasks
        {
            "d_day": 1,
            "category": TaskCategory.DOCUMENTS,
            "title": "Address registration",
            "description": "Update your official address",
            "priority": TaskPriority.HIGH,
            "subtasks": [
                "Visit district office",
                "Register new address",
                "Update driver license if needed",
                "Notify relevant institutions",
            ],
        },
        # D+7: Settling in
        {
            "d_day": 7,
            "category": TaskCategory.UTILITIES,
            "title": "Complete utility setup",
            "description": "Finalize all utility registrations",
            "priority": TaskPriority.MEDIUM,
            "subtasks": [
                "Verify all utility accounts",
                "Set up auto-pay if desired",
                "Complete internet setup",
                "Register for building management",
            ],
        },
    ]

    # Add loan tasks if requires loan
    if contract.requires_loan:
        base_tasks.extend([
            {
                "d_day": -45,
                "category": TaskCategory.LOAN,
                "title": "Start loan application",
                "description": "Begin mortgage application process at multiple banks",
                "priority": TaskPriority.CRITICAL,
                "subtasks": [
                    "Compare loan products at 3+ banks",
                    "Prepare required documents",
                    "Submit loan applications",
                    "Track approval status",
                ],
            },
            {
                "d_day": -30,
                "category": TaskCategory.LOAN,
                "title": "Finalize loan approval",
                "description": "Complete loan approval and schedule disbursement",
                "priority": TaskPriority.CRITICAL,
                "subtasks": [
                    "Provide additional documents if requested",
                    "Confirm loan amount and terms",
                    "Schedule disbursement date",
                    "Prepare for closing",
                ],
            },
        ])

    # Add interior tasks if has interior work
    if contract.has_interior:
        base_tasks.extend([
            {
                "d_day": -40,
                "category": TaskCategory.INTERIOR,
                "title": "Plan interior work",
                "description": "Get quotes and plan renovation if needed",
                "priority": TaskPriority.HIGH,
                "subtasks": [
                    "Visit property for measurements",
                    "Get 3+ contractor quotes",
                    "Decide on renovation scope",
                    "Set budget and timeline",
                ],
            },
            {
                "d_day": -21,
                "category": TaskCategory.INTERIOR,
                "title": "Begin interior work",
                "description": "Start renovation work at the property",
                "priority": TaskPriority.HIGH,
                "subtasks": [
                    "Sign contract with interior company",
                    "Demolition work (if applicable)",
                    "Flooring and painting",
                    "Electrical and plumbing updates",
                ],
            },
        ])

    # Add sale-specific tasks
    if contract.contract_type.value == "sale":
        base_tasks.extend([
            {
                "d_day": -30,
                "category": TaskCategory.DOCUMENTS,
                "title": "Prepare ownership transfer",
                "description": "Prepare documents for property registration",
                "priority": TaskPriority.CRITICAL,
                "subtasks": [
                    "Get property appraisal",
                    "Prepare acquisition tax payment",
                    "Gather identification documents",
                    "Contact judicial scrivener",
                ],
            },
            {
                "d_day": 0,
                "category": TaskCategory.DOCUMENTS,
                "title": "Complete ownership registration",
                "description": "Register property ownership at registry office",
                "priority": TaskPriority.CRITICAL,
                "subtasks": [
                    "Submit registration documents",
                    "Pay acquisition tax",
                    "Receive registration confirmation",
                ],
            },
        ])

    # Add lease-specific tasks
    if contract.contract_type.value in ("jeonse", "monthly"):
        base_tasks.append({
            "d_day": 1,
            "category": TaskCategory.DOCUMENTS,
            "title": "Register lease (Hwakjeongiljja)",
            "description": "Register lease for legal protection",
            "priority": TaskPriority.CRITICAL,
            "subtasks": [
                "Get contract notarized",
                "Register at district office",
                "Obtain confirmation date stamp",
            ],
        })

    # Sort by d_day and create tasks
    base_tasks.sort(key=lambda x: x["d_day"])

    for i, template in enumerate(base_tasks):
        task_date = move_in_date + timedelta(days=template["d_day"])

        subtasks = [
            SubtaskInfo(
                id=generate_id(),
                title=st,
                completed=False,
            )
            for st in template.get("subtasks", [])
        ]

        task = TimelineTask(
            id=f"task_{generate_id()}",
            d_day=template["d_day"],
            date=task_date,
            category=template["category"],
            title=template["title"],
            description=template["description"],
            status=TaskStatus.PENDING,
            priority=template["priority"],
            subtasks=subtasks,
        )
        tasks.append(task)

    return tasks
