from pydantic import BaseModel
from typing import Optional


class CompanyInput(BaseModel):
    company_name: str
    country: str
    industry: str
    company_size: str


class BriefResponse(BaseModel):
    company: str
    country: str
    industry: str
    company_size: str
    icp_score: int
    icp_reason: str
    who_to_ask: str
    who_reason: str
    lead_with: str
    expect_objection: str
    counter: str
    call_goal: str


class CallLog(BaseModel):
    brief_id: Optional[int] = None
    company: str
    country: str
    industry: str
    company_size: str
    outcome: str
    brief_useful: Optional[bool] = None


class TranscriptInput(BaseModel):
    transcript: str
    outcome: str


class BriefFeedback(BaseModel):
    brief_id: int
    useful: bool


class OutcomeLog(BaseModel):
    brief_id: int
    outcome: str
