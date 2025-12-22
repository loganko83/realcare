"""
Agent Endpoints
B2B real estate agent platform APIs
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, Integer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.agent import Agent, AgentListing, AgentSignalResponse, AgentStatus
from app.models.owner_signal import OwnerSignal
from app.models.user import User, UserRole
from app.schemas.agent import (
    AgentRegister,
    AgentUpdate,
    AgentResponse,
    AgentPublicResponse,
    AgentListResponse,
    ListingCreate,
    ListingUpdate,
    ListingResponse,
    ListingListResponse,
    SignalResponseCreate,
    SignalResponseResponse,
    AgentDashboardStats,
    MatchedSignal,
)
from app.api.v1.endpoints.auth import get_current_user, oauth2_scheme
from app.services.auth import AuthService

router = APIRouter()


async def get_current_agent(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Agent:
    """Get current authenticated agent."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    result = await db.execute(
        select(Agent).where(Agent.user_id == user.id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent profile not found. Please register as an agent first."
        )

    if agent.status != AgentStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Agent account is {agent.status.value}. Please wait for verification."
        )

    return agent


# Agent Registration and Profile
@router.post("/register", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def register_agent(
    data: AgentRegister,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Register as a real estate agent.

    Requires user authentication. Creates agent profile pending verification.
    """
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    # Check if already registered
    existing = await db.execute(
        select(Agent).where(Agent.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered as an agent"
        )

    # Check business number uniqueness
    existing_biz = await db.execute(
        select(Agent).where(Agent.business_number == data.business_number)
    )
    if existing_biz.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business number already registered"
        )

    # Create agent
    agent = Agent(
        user_id=user.id,
        business_name=data.business_name,
        business_number=data.business_number,
        license_number=data.license_number,
        representative_name=data.representative_name,
        office_phone=data.office_phone,
        office_address=data.office_address,
        office_region=data.office_region,
        introduction=data.introduction,
        specialties=data.specialties,
        status=AgentStatus.PENDING,
    )

    # Update user role
    user.role = UserRole.AGENT
    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    return AgentResponse.model_validate(agent)


@router.get("/me", response_model=AgentResponse)
async def get_my_agent_profile(agent: Agent = Depends(get_current_agent)):
    """Get current agent's profile."""
    return AgentResponse.model_validate(agent)


@router.patch("/me", response_model=AgentResponse)
async def update_my_agent_profile(
    data: AgentUpdate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Update current agent's profile."""
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(agent, key, value)

    await db.commit()
    await db.refresh(agent)
    return AgentResponse.model_validate(agent)


@router.get("/dashboard", response_model=AgentDashboardStats)
async def get_agent_dashboard(
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Get agent dashboard statistics."""
    # Count listings
    listings_result = await db.execute(
        select(
            func.count(AgentListing.id).label("total"),
            func.sum(func.cast(AgentListing.is_active, Integer)).label("active"),
            func.sum(AgentListing.view_count).label("views"),
            func.sum(AgentListing.inquiry_count).label("inquiries"),
        ).where(AgentListing.agent_id == agent.id)
    )
    listings_stats = listings_result.one()

    # Count pending signal responses
    pending_result = await db.execute(
        select(func.count(AgentSignalResponse.id))
        .where(
            AgentSignalResponse.agent_id == agent.id,
            AgentSignalResponse.status == "pending"
        )
    )
    pending_count = pending_result.scalar() or 0

    return AgentDashboardStats(
        total_listings=listings_stats.total or 0,
        active_listings=int(listings_stats.active or 0),
        total_inquiries=int(listings_stats.inquiries or 0),
        total_views=int(listings_stats.views or 0),
        pending_responses=pending_count,
        signals_used=agent.signals_used_this_month,
        signals_limit=agent.monthly_signal_limit,
        tier=agent.tier.value,
        subscription_expires_at=agent.subscription_expires_at,
    )


# Public agent listings
@router.get("/", response_model=AgentListResponse)
async def list_agents(
    region: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List verified agents."""
    query = select(Agent).where(Agent.status == AgentStatus.VERIFIED)

    if region:
        query = query.where(Agent.office_region == region)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Get paginated results
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    agents = result.scalars().all()

    return AgentListResponse(
        items=[AgentPublicResponse.model_validate(a) for a in agents],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{agent_id}", response_model=AgentPublicResponse)
async def get_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get public agent profile."""
    result = await db.execute(
        select(Agent).where(
            Agent.id == agent_id,
            Agent.status == AgentStatus.VERIFIED
        )
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentPublicResponse.model_validate(agent)


# Listings
@router.post("/listings", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    data: ListingCreate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Create a new property listing."""
    listing = AgentListing(
        agent_id=agent.id,
        **data.model_dump()
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return ListingResponse.model_validate(listing)


@router.get("/listings", response_model=ListingListResponse)
async def get_my_listings(
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Get agent's own listings."""
    query = select(AgentListing).where(AgentListing.agent_id == agent.id)

    if is_active is not None:
        query = query.where(AgentListing.is_active == is_active)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(AgentListing.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    listings = result.scalars().all()

    return ListingListResponse(
        items=[ListingResponse.model_validate(l) for l in listings],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/listings/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: str,
    data: ListingUpdate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Update a listing."""
    result = await db.execute(
        select(AgentListing).where(
            AgentListing.id == listing_id,
            AgentListing.agent_id == agent.id
        )
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(listing, key, value)

    await db.commit()
    await db.refresh(listing)
    return ListingResponse.model_validate(listing)


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: str,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Delete a listing."""
    result = await db.execute(
        select(AgentListing).where(
            AgentListing.id == listing_id,
            AgentListing.agent_id == agent.id
        )
    )
    listing = result.scalar_one_or_none()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    await db.delete(listing)
    await db.commit()


# Signal Matching
@router.get("/signals/matched", response_model=List[MatchedSignal])
async def get_matched_signals(
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Get signals matching agent's region."""
    # Get agent's responded signals
    responded_result = await db.execute(
        select(AgentSignalResponse.signal_id)
        .where(AgentSignalResponse.agent_id == agent.id)
    )
    responded_ids = [r[0] for r in responded_result.all()]

    # Get matching signals
    query = select(OwnerSignal).where(
        OwnerSignal.status == "active",
        OwnerSignal.region == agent.office_region
    ).order_by(OwnerSignal.created_at.desc()).limit(50)

    result = await db.execute(query)
    signals = result.scalars().all()

    return [
        MatchedSignal(
            id=s.id,
            property_type=s.property_type.value,
            region=s.region,
            asking_price=s.asking_price,
            is_negotiable=s.is_negotiable,
            created_at=s.created_at,
            has_responded=s.id in responded_ids,
        )
        for s in signals
    ]


@router.post("/signals/{signal_id}/respond", response_model=SignalResponseResponse)
async def respond_to_signal(
    signal_id: str,
    data: SignalResponseCreate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Respond to an owner signal."""
    # Check signal exists
    signal_result = await db.execute(
        select(OwnerSignal).where(OwnerSignal.id == signal_id)
    )
    signal = signal_result.scalar_one_or_none()

    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")

    # Check if already responded
    existing = await db.execute(
        select(AgentSignalResponse).where(
            AgentSignalResponse.agent_id == agent.id,
            AgentSignalResponse.signal_id == signal_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already responded to this signal"
        )

    # Check signal limit
    if agent.signals_used_this_month >= agent.monthly_signal_limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Monthly signal limit reached. Please upgrade your plan."
        )

    # Create response
    response = AgentSignalResponse(
        agent_id=agent.id,
        signal_id=signal_id,
        message=data.message,
        proposed_price=data.proposed_price,
        commission_rate=data.commission_rate,
    )

    agent.signals_used_this_month += 1
    signal.interest_count += 1

    db.add(response)
    await db.commit()
    await db.refresh(response)

    return SignalResponseResponse.model_validate(response)


@router.get("/signals/responses", response_model=List[SignalResponseResponse])
async def get_my_signal_responses(
    status: Optional[str] = None,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Get agent's signal responses."""
    query = select(AgentSignalResponse).where(
        AgentSignalResponse.agent_id == agent.id
    )

    if status:
        query = query.where(AgentSignalResponse.status == status)

    query = query.order_by(AgentSignalResponse.created_at.desc())

    result = await db.execute(query)
    responses = result.scalars().all()

    return [SignalResponseResponse.model_validate(r) for r in responses]


# Public listing search
@router.get("/listings/search", response_model=ListingListResponse)
async def search_listings(
    region: Optional[str] = None,
    property_type: Optional[str] = None,
    transaction_type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search property listings (public)."""
    query = select(AgentListing).where(AgentListing.is_active == True)

    if region:
        query = query.where(AgentListing.region == region)
    if property_type:
        query = query.where(AgentListing.property_type == property_type)
    if transaction_type:
        query = query.where(AgentListing.transaction_type == transaction_type)
    if min_price:
        query = query.where(AgentListing.price >= min_price)
    if max_price:
        query = query.where(AgentListing.price <= max_price)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(AgentListing.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    listings = result.scalars().all()

    return ListingListResponse(
        items=[ListingResponse.model_validate(l) for l in listings],
        total=total,
        page=page,
        page_size=page_size,
    )
