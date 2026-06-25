import json
import csv
import io
import os
import urllib.request
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import anthropic

from database import init_db, get_db
from models import (
    BriefFeedback,
    OutcomeLog,
    TranscriptInput,
)

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Scout API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic()

SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL", "")
SCOUT_URL = os.environ.get("SCOUT_URL", "https://scout-khaki-nine.vercel.app")


def send_slack_notification(company: str, country: str):
    if not SLACK_WEBHOOK_URL:
        print("SLACK_WEBHOOK_URL not set, skipping notification")
        return
    payload = json.dumps({
        "text": f"🎯 *SQL booked!* — *{company}* ({country})\nPlease upload your call transcript: <{SCOUT_URL}|Open Scout — Upload Transcript>"
    }).encode("utf-8")
    req = urllib.request.Request(
        SLACK_WEBHOOK_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        resp = urllib.request.urlopen(req)
        print(f"Slack notification sent: {resp.status}")
    except Exception as e:
        print(f"Slack notification failed: {e}")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


def get_past_calls_context(conn, industry: str, country: str, company_size: str) -> str:
    rows = conn.execute(
        """SELECT company, contact_title, opener_used, objection_heard, counter_response,
                  key_learning, outcome FROM calls
           WHERE (industry LIKE ? OR country = ? OR company_size = ?)
           ORDER BY created_at DESC LIMIT 10""",
        (f"%{industry}%", country, company_size),
    ).fetchall()

    if not rows:
        return "No past call data available for similar companies."

    lines = []
    for r in rows:
        lines.append(
            f"- {r['company']} ({r['outcome']}): contacted {r['contact_title']}. "
            f"Opener: {r['opener_used'] or 'N/A'}. "
            f"Objection: {r['objection_heard'] or 'N/A'}. "
            f"Counter: {r['counter_response'] or 'N/A'}. "
            f"Learning: {r['key_learning'] or 'N/A'}"
        )
    return "\n".join(lines)


def get_brief_accuracy(conn) -> float:
    row = conn.execute(
        "SELECT COUNT(*) as total, SUM(CASE WHEN brief_useful = 1 THEN 1 ELSE 0 END) as useful FROM briefs WHERE brief_useful IS NOT NULL"
    ).fetchone()
    if row["total"] == 0:
        return 0.85
    return row["useful"] / row["total"]


@app.post("/api/generate-briefs")
async def generate_briefs(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]
    field_map = {}
    for f in reader.fieldnames or []:
        fl = f.strip().lower()
        if "company" in fl and "size" not in fl:
            field_map["company_name"] = f
        elif "country" in fl:
            field_map["country"] = f
        elif "industry" in fl:
            field_map["industry"] = f
        elif "size" in fl or "employees" in fl:
            field_map["company_size"] = f

    for f in reader.fieldnames or []:
        fl = f.strip().lower()
        if fl in ("contact", "contact name", "contact_name", "name", "person"):
            field_map["contact_name"] = f
        elif fl in ("position", "title", "role", "contact_position", "contact_title", "job title", "job_title"):
            field_map["contact_position"] = f

    required = ["company_name", "country", "industry", "company_size"]
    missing = [r for r in required if r not in field_map]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV missing columns: {missing}. Expected: company name, country, industry, company size",
        )

    companies = []
    for row in reader:
        comp = {
            "company_name": row[field_map["company_name"]].strip(),
            "country": row[field_map["country"]].strip(),
            "industry": row[field_map["industry"]].strip(),
            "company_size": row[field_map["company_size"]].strip(),
        }
        if "contact_name" in field_map and row.get(field_map["contact_name"], "").strip():
            comp["contact_name"] = row[field_map["contact_name"]].strip()
        if "contact_position" in field_map and row.get(field_map["contact_position"], "").strip():
            comp["contact_position"] = row[field_map["contact_position"]].strip()
        companies.append(comp)

    if not companies:
        raise HTTPException(status_code=400, detail="CSV contains no data rows")

    conn = get_db()
    accuracy = get_brief_accuracy(conn)

    all_past_context = set()
    for comp in companies:
        ctx = get_past_calls_context(conn, comp["industry"], comp["country"], comp["company_size"])
        if ctx != "No past call data available for similar companies.":
            all_past_context.add(ctx)
    past_context = "\n".join(all_past_context) if all_past_context else "No past call data available."

    companies_block = "\n".join(
        f"{i+1}. {c['company_name']} | {c['country']} | {c['industry']} | {c['company_size']}"
        + (f" | Contact: {c['contact_name']}" if c.get('contact_name') else "")
        + (f", {c['contact_position']}" if c.get('contact_position') else "")
        for i, c in enumerate(companies)
    )

    prompt = f"""You are Scout, a pre-call intelligence assistant for SDRs selling Deel (international payroll and HR platform) to LATAM companies.

Generate pre-call briefs for ALL companies below in one response. Use the past call data to inform your recommendations.

COMPANIES:
{companies_block}

PAST CALLS WITH SIMILAR COMPANIES:
{past_context}

BRIEF ACCURACY SO FAR: {accuracy:.0%} of briefs marked useful by SDRs.

Return a JSON array with one object per company, in the same order. Each object must have:
- company_name: the company name exactly as listed
- icp_score: integer 1-10, how well this company fits Deel's ICP
- icp_reason: one sentence explaining the score
- who_to_ask: specific job title to target
- who_reason: why this title is the right entry point
- lead_with: 2-3 short bullet points (each under 10 words) with specific opener angles for this company. Use "• " prefix for each bullet.
- expect_objection: the most likely objection, one short sentence max
- counter: a short punchy counter-response, one sentence max (under 20 words)
- call_goal: what specifically to achieve on this call, one short sentence

Be specific and actionable. Reference each company by name. Keep everything concise and scannable.
Return ONLY a valid JSON array, no markdown formatting."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        response_text = message.content[0].text
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1].rsplit("```", 1)[0]
        brief_list = json.loads(response_text)
    except (json.JSONDecodeError, IndexError):
        brief_list = []

    briefs = []
    for i, comp in enumerate(companies):
        if i < len(brief_list):
            brief_data = brief_list[i]
        else:
            brief_data = {
                "icp_score": 5,
                "icp_reason": "Unable to generate — review manually",
                "who_to_ask": "Head of People Operations",
                "who_reason": "Default recommendation",
                "lead_with": f"I'd love to learn how {comp['company_name']} handles international payroll.",
                "expect_objection": "Not the right time",
                "counter": "When would be a better time to revisit?",
                "call_goal": "Book a discovery call",
            }

        def to_str(v):
            if isinstance(v, list):
                return "\n".join(f"• {item}" if not str(item).startswith("•") else str(item) for item in v)
            return str(v) if v is not None else ""

        brief_id = conn.execute(
            """INSERT INTO briefs (company, country, industry, company_size,
               icp_score, icp_reason, who_to_ask, who_reason, lead_with,
               expect_objection, counter, call_goal)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                comp["company_name"], comp["country"], comp["industry"],
                comp["company_size"], int(brief_data.get("icp_score", 5)),
                to_str(brief_data.get("icp_reason", "")),
                to_str(brief_data.get("who_to_ask", "")),
                to_str(brief_data.get("who_reason", "")),
                to_str(brief_data.get("lead_with", "")),
                to_str(brief_data.get("expect_objection", "")),
                to_str(brief_data.get("counter", "")),
                to_str(brief_data.get("call_goal", "")),
            ),
        ).lastrowid
        conn.commit()

        brief_obj = {
            "id": brief_id,
            "company": comp["company_name"],
            "country": comp["country"],
            "industry": comp["industry"],
            "company_size": comp["company_size"],
            **{k: brief_data.get(k, "") for k in [
                "icp_score", "icp_reason", "who_to_ask", "who_reason",
                "lead_with", "expect_objection", "counter", "call_goal"
            ]},
        }
        if comp.get("contact_name"):
            brief_obj["contact_name"] = comp["contact_name"]
        if comp.get("contact_position"):
            brief_obj["contact_position"] = comp["contact_position"]
        briefs.append(brief_obj)

    conn.close()
    return {"briefs": briefs, "total": len(briefs)}


@app.post("/api/log-outcome")
async def log_outcome(data: OutcomeLog):
    conn = get_db()
    brief = conn.execute("SELECT * FROM briefs WHERE id = ?", (data.brief_id,)).fetchone()
    if not brief:
        conn.close()
        raise HTTPException(status_code=404, detail="Brief not found")

    conn.execute("UPDATE briefs SET outcome = ? WHERE id = ?", (data.outcome, data.brief_id))

    conn.execute(
        """INSERT INTO calls (company, country, industry, company_size,
           contact_title, opener_used, objection_heard, counter_response, outcome)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            brief["company"], brief["country"], brief["industry"],
            brief["company_size"], brief["who_to_ask"], brief["lead_with"],
            brief["expect_objection"], brief["counter"], data.outcome,
        ),
    )
    conn.commit()
    conn.close()

    if data.outcome == "SQL":
        send_slack_notification(brief["company"], brief["country"])

    return {"status": "ok"}


@app.post("/api/log-feedback")
async def log_feedback(data: BriefFeedback):
    conn = get_db()
    conn.execute(
        "UPDATE briefs SET brief_useful = ? WHERE id = ?",
        (1 if data.useful else 0, data.brief_id),
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.post("/api/upload-transcript")
async def upload_transcript(data: TranscriptInput):
    prompt = f"""Analyze this sales call transcript and extract structured data.

TRANSCRIPT:
{data.transcript}

OUTCOME: {data.outcome}

Extract and return a JSON object with these fields:
- company: company name discussed
- country: country of the company
- industry: industry/sector
- company_size: estimated size (e.g. "201-500", "1001-5000")
- contact_title: title of the person contacted
- opener_used: the opening line or approach used
- objection_heard: main objection raised (or null if none)
- counter_response: how the SDR responded to the objection (or null)
- key_learning: one sentence summary of the key takeaway from this call

Return ONLY valid JSON, no markdown formatting."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        response_text = message.content[0].text
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1].rsplit("```", 1)[0]
        extracted = json.loads(response_text)
    except (json.JSONDecodeError, IndexError):
        raise HTTPException(status_code=500, detail="Failed to parse transcript")

    conn = get_db()
    conn.execute(
        """INSERT INTO calls (company, country, industry, company_size, contact_title,
           opener_used, objection_heard, counter_response, key_learning, outcome)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            extracted.get("company", "Unknown"),
            extracted.get("country", "Unknown"),
            extracted.get("industry", "Unknown"),
            extracted.get("company_size", "Unknown"),
            extracted.get("contact_title"),
            extracted.get("opener_used"),
            extracted.get("objection_heard"),
            extracted.get("counter_response"),
            extracted.get("key_learning"),
            data.outcome,
        ),
    )
    conn.commit()
    conn.close()

    return {"extracted": extracted, "outcome": data.outcome}


def _group_objections_by_industry(rows):
    grouped = {}
    for r in rows:
        ind = r["industry"]
        if ind not in grouped:
            grouped[ind] = []
        if len(grouped[ind]) < 3:
            grouped[ind].append({
                "objection": r["objection_heard"],
                "counter": r["counter_response"],
                "times": r["times"],
                "worked": r["worked"],
            })
    return [{"industry": k, "objections": v} for k, v in grouped.items()]


@app.get("/api/knowledge-base")
async def knowledge_base():
    conn = get_db()

    total = conn.execute("SELECT COUNT(*) as c FROM calls").fetchone()["c"]
    sqls = conn.execute("SELECT COUNT(*) as c FROM calls WHERE outcome = 'SQL'").fetchone()["c"]
    win_rate = (sqls / total * 100) if total > 0 else 0

    useful = conn.execute(
        "SELECT COUNT(*) as c FROM briefs WHERE brief_useful = 1"
    ).fetchone()["c"]
    total_rated = conn.execute(
        "SELECT COUNT(*) as c FROM briefs WHERE brief_useful IS NOT NULL"
    ).fetchone()["c"]
    accuracy = (useful / total_rated * 100) if total_rated > 0 else 0

    learnings = conn.execute(
        """SELECT key_learning, company, industry, outcome, created_at
           FROM calls WHERE key_learning IS NOT NULL AND key_learning != ''
           ORDER BY created_at DESC LIMIT 10"""
    ).fetchall()

    objections_by_industry = conn.execute(
        """SELECT industry, objection_heard, counter_response, outcome,
           COUNT(*) as times,
           SUM(CASE WHEN outcome = 'SQL' THEN 1 ELSE 0 END) as worked
           FROM calls WHERE objection_heard IS NOT NULL
           GROUP BY industry, objection_heard
           ORDER BY industry, times DESC"""
    ).fetchall()

    titles = conn.execute(
        """SELECT contact_title, company_size, COUNT(*) as times,
           SUM(CASE WHEN outcome = 'SQL' THEN 1 ELSE 0 END) as sql_count
           FROM calls WHERE contact_title IS NOT NULL
           GROUP BY contact_title, company_size ORDER BY sql_count DESC LIMIT 8"""
    ).fetchall()

    industries = conn.execute(
        """SELECT industry, COUNT(*) as total,
           SUM(CASE WHEN outcome = 'SQL' THEN 1 ELSE 0 END) as sqls
           FROM calls GROUP BY industry ORDER BY sqls DESC LIMIT 8"""
    ).fetchall()

    countries = conn.execute(
        """SELECT country, COUNT(*) as total,
           SUM(CASE WHEN outcome = 'SQL' THEN 1 ELSE 0 END) as sqls
           FROM calls GROUP BY country ORDER BY total DESC"""
    ).fetchall()

    return {
        "total_calls": total,
        "total_sqls": sqls,
        "win_rate": round(win_rate, 1),
        "brief_accuracy": round(accuracy, 1),
        "key_learnings": [
            {
                "learning": r["key_learning"],
                "company": r["company"],
                "industry": r["industry"],
                "outcome": r["outcome"],
            }
            for r in learnings
        ],
        "objections_by_industry": _group_objections_by_industry(objections_by_industry),
        "best_titles": [
            {
                "title": r["contact_title"],
                "company_size": r["company_size"],
                "times": r["times"],
                "sql_count": r["sql_count"],
            }
            for r in titles
        ],
        "best_industries": [
            {
                "industry": r["industry"],
                "total": r["total"],
                "sqls": r["sqls"],
                "win_rate": round(r["sqls"] / r["total"] * 100, 1) if r["total"] > 0 else 0,
            }
            for r in industries
        ],
        "countries": [
            {
                "country": r["country"],
                "total": r["total"],
                "sqls": r["sqls"],
                "win_rate": round(r["sqls"] / r["total"] * 100, 1) if r["total"] > 0 else 0,
            }
            for r in countries
        ],
    }


@app.post("/api/upload-transcript-file")
async def upload_transcript_file(file: UploadFile = File(...), outcome: str = Form(...)):
    content = await file.read()
    text = content.decode("utf-8")
    data = TranscriptInput(transcript=text, outcome=outcome)
    return await upload_transcript(data)
