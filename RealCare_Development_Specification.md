# RealCare (리얼케어) - 부동산 케어 서비스 개발 명세서

> **Reality Check & Asset OS**  
> 부동산을 '쇼핑'이 아닌 '자산 관리'의 관점으로 접근하는 차세대 프롭테크 인프라

---

## 📋 목차

1. [PRD (Product Requirements Document)](#1-prd-product-requirements-document)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [ERD (Entity Relationship Diagram)](#3-erd-entity-relationship-diagram)
4. [API 설계](#4-api-설계)
5. [인증 시스템 (JWT)](#5-인증-시스템-jwt)
6. [UI/UX 설계](#6-uiux-설계)
7. [CI/CD 파이프라인](#7-cicd-파이프라인)
8. [보안 및 규제 대응](#8-보안-및-규제-대응)
9. [개발 로드맵](#9-개발-로드맵)

---

## 1. PRD (Product Requirements Document)

### 1.1 제품 개요

| 항목 | 내용 |
|------|------|
| **제품명** | RealCare (리얼케어) |
| **슬로건** | Reality Check & Asset OS |
| **버전** | v1.0.0 |
| **대상 플랫폼** | Web (Next.js), Mobile (React Native) |
| **핵심 가치** | "이 거래가 현실적으로 가능한가?"를 검증 |

### 1.2 문제 정의

```
┌─────────────────────────────────────────────────────────────────┐
│  현재 부동산 시장의 3대 Pain Point                               │
├─────────────────────────────────────────────────────────────────┤
│  1. 비가시적 규제 장벽                                           │
│     - LTV/DSR 규제로 인한 대출 한도 예측 불가                     │
│     - 수시로 변경되는 부동산 정책 추적 어려움                      │
│     - 계약금 몰수 등 금전적 손실 리스크                           │
│                                                                 │
│  2. 공급자의 정보 차단                                           │
│     - 집주인의 '전화 폭탄' 공포                                   │
│     - 중개사 한 곳에만 의존 → 거래 지연                           │
│     - 허위 매물 범람                                             │
│                                                                 │
│  3. 파편화된 사후 관리                                           │
│     - 계약 후 중개사의 손 떼기                                    │
│     - 대출, 이사, 인테리어 등 개인 부담                           │
│     - 체계적인 입주 프로세스 부재                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 솔루션 개요

#### 핵심 엔진 3종

| 엔진 | 기능 | 기술 |
|------|------|------|
| **Reality Check** | 금융·규제 시뮬레이터 | Rule Engine + AI |
| **Owner Signal** | 소유자 의사 표시 시스템 | 암호화 + B2B API |
| **Smart Move-in** | 입주 로드맵 자동화 | 이벤트 기반 알림 |

### 1.4 기능 요구사항 (Functional Requirements)

#### FR-001: Reality Check 엔진

```yaml
FR-001-01: 사용자 재정 정보 입력
  - 연소득 (급여, 사업, 임대 등)
  - 보유 자산 (현금, 주식, 부동산)
  - 기존 부채 (신용대출, 자동차할부 등)
  - 주택 보유 수
  - 생애최초 여부

FR-001-02: 규제 자동 적용
  - 투기과열지구/조정대상지역 판별
  - LTV 한도 계산 (지역별, 주택수별)
  - DSR 40% 룰 적용
  - 다주택자 취득세 중과율 계산

FR-001-03: Reality Score 산출
  - 거래 가능성 점수 (0~100)
  - Gap Analysis (부족 금액, 대안 제시)
  - Action Plan 생성

FR-001-04: 시나리오 비교
  - 현재 매수 vs N년 후 매수
  - 일반 매수 vs 임대사업자 등록
  - 세후 수익률 비교 분석
```

#### FR-002: Owner Signal 시스템

```yaml
FR-002-01: 소유자 등록
  - 건축물대장/등기부 기반 본인 확인
  - 지도 기반 건물 선택
  - 익명 신호 설정 (매도/임대/협의가능)

FR-002-02: 중개사 대시보드
  - 관할 지역 신호 모니터링
  - 접촉 요청 기능
  - 리드 품질 필터링 (Reality Score 기반)

FR-002-03: 매칭 시스템
  - 집주인 수락 시에만 연락처 공개
  - 거래 성사율 트래킹
  - 수수료 정산 시스템
```

#### FR-003: Smart Move-in OS

```yaml
FR-003-01: 타임라인 자동 생성
  - 계약일 기준 D-Day 설정
  - 마일스톤별 할일 생성
  - 푸시 알림 스케줄링

FR-003-02: 제휴 서비스 연결
  - 대출 상품 비교 (금융사 API)
  - 인테리어 견적 (역경매)
  - 이사 센터 예약
  - 입주 청소 서비스

FR-003-03: 문서 관리
  - 전자계약서 보관
  - 등기부등본 변동 알림
  - 영수증/증빙 자료 저장
```

### 1.5 비기능 요구사항 (Non-Functional Requirements)

```yaml
NFR-001: 성능
  - API 응답 시간: 평균 200ms 이하
  - Reality Score 계산: 3초 이내
  - 동시 접속자: 10,000명 처리

NFR-002: 가용성
  - 서비스 가용률: 99.9% (월간)
  - 장애 복구 시간: 30분 이내
  - 데이터 백업: 일일 + 실시간 복제

NFR-003: 보안
  - 개인정보 암호화: AES-256
  - 통신 암호화: TLS 1.3
  - 취약점 점검: 분기별 모의해킹

NFR-004: 확장성
  - 수평적 확장 가능 (K8s 기반)
  - 마이크로서비스 아키텍처
  - 멀티 리전 지원
```

### 1.6 성공 지표 (KPIs)

| 지표 | 목표 (1년차) | 목표 (2년차) |
|------|-------------|-------------|
| MAU (월간 활성 사용자) | 50,000 | 300,000 |
| 계산기 → 회원가입 전환율 | 15% | 25% |
| 유료 중개사 구독 | 100개 | 500개 |
| 거래 성사율 | 30% | 50% |
| NPS (순추천지수) | +30 | +50 |

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Web App    │  │  Mobile App  │  │  Admin Web   │  │  Agent CRM   │    │
│  │  (Next.js)   │  │(React Native)│  │   (React)    │  │   (React)    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │                 │
          └─────────────────┴─────────────────┴─────────────────┘
                                    │
                            ┌───────┴───────┐
                            │   API Gateway  │
                            │   (Kong/AWS)   │
                            └───────┬───────┘
                                    │
┌───────────────────────────────────┴───────────────────────────────────────┐
│                           SERVICE LAYER (K8s)                              │
├───────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │    Auth     │  │   Reality   │  │   Owner     │  │  Move-in    │       │
│  │  Service    │  │   Check     │  │   Signal    │  │  Service    │       │
│  │  (FastAPI)  │  │  (FastAPI)  │  │  (FastAPI)  │  │  (FastAPI)  │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Notification│  │   Payment   │  │    AI/ML    │  │  Analytics  │       │
│  │  Service    │  │   Service   │  │   Service   │  │  Service    │       │
│  │  (FastAPI)  │  │  (FastAPI)  │  │  (FastAPI)  │  │  (FastAPI)  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴───────────────────────────────────────┐
│                           DATA LAYER                                       │
├───────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ PostgreSQL  │  │   Redis     │  │ Pinecone    │  │ Elasticsearch│      │
│  │  (Primary)  │  │  (Cache)    │  │ (Vector DB) │  │  (Search)   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │
│  │    S3       │  │   Kafka     │  │  Polygon    │                        │
│  │  (Storage)  │  │  (Message)  │  │ (Blockchain)│                        │
│  └─────────────┘  └─────────────┘  └─────────────┘                        │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2.2 기술 스택 상세

```yaml
Frontend:
  Web:
    - Framework: Next.js 14 (App Router)
    - State: Zustand + TanStack Query
    - UI: Tailwind CSS + shadcn/ui
    - Map: Kakao Maps SDK
    - Charts: Recharts
    
  Mobile:
    - Framework: React Native 0.73+
    - Navigation: React Navigation 6
    - State: Zustand + TanStack Query
    - Push: Firebase Cloud Messaging

Backend:
  API:
    - Framework: FastAPI (Python 3.11+)
    - ORM: SQLAlchemy 2.0 + Alembic
    - Validation: Pydantic v2
    - Task Queue: Celery + Redis
    
  AI/ML:
    - LLM: OpenAI GPT-4o
    - Orchestration: LangChain
    - Vector DB: Pinecone
    - Rule Engine: Custom Python

Database:
  Primary: PostgreSQL 16
  Cache: Redis 7
  Search: Elasticsearch 8
  Vector: Pinecone
  
Infrastructure:
  Cloud: AWS / NCP (Naver Cloud)
  Container: Docker + Kubernetes (EKS)
  CI/CD: GitHub Actions + ArgoCD
  Monitoring: Prometheus + Grafana
  Log: ELK Stack
  
Blockchain:
  Network: Polygon (Ethereum L2)
  Contract: Solidity 0.8+
  SDK: Web3.py / ethers.js
```

### 2.3 마이크로서비스 구성

```
┌────────────────────────────────────────────────────────────────┐
│                    Service Mesh (Istio)                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AUTH SERVICE                                             │   │
│  │ ├── POST /auth/register (회원가입)                       │   │
│  │ ├── POST /auth/login (로그인)                            │   │
│  │ ├── POST /auth/refresh (토큰 갱신)                       │   │
│  │ ├── POST /auth/verify-phone (본인인증)                   │   │
│  │ └── GET  /auth/me (내 정보)                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ REALITY CHECK SERVICE                                    │   │
│  │ ├── POST /reality/calculate (금융 시뮬레이션)            │   │
│  │ ├── GET  /reality/regulations/{region} (지역 규제 조회)  │   │
│  │ ├── POST /reality/scenarios (시나리오 비교)              │   │
│  │ ├── GET  /reality/reports/{id} (리포트 조회)             │   │
│  │ └── POST /reality/tax-simulation (세금 시뮬레이션)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ OWNER SIGNAL SERVICE                                     │   │
│  │ ├── POST /signals (신호 등록)                            │   │
│  │ ├── GET  /signals/my (내 신호 목록)                      │   │
│  │ ├── PUT  /signals/{id} (신호 수정)                       │   │
│  │ ├── DELETE /signals/{id} (신호 삭제)                     │   │
│  │ ├── GET  /signals/area (지역별 신호 - B2B)               │   │
│  │ └── POST /signals/{id}/contact (접촉 요청)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ MOVE-IN SERVICE                                          │   │
│  │ ├── POST /contracts (계약 등록)                          │   │
│  │ ├── GET  /contracts/{id}/timeline (타임라인 조회)        │   │
│  │ ├── POST /contracts/{id}/tasks (할일 추가)               │   │
│  │ ├── PUT  /tasks/{id}/complete (할일 완료)                │   │
│  │ └── GET  /services/partners (제휴 서비스 목록)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ NOTIFICATION SERVICE                                     │   │
│  │ ├── POST /notifications/push (푸시 발송)                 │   │
│  │ ├── POST /notifications/sms (SMS 발송)                   │   │
│  │ ├── POST /notifications/email (이메일 발송)              │   │
│  │ └── GET  /notifications/history (발송 이력)              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. ERD (Entity Relationship Diagram)

### 3.1 전체 ERD 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RealCare Database Schema                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     users        │       │   user_profiles  │       │ user_financials  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id           │───┐   │ PK id            │       │ PK id            │
│    email         │   │   │ FK user_id      │───────│ FK user_id      │
│    phone         │   └──▶│    name          │       │    annual_income │
│    password_hash │       │    birth_date    │       │    total_assets  │
│    role          │       │    gender        │       │    total_debt    │
│    status        │       │    address       │       │    house_count   │
│    created_at    │       │    profile_image │       │    is_first_home │
│    updated_at    │       │    created_at    │       │    updated_at    │
└────────┬─────────┘       └──────────────────┘       └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ reality_reports  │       │   regulations    │       │  property_types  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │       │ PK id            │
│ FK user_id       │       │    region_code   │       │    name          │
│ FK property_id   │       │    region_name   │       │    description   │
│    reality_score │       │    ltv_limit     │       │    ltv_modifier  │
│    max_loan      │       │    dsr_limit     │       │    tax_rate      │
│    required_cash │       │    acquisition_tax│      └──────────────────┘
│    gap_amount    │       │    is_speculative│
│    action_plan   │       │    effective_date│
│    scenarios     │       │    updated_at    │
│    created_at    │       └──────────────────┘
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  owner_signals   │       │    properties    │       │  signal_types    │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │       │ PK id            │
│ FK owner_id      │───┐   │    address       │       │    name          │
│ FK property_id   │──▶│   │    latitude      │       │    description   │
│ FK signal_type_id│   │   │    longitude     │       └──────────────────┘
│    price_min     │   │   │    area_sqm      │
│    price_max     │   │   │    floor         │
│    is_negotiable │   │   │    building_year │
│    status        │   └──▶│ FK region_id     │
│    view_count    │       │ FK property_type │
│    expires_at    │       │    registry_hash │
│    created_at    │       │    created_at    │
└────────┬─────────┘       └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ contact_requests │       │     agents       │       │ agent_subscriptions│
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │       │ PK id            │
│ FK signal_id     │       │ FK user_id       │       │ FK agent_id      │
│ FK agent_id      │──────▶│    license_no    │◀──────│    plan_type     │
│    message       │       │    office_name   │       │    started_at    │
│    status        │       │    office_address│       │    expires_at    │
│    owner_response│       │    specialization│       │    is_active     │
│    created_at    │       │    rating        │       │    created_at    │
│    responded_at  │       │    verified_at   │       └──────────────────┘
└──────────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    contracts     │       │  contract_tasks  │       │ partner_services │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │       │ PK id            │
│ FK user_id       │───┐   │ FK contract_id   │       │    category      │
│ FK property_id   │   │   │    title         │       │    name          │
│    contract_type │   └──▶│    description   │       │    description   │
│    contract_date │       │    due_date      │       │    contact_info  │
│    move_in_date  │       │    d_day         │       │    commission_rate│
│    price         │       │    status        │       │    is_active     │
│    deposit       │       │    completed_at  │       │    created_at    │
│    monthly_rent  │       │ FK partner_id    │◀──────┴──────────────────┘
│    document_url  │       │    created_at    │
│    blockchain_tx │       └──────────────────┘
│    status        │
│    created_at    │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  notifications   │       │    audit_logs    │
├──────────────────┤       ├──────────────────┤
│ PK id            │       │ PK id            │
│ FK user_id       │       │ FK user_id       │
│    type          │       │    action        │
│    title         │       │    entity_type   │
│    message       │       │    entity_id     │
│    is_read       │       │    old_value     │
│    sent_at       │       │    new_value     │
│    read_at       │       │    ip_address    │
│    metadata      │       │    user_agent    │
└──────────────────┘       │    created_at    │
                           └──────────────────┘
```

### 3.2 테이블 상세 스키마

#### Users (사용자)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- user, agent, admin
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, deleted
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
```

#### User Financials (사용자 재정 정보)

```sql
CREATE TABLE user_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    annual_income BIGINT NOT NULL DEFAULT 0, -- 연소득 (원)
    salary_income BIGINT DEFAULT 0, -- 급여소득
    business_income BIGINT DEFAULT 0, -- 사업소득
    rental_income BIGINT DEFAULT 0, -- 임대소득
    other_income BIGINT DEFAULT 0, -- 기타소득
    total_assets BIGINT NOT NULL DEFAULT 0, -- 총자산
    cash_assets BIGINT DEFAULT 0, -- 현금성 자산
    stock_assets BIGINT DEFAULT 0, -- 주식
    real_estate_assets BIGINT DEFAULT 0, -- 부동산
    total_debt BIGINT NOT NULL DEFAULT 0, -- 총부채
    mortgage_debt BIGINT DEFAULT 0, -- 주담대
    credit_debt BIGINT DEFAULT 0, -- 신용대출
    other_debt BIGINT DEFAULT 0, -- 기타 대출
    house_count INT NOT NULL DEFAULT 0, -- 주택 보유 수
    is_first_home BOOLEAN DEFAULT true, -- 생애최초 여부
    credit_score INT, -- 신용점수 (선택)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_user_financials_user ON user_financials(user_id);
```

#### Reality Reports (금융 시뮬레이션 리포트)

```sql
CREATE TABLE reality_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    property_id UUID REFERENCES properties(id),
    
    -- 입력 정보 스냅샷
    input_snapshot JSONB NOT NULL,
    
    -- 계산 결과
    reality_score INT NOT NULL, -- 0-100
    max_loan_amount BIGINT NOT NULL, -- 최대 대출 가능액
    required_cash BIGINT NOT NULL, -- 필요 자기자본
    gap_amount BIGINT NOT NULL, -- 부족액
    
    -- LTV/DSR 상세
    applied_ltv_rate DECIMAL(5,2), -- 적용 LTV
    applied_dsr_rate DECIMAL(5,2), -- 적용 DSR
    monthly_repayment BIGINT, -- 월 상환액
    
    -- 세금 계산
    acquisition_tax BIGINT, -- 취득세
    holding_tax_yearly BIGINT, -- 연간 보유세
    expected_transfer_tax BIGINT, -- 예상 양도세
    
    -- AI 분석 결과
    action_plan JSONB, -- 행동 계획
    scenarios JSONB, -- 시나리오 비교
    risk_factors JSONB, -- 리스크 요인
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reality_reports_user ON reality_reports(user_id);
CREATE INDEX idx_reality_reports_created ON reality_reports(created_at DESC);
```

#### Owner Signals (소유자 매물 신호)

```sql
CREATE TABLE owner_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id),
    property_id UUID NOT NULL REFERENCES properties(id),
    signal_type_id INT NOT NULL REFERENCES signal_types(id),
    
    -- 가격 정보
    price_min BIGINT, -- 최소 희망가
    price_max BIGINT, -- 최대 희망가
    is_negotiable BOOLEAN DEFAULT false, -- 협의 가능 여부
    
    -- 상태
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, paused, matched, expired
    
    -- 통계
    view_count INT DEFAULT 0,
    contact_count INT DEFAULT 0,
    
    -- 유효기간
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 메타데이터
    additional_info JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_owner_signals_owner ON owner_signals(owner_id);
CREATE INDEX idx_owner_signals_property ON owner_signals(property_id);
CREATE INDEX idx_owner_signals_status ON owner_signals(status);
CREATE INDEX idx_owner_signals_location ON owner_signals USING GIST (
    (SELECT location FROM properties WHERE id = property_id)
);
```

#### Contracts (계약 정보)

```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    property_id UUID NOT NULL REFERENCES properties(id),
    
    -- 계약 정보
    contract_type VARCHAR(20) NOT NULL, -- sale, jeonse, monthly
    contract_date DATE NOT NULL,
    move_in_date DATE NOT NULL,
    
    -- 금액 정보
    total_price BIGINT NOT NULL,
    deposit BIGINT, -- 계약금
    interim_payment BIGINT, -- 중도금
    balance BIGINT, -- 잔금
    monthly_rent BIGINT, -- 월세 (해당시)
    
    -- 문서
    document_url TEXT, -- 계약서 저장 URL
    blockchain_tx VARCHAR(100), -- 블록체인 트랜잭션 해시
    
    -- 상태
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, completed, cancelled
    
    -- 메타데이터
    counterparty_info JSONB, -- 상대방 정보 (암호화)
    special_terms TEXT, -- 특약사항
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contracts_user ON contracts(user_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_move_in ON contracts(move_in_date);
```

---

## 4. API 설계

### 4.1 API 공통 규격

```yaml
Base URL: https://api.realcare.kr/v1

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
  Accept-Language: ko-KR
  X-Request-ID: {uuid}

Response Format:
  success:
    status: 200-299
    body:
      success: true
      data: {...}
      meta:
        timestamp: ISO8601
        request_id: uuid
        
  error:
    status: 400-599
    body:
      success: false
      error:
        code: ERROR_CODE
        message: "Human readable message"
        details: {...}
      meta:
        timestamp: ISO8601
        request_id: uuid

Pagination:
  Query: ?page=1&limit=20&sort=-created_at
  Response:
    meta:
      pagination:
        page: 1
        limit: 20
        total: 100
        total_pages: 5
```

### 4.2 Reality Check API

#### POST /reality/calculate

금융 시뮬레이션 실행

```yaml
Request:
  headers:
    Authorization: Bearer {token}
  body:
    property:
      address: "서울시 강남구 역삼동 123-45"
      price: 1500000000  # 15억
      type: "apartment"
    financial:
      annual_income: 80000000  # 8천만
      total_assets: 300000000  # 3억
      total_debt: 50000000  # 5천만
      house_count: 0
      is_first_home: true
    options:
      include_scenarios: true
      include_tax_analysis: true

Response:
  success: true
  data:
    report_id: "uuid"
    reality_score: 72
    
    loan_analysis:
      max_loan_amount: 750000000  # 7.5억
      applied_ltv: 50
      applied_dsr: 40
      monthly_repayment: 3500000
      
    cash_analysis:
      required_cash: 750000000  # 7.5억
      available_cash: 300000000
      gap_amount: 450000000  # 4.5억 부족
      
    tax_analysis:
      acquisition_tax: 45000000  # 취득세 4500만
      annual_holding_tax: 2000000  # 보유세 200만/년
      estimated_transfer_tax: 80000000  # 양도세 (5년 후)
      
    action_plan:
      - type: "warning"
        message: "현재 자금으로는 4.5억 원이 부족합니다"
      - type: "suggestion"
        message: "신용대출 추가 시 DSR 한도 초과"
      - type: "alternative"
        message: "10억 이하 매물 검토 또는 비규제 지역 고려"
        
    scenarios:
      - name: "현재 매수"
        roi_5year: 12.5
        risk_level: "high"
      - name: "1년 후 매수"
        roi_5year: 15.2
        risk_level: "medium"
```

### 4.3 Owner Signal API

#### POST /signals

매물 신호 등록

```yaml
Request:
  headers:
    Authorization: Bearer {token}
  body:
    property_id: "uuid"
    signal_type: "sale"  # sale, jeonse, monthly
    price:
      min: 1400000000
      max: 1500000000
      negotiable: true
    expires_in_days: 30
    additional_info:
      available_date: "2025-03-01"
      notes: "리모델링 완료"

Response:
  success: true
  data:
    signal_id: "uuid"
    status: "active"
    expires_at: "2025-02-19T00:00:00Z"
    verification_status: "pending"
```

#### GET /signals/area (B2B - 중개사용)

지역별 신호 조회

```yaml
Request:
  headers:
    Authorization: Bearer {agent_token}
  query:
    region_code: "11680"  # 강남구
    signal_type: "sale"
    price_min: 1000000000
    price_max: 2000000000
    page: 1
    limit: 20

Response:
  success: true
  data:
    signals:
      - id: "uuid"
        property:
          address_masked: "서울 강남구 역삼동 ***"  # 상세주소 마스킹
          type: "apartment"
          area_sqm: 84.5
          floor: "중층"
        price_range: "14억 ~ 15억"
        negotiable: true
        reality_qualified_buyers: 12  # 자금 준비된 매수자 수
        posted_days_ago: 5
        
    meta:
      pagination:
        page: 1
        total: 45
```

### 4.4 Smart Move-in API

#### GET /contracts/{id}/timeline

입주 타임라인 조회

```yaml
Request:
  headers:
    Authorization: Bearer {token}
  params:
    id: "contract-uuid"

Response:
  success: true
  data:
    contract:
      id: "uuid"
      move_in_date: "2025-03-15"
      days_remaining: 54
      
    timeline:
      - d_day: -60
        date: "2025-01-14"
        category: "loan"
        title: "대출 상품 비교"
        description: "주택담보대출 금리 비교 및 서류 준비"
        status: "completed"
        partner_service:
          name: "KB국민은행"
          type: "loan_comparison"
          
      - d_day: -45
        date: "2025-01-29"
        category: "interior"
        title: "인테리어 견적"
        description: "필요 시 인테리어 업체 견적 비교"
        status: "in_progress"
        partner_service:
          name: "오늘의집"
          type: "interior_quote"
          
      - d_day: -14
        date: "2025-03-01"
        category: "moving"
        title: "이사 예약"
        description: "이사 업체 예약 및 확정"
        status: "pending"
        partner_service:
          name: "짐싸"
          type: "moving_booking"
          
      - d_day: -7
        date: "2025-03-08"
        category: "finance"
        title: "이체 한도 증액"
        description: "잔금 이체를 위한 이체 한도 증액 신청"
        status: "pending"
        
      - d_day: 0
        date: "2025-03-15"
        category: "move_in"
        title: "입주일"
        description: "잔금 납부 및 입주"
        status: "pending"
        checklist:
          - "잔금 이체 확인"
          - "등기 이전 확인"
          - "관리비 정산"
          - "열쇠 수령"
```

---

## 5. 인증 시스템 (JWT)

### 5.1 인증 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                           │
└─────────────────────────────────────────────────────────────────┘

1. 회원가입 & 로그인
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Client │────▶│  API   │────▶│  Auth  │────▶│  DB    │
│        │     │Gateway │     │Service │     │        │
└────────┘     └────────┘     └────────┘     └────────┘
    │              │              │              │
    │  POST /auth/login          │              │
    │──────────────▶│             │              │
    │              │  Validate   │              │
    │              │─────────────▶│              │
    │              │              │  Query User │
    │              │              │─────────────▶│
    │              │              │◀─────────────│
    │              │              │              │
    │              │  Generate JWT│              │
    │              │◀─────────────│              │
    │              │              │              │
    │  {access_token, refresh_token}            │
    │◀─────────────│              │              │


2. API 요청 (인증된 요청)
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Client │────▶│  API   │────▶│Service │────▶│  DB    │
│        │     │Gateway │     │        │     │        │
└────────┘     └────────┘     └────────┘     └────────┘
    │              │              │              │
    │  GET /api/resource          │              │
    │  Authorization: Bearer {token}             │
    │──────────────▶│             │              │
    │              │              │              │
    │              │  Verify JWT │              │
    │              │─────────────│              │
    │              │              │              │
    │              │  Forward    │              │
    │              │─────────────▶│              │
    │              │              │  Query      │
    │              │              │─────────────▶│
    │              │              │◀─────────────│
    │              │              │              │
    │  Response    │              │              │
    │◀─────────────│◀─────────────│              │


3. 토큰 갱신
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Client │────▶│  API   │────▶│  Auth  │────▶│ Redis  │
│        │     │Gateway │     │Service │     │        │
└────────┘     └────────┘     └────────┘     └────────┘
    │              │              │              │
    │  POST /auth/refresh         │              │
    │  {refresh_token}            │              │
    │──────────────▶│             │              │
    │              │─────────────▶│              │
    │              │              │  Check      │
    │              │              │  Blacklist  │
    │              │              │─────────────▶│
    │              │              │◀─────────────│
    │              │              │              │
    │              │  New tokens │              │
    │              │◀─────────────│              │
    │  {new_access_token, new_refresh_token}    │
    │◀─────────────│              │              │
```

### 5.2 JWT 토큰 구조

```python
# Access Token (30분 유효)
{
    "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "key-id-001"  # Key ID for rotation
    },
    "payload": {
        # Standard Claims
        "iss": "https://api.realcare.kr",
        "sub": "user-uuid",
        "aud": ["realcare-web", "realcare-mobile"],
        "exp": 1705651200,  # 만료시간
        "iat": 1705649400,  # 발급시간
        "nbf": 1705649400,  # 유효시작시간
        "jti": "token-unique-id",  # 토큰 고유 ID
        
        # Custom Claims
        "user": {
            "id": "user-uuid",
            "email": "user@example.com",
            "role": "user",  # user, agent, admin
            "permissions": ["read:profile", "write:signals"]
        },
        "device_id": "device-fingerprint-hash",
        "session_id": "session-uuid"
    },
    "signature": "..."
}

# Refresh Token (7일 유효)
{
    "header": {
        "alg": "RS256",
        "typ": "JWT",
        "kid": "key-id-001"
    },
    "payload": {
        "iss": "https://api.realcare.kr",
        "sub": "user-uuid",
        "exp": 1706254000,
        "iat": 1705649400,
        "jti": "refresh-token-unique-id",
        "type": "refresh",
        "family_id": "token-family-uuid"  # 토큰 체인 추적용
    },
    "signature": "..."
}
```

### 5.3 인증 구현 코드

```python
# app/core/security.py

from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import redis
from uuid import uuid4

# 설정
JWT_SECRET_KEY = "your-secret-key"  # 실제로는 환경변수에서
JWT_ALGORITHM = "RS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
redis_client = redis.Redis(host='localhost', port=6379, db=0)


class TokenService:
    """JWT 토큰 서비스"""
    
    @staticmethod
    def create_access_token(
        user_id: str,
        email: str,
        role: str,
        permissions: list[str],
        device_id: str
    ) -> str:
        """Access Token 생성"""
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = {
            # Standard Claims
            "iss": "https://api.realcare.kr",
            "sub": user_id,
            "aud": ["realcare-web", "realcare-mobile"],
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": str(uuid4()),
            
            # Custom Claims
            "user": {
                "id": user_id,
                "email": email,
                "role": role,
                "permissions": permissions
            },
            "device_id": device_id,
            "type": "access"
        }
        
        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def create_refresh_token(user_id: str, family_id: str = None) -> str:
        """Refresh Token 생성"""
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        payload = {
            "iss": "https://api.realcare.kr",
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": str(uuid4()),
            "type": "refresh",
            "family_id": family_id or str(uuid4())
        }
        
        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """토큰 검증"""
        try:
            # 블랙리스트 체크
            if TokenService.is_blacklisted(token):
                raise HTTPException(status_code=401, detail="Token has been revoked")
            
            payload = jwt.decode(
                token,
                JWT_SECRET_KEY,
                algorithms=[JWT_ALGORITHM],
                audience=["realcare-web", "realcare-mobile"]
            )
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    @staticmethod
    def blacklist_token(token: str, exp: int):
        """토큰 블랙리스트 등록"""
        jti = jwt.decode(token, options={"verify_signature": False})["jti"]
        ttl = exp - int(datetime.utcnow().timestamp())
        if ttl > 0:
            redis_client.setex(f"blacklist:{jti}", ttl, "1")
    
    @staticmethod
    def is_blacklisted(token: str) -> bool:
        """블랙리스트 확인"""
        try:
            jti = jwt.decode(token, options={"verify_signature": False})["jti"]
            return redis_client.exists(f"blacklist:{jti}") == 1
        except:
            return False
    
    @staticmethod
    def rotate_refresh_token(old_refresh_token: str) -> tuple[str, str]:
        """Refresh Token Rotation"""
        payload = TokenService.verify_token(old_refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        # 이전 refresh token 무효화
        TokenService.blacklist_token(old_refresh_token, payload["exp"])
        
        user_id = payload["sub"]
        family_id = payload["family_id"]
        
        # 새 토큰 발급
        # (실제로는 DB에서 사용자 정보 조회 필요)
        new_access_token = TokenService.create_access_token(
            user_id=user_id,
            email="",  # DB에서 조회
            role="user",
            permissions=[],
            device_id=""
        )
        new_refresh_token = TokenService.create_refresh_token(
            user_id=user_id,
            family_id=family_id
        )
        
        return new_access_token, new_refresh_token


# Dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """현재 사용자 정보 추출"""
    token = credentials.credentials
    payload = TokenService.verify_token(token)
    
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    return payload["user"]


# Role-based Access Control
def require_role(allowed_roles: list[str]):
    """역할 기반 접근 제어 데코레이터"""
    async def role_checker(
        current_user: dict = Security(get_current_user)
    ):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


# Permission-based Access Control
def require_permission(permission: str):
    """권한 기반 접근 제어 데코레이터"""
    async def permission_checker(
        current_user: dict = Security(get_current_user)
    ):
        if permission not in current_user.get("permissions", []):
            raise HTTPException(
                status_code=403,
                detail=f"Permission '{permission}' required"
            )
        return current_user
    return permission_checker
```

### 5.4 인증 API 엔드포인트

```python
# app/api/v1/auth.py

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from app.core.security import TokenService, pwd_context
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    phone: str
    name: str
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_id: str
    
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, req: Request):
    """회원가입"""
    user_service = UserService()
    
    # 이메일 중복 체크
    if await user_service.get_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 사용자 생성
    user = await user_service.create_user(
        email=request.email,
        password=request.password,
        phone=request.phone,
        name=request.name
    )
    
    # 토큰 발급
    access_token = TokenService.create_access_token(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
        permissions=user.permissions,
        device_id=req.headers.get("X-Device-ID", "unknown")
    )
    refresh_token = TokenService.create_refresh_token(str(user.id))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800  # 30분
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, req: Request):
    """로그인"""
    user_service = UserService()
    
    # 사용자 조회
    user = await user_service.get_by_email(request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 비밀번호 검증
    if not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 계정 상태 확인
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is not active")
    
    # 로그인 기록 업데이트
    await user_service.update_last_login(user.id)
    
    # 토큰 발급
    access_token = TokenService.create_access_token(
        user_id=str(user.id),
        email=user.email,
        role=user.role,
        permissions=user.permissions,
        device_id=request.device_id
    )
    refresh_token = TokenService.create_refresh_token(str(user.id))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    """토큰 갱신"""
    new_access, new_refresh = TokenService.rotate_refresh_token(refresh_token)
    
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=1800
    )


@router.post("/logout")
async def logout(
    access_token: str,
    refresh_token: str
):
    """로그아웃 (토큰 무효화)"""
    import jwt
    
    # Access Token 블랙리스트 등록
    access_payload = jwt.decode(access_token, options={"verify_signature": False})
    TokenService.blacklist_token(access_token, access_payload["exp"])
    
    # Refresh Token 블랙리스트 등록
    refresh_payload = jwt.decode(refresh_token, options={"verify_signature": False})
    TokenService.blacklist_token(refresh_token, refresh_payload["exp"])
    
    return {"message": "Successfully logged out"}
```

---

## 6. UI/UX 설계

### 6.1 사용자 상태 기반 인터페이스

```
┌─────────────────────────────────────────────────────────────────┐
│                    State-Based UI Architecture                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ STATE 1: 탐색기 (Browser)                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🔍 어느 지역을 보고 계신가요?                              │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  지역 검색...                                       │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  📊 시세조회   │  │  💰 자금진단   │  │  📈 투자분석   │        │
│  │               │  │               │  │               │        │
│  │  실거래가     │  │  Reality     │  │  수익률      │        │
│  │  시세 동향    │  │  Check 시작   │  │  시뮬레이션   │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ STATE 2: 준비기 (Preparer)                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  💼 자금 계획을 세우셨나요?                                │   │
│  │                                                          │   │
│  │  Reality Score: 72/100  ███████████░░░░                  │   │
│  │                                                          │   │
│  │  ┌────────────────────┐  ┌────────────────────┐          │   │
│  │  │ 최대 대출 가능액     │  │ 필요 자기자본       │          │   │
│  │  │ 7.5억              │  │ 4.5억              │          │   │
│  │  └────────────────────┘  └────────────────────┘          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  🏦 대출한도   │  │  📋 세금계산   │  │  🎯 청약가점   │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ STATE 3: 거래기 (Dealer)                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📝 계약을 진행 중이신가요?                                │   │
│  │                                                          │   │
│  │  진행 중인 계약: 2건                                       │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────┐        │   │
│  │  │ 🏠 강남구 역삼동 ***아파트                    │        │   │
│  │  │    매매 | 12억 | 입주예정 D-45               │        │   │
│  │  │    [등기 변동 없음 ✓] [다음 할일: 대출실행]   │        │   │
│  │  └──────────────────────────────────────────────┘        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  📄 계약검토   │  │  🔔 등기알림   │  │  📱 중개사연결  │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ STATE 4: 거주기 (Dweller)                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🏡 우리 집 관리 모드                                      │   │
│  │                                                          │   │
│  │  📍 서울 강남구 역삼동 *** 아파트 101동 1001호            │   │
│  │                                                          │   │
│  │  현재 시세: 15억 2천 (▲ 3개월 +2.1%)                     │   │
│  │  보유기간: 1년 3개월                                       │   │
│  │  예상 양도세: 2,800만원 (단기: 중과)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  💳 관리비     │  │  📊 시세알림   │  │  🔧 하자보수   │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Reality Check 결과 화면

```
┌──────────────────────────────────────────────────────────────────┐
│                     Reality Check 결과                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │            🎯 Reality Score                               │   │
│  │                                                          │   │
│  │                    72                                     │   │
│  │           ████████████████░░░░░                          │   │
│  │                                                          │   │
│  │         "조건부 거래 가능"                                │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │   대출 분석          │  │   자금 분석          │              │
│  ├─────────────────────┤  ├─────────────────────┤              │
│  │ 적용 LTV    50%     │  │ 매물가격    15억     │              │
│  │ 적용 DSR    40%     │  │ 최대대출    7.5억    │              │
│  │ 예상금리    3.8%    │  │ 필요자금    7.5억    │              │
│  │ 월상환액    350만   │  │ 보유자금    3억      │              │
│  │                     │  │ ─────────────────   │              │
│  │                     │  │ 부족액      4.5억 ⚠️ │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📋 Action Plan                                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  ⚠️ 현재 자금으로는 4.5억 원이 부족합니다                   │   │
│  │                                                          │   │
│  │  💡 대안 1: 10억 이하 매물로 조정                          │   │
│  │     → 대출 5억 + 자기자본 3억 = 8억 매물 가능              │   │
│  │                                                          │   │
│  │  💡 대안 2: 비규제 지역 (경기 일부) 검토                    │   │
│  │     → LTV 70% 적용 시 10.5억 대출 가능                    │   │
│  │                                                          │   │
│  │  💡 대안 3: 1년 후 매수 (자금 추가 마련)                    │   │
│  │     → 월 400만원 저축 시 4,800만원 추가 확보               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📊 시나리오 비교                                         │   │
│  ├───────────────┬─────────────┬─────────────┬────────────┤   │
│  │               │ 현재 매수    │ 1년 후 매수  │ 임대사업자 │   │
│  ├───────────────┼─────────────┼─────────────┼────────────┤   │
│  │ 필요자금      │ 7.5억       │ 2.7억       │ 6.5억      │   │
│  │ 5년 후 예상가  │ 16억        │ 16.5억      │ 16억       │   │
│  │ 세후 수익률   │ 8.2%        │ 12.5%       │ 9.8%       │   │
│  │ 리스크        │ 🔴 높음      │ 🟡 중간      │ 🟡 중간     │   │
│  └───────────────┴─────────────┴─────────────┴────────────┘   │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │   📥 리포트 저장        │  │   🔗 공유하기           │        │
│  └────────────────────────┘  └────────────────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 중개사 대시보드 (B2B)

```
┌──────────────────────────────────────────────────────────────────┐
│  RealCare Agent Dashboard                      👤 김중개 공인중개사│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 이번 달 성과                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  신규 리드   │ │  접촉 성공   │ │  거래 성사   │ │  매출      ││
│  │    45건     │ │    23건     │ │    5건      │ │  2,500만원  ││
│  │   ▲ 12%    │ │   ▲ 8%     │ │   ▲ 25%    │ │   ▲ 18%   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🔔 새로운 Owner Signal (관할: 강남구)                     │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ 🏠 역삼동 ***아파트 84㎡ | 매도 | 14~15억            │  │   │
│  │  │    ⏰ 5시간 전 등록 | 조회 23회                       │  │   │
│  │  │    💎 매칭 가능 고객: 8명 (Reality Score 80+)        │  │   │
│  │  │    [접촉 요청] [상세보기]                            │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ 🏠 삼성동 ***빌라 59㎡ | 전세 | 4~4.5억             │  │   │
│  │  │    ⏰ 1일 전 등록 | 조회 45회                        │  │   │
│  │  │    💎 매칭 가능 고객: 15명                          │  │   │
│  │  │    [접촉 요청] [상세보기]                            │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  👥 자금 준비된 고객 (Qualified Leads)                    │   │
│  │                                                          │   │
│  │  필터: [강남구 ▼] [매매 ▼] [10~15억 ▼] [검색]            │   │
│  │                                                          │   │
│  │  ┌───────────────────────────────────────────────────┐   │   │
│  │  │ ID    | Reality | 희망지역  | 예산     | 등록일     │   │   │
│  │  │──────────────────────────────────────────────────│   │   │
│  │  │ #1234 | 92점   | 역삼동    | ~13억    | 2일 전    │   │   │
│  │  │ #1235 | 88점   | 청담동    | ~15억    | 3일 전    │   │   │
│  │  │ #1236 | 85점   | 삼성동    | ~12억    | 5일 전    │   │   │
│  │  └───────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. CI/CD 파이프라인

### 7.1 전체 파이프라인 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline Architecture                   │
└─────────────────────────────────────────────────────────────────┘

┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  Developer │───▶│   GitHub   │───▶│   GitHub   │───▶│   Docker   │
│            │    │            │    │  Actions   │    │    Hub     │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
                        │                                    │
                        │                                    │
                        ▼                                    ▼
                 ┌────────────┐                      ┌────────────┐
                 │   SonarQube │                      │   ArgoCD   │
                 │   (Quality) │                      │ (GitOps)   │
                 └────────────┘                      └────────────┘
                                                            │
                                                            ▼
                                                     ┌────────────┐
                                                     │ Kubernetes │
                                                     │   Cluster  │
                                                     └────────────┘
                                                            │
                        ┌───────────────┬───────────────────┤
                        ▼               ▼                   ▼
                 ┌────────────┐  ┌────────────┐      ┌────────────┐
                 │    Dev     │  │  Staging   │      │ Production │
                 │  Cluster   │  │  Cluster   │      │  Cluster   │
                 └────────────┘  └────────────┘      └────────────┘
```

### 7.2 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml

name: RealCare CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ═══════════════════════════════════════════════════════════════
  # Stage 1: 코드 품질 검사
  # ═══════════════════════════════════════════════════════════════
  code-quality:
    name: Code Quality Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # SonarQube 분석용

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install poetry
          poetry install

      - name: Run linting (Ruff)
        run: poetry run ruff check .

      - name: Run type checking (mypy)
        run: poetry run mypy src/

      - name: Run security check (Bandit)
        run: poetry run bandit -r src/

      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

  # ═══════════════════════════════════════════════════════════════
  # Stage 2: 테스트
  # ═══════════════════════════════════════════════════════════════
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: code-quality
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install poetry
          poetry install

      - name: Run unit tests
        run: poetry run pytest tests/unit -v --cov=src --cov-report=xml
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: poetry run pytest tests/integration -v
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  # ═══════════════════════════════════════════════════════════════
  # Stage 3: 빌드 및 푸시
  # ═══════════════════════════════════════════════════════════════
  build:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    
    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            VERSION=${{ github.sha }}
            BUILD_DATE=${{ github.event.head_commit.timestamp }}

  # ═══════════════════════════════════════════════════════════════
  # Stage 4: 배포 (ArgoCD 트리거)
  # ═══════════════════════════════════════════════════════════════
  deploy-dev:
    name: Deploy to Development
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: development
    
    steps:
      - name: Checkout GitOps repo
        uses: actions/checkout@v4
        with:
          repository: realcare/gitops
          token: ${{ secrets.GITOPS_TOKEN }}

      - name: Update image tag
        run: |
          cd environments/dev
          kustomize edit set image realcare-api=${{ needs.build.outputs.image_tag }}

      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "chore: update dev image to ${{ github.sha }}"
          git push

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: staging
    
    steps:
      - name: Checkout GitOps repo
        uses: actions/checkout@v4
        with:
          repository: realcare/gitops
          token: ${{ secrets.GITOPS_TOKEN }}

      - name: Update image tag
        run: |
          cd environments/staging
          kustomize edit set image realcare-api=${{ needs.build.outputs.image_tag }}

      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "chore: update staging image to ${{ github.sha }}"
          git push

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, deploy-staging]
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Checkout GitOps repo
        uses: actions/checkout@v4
        with:
          repository: realcare/gitops
          token: ${{ secrets.GITOPS_TOKEN }}

      - name: Update image tag
        run: |
          cd environments/production
          kustomize edit set image realcare-api=${{ needs.build.outputs.image_tag }}

      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "chore: update production image to ${{ github.sha }}"
          git push

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          channel-id: 'deploys'
          slack-message: "🚀 Production deployment completed: ${{ github.sha }}"
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

### 7.3 Kubernetes 배포 매니페스트

```yaml
# k8s/base/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: realcare-api
  labels:
    app: realcare-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: realcare-api
  template:
    metadata:
      labels:
        app: realcare-api
    spec:
      containers:
        - name: api
          image: ghcr.io/realcare/api:latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: realcare-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: realcare-secrets
                  key: redis-url
            - name: JWT_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: realcare-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: realcare-api
spec:
  selector:
    app: realcare-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: realcare-api
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.realcare.kr
      secretName: realcare-tls
  rules:
    - host: api.realcare.kr
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: realcare-api
                port:
                  number: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: realcare-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: realcare-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## 8. 보안 및 규제 대응

### 8.1 보안 체계

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Architecture                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                        │
├──────────────────────────────────────────────────────────────────┤
│  - WAF (Web Application Firewall)                                │
│  - DDoS Protection (AWS Shield / Cloudflare)                     │
│  - VPC with Private Subnets                                      │
│  - Security Groups / Network ACLs                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Layer 2: Application Security                                    │
├──────────────────────────────────────────────────────────────────┤
│  - TLS 1.3 (All communications)                                  │
│  - JWT with RS256                                                │
│  - Rate Limiting (per IP, per User)                              │
│  - Input Validation (Pydantic)                                   │
│  - SQL Injection Prevention (SQLAlchemy ORM)                     │
│  - XSS Prevention (Content Security Policy)                      │
│  - CORS Configuration                                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Layer 3: Data Security                                           │
├──────────────────────────────────────────────────────────────────┤
│  - AES-256 Encryption (at rest)                                  │
│  - Field-level Encryption (PII)                                  │
│  - Key Management (AWS KMS)                                      │
│  - Database Encryption (TDE)                                     │
│  - Backup Encryption                                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Layer 4: Compliance & Audit                                      │
├──────────────────────────────────────────────────────────────────┤
│  - Audit Logging (all data access)                               │
│  - GDPR / PIPA Compliance                                        │
│  - Data Retention Policies                                       │
│  - Right to Deletion (RTBF)                                      │
│  - Annual Security Audit                                         │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 규제 대응 체크리스트

```yaml
공인중개사법 대응:
  - [ ] 서비스 내 '매물 광고' 기능 배제
  - [ ] Owner Signal은 B2B 데이터 서비스로 명확히 구분
  - [ ] 면책 문구 삽입: "본 서비스는 중개행위가 아닙니다"
  - [ ] 법령해석 요청서 제출 (국토교통부)

개인정보보호법 대응:
  - [ ] 개인정보 처리방침 작성 및 공개
  - [ ] 동의 수집 절차 구현 (필수/선택 구분)
  - [ ] 암호화 적용 (주민번호, 금융정보)
  - [ ] 개인정보 영향평가 실시
  - [ ] DPO (개인정보보호책임자) 지정

금융소비자보호법 대응:
  - [ ] 대출 상품 '추천' 기능 배제 (시뮬레이션만 제공)
  - [ ] 금융상품판매대리·중개업 등록 검토 (확장 시)
  - [ ] 면책 문구 삽입: "본 계산 결과는 참고용이며..."

전자금융거래법 대응:
  - [ ] 전자서명법 준수
  - [ ] 본인확인 절차 (PASS, 공동인증서)
  - [ ] 거래 기록 5년 보관
```

---

## 9. 개발 로드맵

### 9.1 Phase별 일정

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Roadmap                           │
└─────────────────────────────────────────────────────────────────┘

Phase 1: MVP (Month 1-6)
══════════════════════════════════════════════════════════════════
M1-M2: 기반 구축
├── 프로젝트 셋업 (Poetry, Docker, K8s)
├── CI/CD 파이프라인 구축
├── DB 스키마 설계 및 마이그레이션
└── 인증 시스템 구현 (JWT)

M3-M4: 핵심 기능 개발
├── Reality Check 엔진 개발
│   ├── LTV/DSR 계산 로직
│   ├── 세금 계산 로직
│   └── AI 분석 리포트 생성
├── 사용자 웹 프론트엔드 (Next.js)
└── 기본 API 개발

M5-M6: MVP 완성 및 검증
├── 베타 테스트 (100명)
├── 피드백 반영
├── 성능 최적화
└── 예비창업패키지 지원

Phase 2: Growth (Month 7-12)
══════════════════════════════════════════════════════════════════
M7-M8: Owner Signal 시스템
├── 집주인 등록 플로우
├── 중개사 대시보드
├── B2B 구독 모델
└── 매칭 알고리즘

M9-M10: Smart Move-in OS
├── 계약 관리 시스템
├── 타임라인 자동 생성
├── 제휴 서비스 연동
└── 알림 시스템

M11-M12: 모바일 앱 & 확장
├── React Native 앱 개발
├── 푸시 알림 시스템
├── 중개사 유료 전환
└── 시리즈 A 투자 유치 준비

Phase 3: Scale-up (Year 2+)
══════════════════════════════════════════════════════════════════
├── 금융권 API 연동 (대출 실행)
├── 블록체인 계약 기록
├── 인테리어/이사 O2O 플랫폼
├── 상가/토지로 서비스 확장
└── 데이터 판매 비즈니스
```

### 9.2 팀 구성

```yaml
Phase 1 (MVP):
  총인원: 5명
  - CEO/PM: 1명 (비전, 투자, 규제 대응)
  - Backend Lead: 1명 (시니어, AI/규제 로직)
  - Frontend Lead: 1명 (시니어, Web/Mobile)
  - Full-stack: 1명 (주니어)
  - Designer: 1명 (UI/UX)

Phase 2 (Growth):
  총인원: 10명
  - 경영진: 2명 (CEO, COO)
  - Backend: 3명
  - Frontend: 2명
  - Data/AI: 1명
  - Design: 1명
  - QA: 1명

Phase 3 (Scale-up):
  총인원: 25명+
  - 경영진: 3명
  - 개발팀: 12명
  - 데이터팀: 3명
  - 디자인팀: 2명
  - 영업/마케팅: 3명
  - CS/운영: 2명
```

---

## 📎 부록

### A. 환경 변수 설정

```bash
# .env.example

# Application
APP_NAME=RealCare
APP_ENV=development  # development, staging, production
DEBUG=true

# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/realcare
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=RS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o

# AWS
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=ap-northeast-2
S3_BUCKET=realcare-uploads

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
CONTRACT_ADDRESS=0x...

# External APIs
KAKAO_MAP_API_KEY=xxx
NAVER_CLIENT_ID=xxx
NAVER_CLIENT_SECRET=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### B. API 에러 코드

```yaml
Authentication Errors (1xxx):
  1001: Invalid credentials
  1002: Token expired
  1003: Token invalid
  1004: Refresh token invalid
  1005: Account suspended
  1006: Email not verified

Authorization Errors (2xxx):
  2001: Permission denied
  2002: Resource not found
  2003: Access forbidden
  2004: Rate limit exceeded

Validation Errors (3xxx):
  3001: Invalid request body
  3002: Missing required field
  3003: Invalid field format
  3004: Value out of range

Business Logic Errors (4xxx):
  4001: Reality check failed
  4002: Signal already exists
  4003: Contract conflict
  4004: Subscription expired

External Service Errors (5xxx):
  5001: Database error
  5002: Cache error
  5003: AI service error
  5004: Blockchain error
  5005: External API error
```

---

**문서 버전**: v1.0.0  
**최종 수정일**: 2025-01-19  
**작성자**: RealCare Development Team

---

*이 문서는 RealCare 서비스의 기술적 구현을 위한 가이드라인입니다. 실제 개발 시 비즈니스 요구사항 변경에 따라 수정될 수 있습니다.*
