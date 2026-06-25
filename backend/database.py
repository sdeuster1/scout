import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "scout.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS calls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            country TEXT NOT NULL,
            industry TEXT NOT NULL,
            company_size TEXT NOT NULL,
            contact_title TEXT,
            opener_used TEXT,
            objection_heard TEXT,
            counter_response TEXT,
            key_learning TEXT,
            outcome TEXT NOT NULL,
            brief_useful INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS briefs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            country TEXT NOT NULL,
            industry TEXT NOT NULL,
            company_size TEXT NOT NULL,
            icp_score INTEGER,
            icp_reason TEXT,
            who_to_ask TEXT,
            who_reason TEXT,
            lead_with TEXT,
            expect_objection TEXT,
            counter TEXT,
            call_goal TEXT,
            outcome TEXT,
            brief_useful INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM calls").fetchone()[0]
    if count < 20:
        conn.execute("DELETE FROM calls")
        conn.commit()
        seed_data(conn)

    conn.close()


def seed_data(conn):
    seeds = [
        ("Kavak", "Mexico", "Automotive / Used Cars", "1001-5000", "VP People", "I was looking at Kavak's expansion into 5 markets — managing payroll across Mexico, Brazil, Argentina, Colombia and Turkey must create serious complexity for your People team.", "We use local vendors in each country", "How many separate vendors are you managing right now? Most companies at your scale find that coordinating 5+ vendors costs more in admin hours than a unified platform.", "Multi-country payroll consolidation is top priority for fast-scaling companies", "SQL"),
        ("Konfío", "Mexico", "Fintech / Lending", "201-500", "Head of People Ops", "With Konfío's growth in Mexico and Colombia, I imagine the compliance landscape for hiring across both markets is getting more complex by the quarter.", "Not the right time, we just restructured", "Totally understand — when did the restructure happen? A lot of teams find that post-restructure is actually the ideal time to set up scalable infrastructure.", "Post-restructure timing can be reframed as opportunity", "Connected"),
        ("Rappi", "Colombia", "Delivery / Marketplace", "5001-10000", "CHRO", "Rappi operates across 9 countries with a massive contractor and employee workforce — I'd love to understand how your team handles the contractor vs. employee classification risk across different LATAM jurisdictions.", "Already have a solution with a global PEO", "What does your current setup cost in admin hours per country? Most companies at Rappi's scale find their PEO costs escalate 40% year over year as they grow.", "Large companies with existing solutions respond to cost-escalation framing", "SQL"),
        ("NotCo", "Chile", "Food Tech / AI", "201-500", "People Ops Director", "NotCo's expansion from Chile into the US, Brazil and Mexico is incredible — managing equity compensation and benefits across those four very different regulatory environments must be a challenge.", "Budget freeze until Q3", "Completely understand. Would it make sense to do a quick audit now so you're ready to move when budget opens? Most companies find the evaluation takes 4-6 weeks anyway.", "Budget freeze counter: offer value now, deploy later", "Gatekeeper"),
        ("Nubank", "Brazil", "Fintech / Digital Banking", "5001-10000", "VP People Operations", "With 8,000+ employees across Brazil, Mexico, and Colombia, I'm curious how Nubank's People team handles the Brazil labor law complexity — especially CLT requirements — compared to other markets.", "Not the decision maker, that's our Global Head of People", "Totally fair — would you be open to a quick 10-minute call to help me understand the landscape? I want to make sure when I do reach out to your Global Head, I'm not wasting their time with anything irrelevant.", "Gatekeeper navigation: ask for intel, not the meeting", "SQL"),
        ("Clip", "Mexico", "Payments / POS", "501-1000", "HR Director", "Clip's growth from payments into lending and banking means you're probably hiring very different profiles now — compliance officers, risk analysts. How is your team handling the new hiring complexity?", "We handle everything internally with our HRIS", "That makes sense for Mexico — but as Clip expands, what happens when you need to hire your first employee in Brazil or Colombia? That's usually where internal HRIS hits its limits.", "HRIS limitation framing works for pre-expansion companies", "SQL"),
        ("Bitso", "Mexico", "Crypto / Exchange", "201-500", "Head of People", "Crypto regulation is changing fast across LATAM — with Bitso operating in Mexico, Argentina, Brazil and Colombia, I imagine your hiring and compliance needs shift almost quarterly.", "We use a competitor already", "Interesting — which aspects are working well? We've found that most crypto companies need more flexibility around contractor management than traditional platforms offer, especially with the regulatory shifts.", "For competitor users: probe satisfaction gaps rather than hard-sell", "SQL"),
        ("Merama", "Mexico", "E-commerce / Aggregator", "201-500", "VP People", "Merama acquires and operates brands across multiple LATAM markets — each acquisition must bring a new set of employees with different contracts, benefits, and compliance requirements.", "Not the right time, focusing on profitability", "I hear that a lot right now. Actually, that's exactly why companies like Merama talk to us — consolidating payroll vendors across your portfolio companies typically saves 30-40% in admin overhead.", "Profitability focus: lead with cost reduction", "SQL"),
        ("Frubana", "Colombia", "AgTech / B2B Marketplace", "501-1000", "People Ops Director", "Frubana connects farmers to restaurants across Colombia, Mexico, and Brazil — managing a workforce that spans warehouse workers, drivers, and tech talent across three countries must require very different employment approaches.", "We're too small for an international payroll solution", "That's actually our sweet spot — companies between 500-1000 employees are exactly where managing multi-country payroll internally starts costing more than outsourcing it. What does your current monthly admin burden look like?", "Size objection counter: show the inflection point", "SQL"),
        ("Loft", "Brazil", "PropTech / Real Estate", "1001-5000", "CHRO", "Loft's pivot and restructuring must have created complex workforce challenges — managing layoffs in Brazil with CLT requirements while simultaneously hiring in new areas.", "Already went through a big restructure, not looking at new vendors", "Completely understand. After a restructure is actually when most companies discover their existing setup has gaps — especially around severance calculations and compliance in Brazil. Would a quick compliance audit be useful just to make sure nothing was missed?", "Post-restructure compliance audit offer works in Brazil", "SQL"),
        ("Gympass", "Brazil", "HR Tech / Wellness", "1001-5000", "VP People Operations", "Gympass — or Wellhub now — operates in 11 countries. Managing employee benefits that vary this much by market, especially the mandatory benefits in Brazil versus the US, must be incredibly complex.", "We built our own internal tools for this", "That's impressive. How much engineering time goes into maintaining those tools? We've found that companies who built internally 3+ years ago are now spending more on maintenance than they would on a dedicated platform.", "Internal tools: probe maintenance cost", "Connected"),
        ("Mercado Libre", "Argentina", "E-commerce / Fintech", "10001+", "Regional Head of People, LATAM", "MeLi operates in 18 countries with 40,000+ employees — I'd love to understand how the People team handles the sheer complexity of Argentina's employment regulations compared to Brazil or Mexico.", "We have a massive internal team for this, 200+ people in HR", "With 200+ people, you clearly take this seriously. The question is whether those 200 people are spending time on strategic work or on manual compliance tasks. What percentage of their time goes to payroll processing versus talent strategy?", "For enterprise: shift from replacement to augmentation framing", "SQL"),
        ("Ualá", "Argentina", "Fintech / Neobank", "1001-5000", "Head of People Ops", "Ualá's expansion from Argentina into Mexico and Colombia means navigating three very different regulatory environments. Argentina's currency controls alone must create payroll complexity.", "Not the decision maker, need to check with CFO", "Of course — would it help if I put together a one-page cost comparison that your CFO could review? I want to make sure the business case is clear before taking anyone's time.", "CFO involvement: offer to build the business case", "Gatekeeper"),
        ("Cornershop", "Chile", "Delivery / Grocery", "501-1000", "HR Director", "Now that Cornershop is part of Uber, I imagine the integration of HR systems across Chile, Mexico and the broader Uber infrastructure has been complex.", "We're being integrated into Uber's systems", "That makes sense. During integrations like this, there's usually a 6-12 month gap where the legacy systems and the new systems don't talk to each other. How is your team handling payroll during the transition?", "M&A integration gap is a real pain point", "Connected"),
        ("Kushki", "Ecuador", "Payments / Infrastructure", "201-500", "People Ops Director", "Kushki processes payments across 5 LATAM markets — as you expand the team to cover each market, the hiring complexity must grow exponentially. Ecuador, Colombia, Mexico, Chile, Peru all have very different employment laws.", "We're focused on product right now, not HR infrastructure", "Totally get it — product is king. Quick question though: how much time does your People team spend each month on multi-country compliance? If it's more than a few hours, that's time being pulled from supporting your product team.", "Product-focused counter: frame as enabling product velocity", "No answer"),
        ("dLocal", "Uruguay", "Payments / Infrastructure", "501-1000", "VP People", "dLocal processes payments in 40 countries — with engineering hubs in Uruguay, Argentina and Brazil, each with different tax structures, the payroll puzzle must be intense.", "We already have payroll sorted across our hubs", "Makes sense for the current setup. What happens when you open hub number four? Most companies find that each new country adds 15-20 hours/month of compliance overhead on top of the existing workload.", "Hub expansion framing works well for payments companies scaling engineering teams", "SQL"),
        ("Platzi", "Colombia", "EdTech / Online Learning", "201-500", "Head of People", "Platzi has a fully remote team spread across LATAM — managing contractors vs employees across Colombia, Mexico, Argentina and beyond must create classification headaches.", "We classify everyone as contractors, it's simpler", "That works until a local labor authority disagrees. In Colombia and Brazil especially, misclassification fines have gone up 3x in the past two years. Have you had a recent compliance review?", "Contractor misclassification is a ticking time bomb — fear of fines drives urgency", "SQL"),
        ("Tiendanube", "Argentina", "E-commerce / Platform", "501-1000", "People Ops Lead", "Tiendanube powering 100K+ stores across Argentina, Brazil and Mexico — three very different employment regulatory environments for one product team to navigate.", "Our Argentina team handles everything, we don't need external help", "How much of their week goes to compliance paperwork vs. actually supporting your people? Most teams at your stage are spending 30-40% of People team time on manual admin across countries.", "Quantify the hidden time cost of doing it internally — makes the ROI concrete", "SQL"),
        ("Creditas", "Brazil", "Fintech / Lending", "1001-5000", "CHRO", "Creditas just expanded into Mexico — going from a purely Brazilian operation to multi-country means a whole new layer of payroll and benefits complexity.", "We're still figuring out our Mexico structure", "That's actually the best time to talk. Companies that set up the right infrastructure before they scale in a new market save 6+ months of rework later. Would a 15-minute call to share what other Brazilian fintechs did in Mexico be useful?", "Catch companies during their 'figuring it out' phase — they're most open to help", "SQL"),
        ("Globant", "Argentina", "IT Services / Consulting", "10001+", "Regional HR Director", "Globant has 25,000+ employees across 20+ countries — the sheer scale of managing local compliance in each must require a massive operations team.", "We have dedicated teams in each country already", "With dedicated teams in 20 countries, what does your total cost of People operations look like? Companies your size often find that centralizing onto one platform reduces headcount needs by 20-30% while improving accuracy.", "For very large companies: frame as operational efficiency, not replacement", "Connected"),
        ("Habi", "Colombia", "PropTech / Real Estate", "201-500", "Head of People", "Habi's expansion from Colombia into Mexico means navigating two markets with very different real estate and employment regulations simultaneously.", "We just started in Mexico, too early to change anything", "Exactly why now is the moment — you're building the playbook from scratch. The cost of fixing a bad setup later is 5x the cost of getting it right now. What does your Mexico hiring plan look like for the next 6 months?", "Early-stage expansion is the best entry point — position as building right from day one", "SQL"),
        ("Flink", "Mexico", "Fintech / Investing", "201-500", "People Ops Manager", "Flink democratizing investing for Mexico — as you grow the team and potentially expand to Colombia or Brazil, the compliance landscape gets complex fast.", "Budget is really tight right now, can't add new vendors", "Totally understand. What if I showed you how Deel actually reduces total cost? Most companies at your stage spend $2-3K/month on scattered tools and accountant fees that a single platform replaces for less.", "For budget objections in smaller companies: reframe as cost reduction, not new spend", "SQL"),
        ("Addi", "Colombia", "Fintech / BNPL", "201-500", "VP of People", "Addi's buy-now-pay-later model is growing fast across Colombia and Brazil — two markets with some of the most complex employment laws in LATAM.", "We need to focus on hiring right now, not infrastructure", "Hiring is exactly where this matters — how quickly can you onboard someone in Brazil today? Companies using Deel cut time-to-hire from 6 weeks to 5 days in new markets. That directly accelerates your growth.", "Connect infrastructure to hiring speed — makes it a growth enabler, not overhead", "SQL"),
        ("Betterfly", "Chile", "InsurTech / Benefits", "501-1000", "CHRO", "Betterfly operates across Chile, Brazil, Mexico, Colombia and more — each market has wildly different mandatory benefits requirements. How do you keep track of it all?", "We have a benefits broker in each country", "How much time does your team spend coordinating between all those brokers? And how confident are you that every country is fully compliant right now? That's the gap where most companies get surprised.", "Multi-broker coordination fatigue is real — consolidation pitch resonates with CHROs", "Connected"),
        ("Clara", "Mexico", "Fintech / Corporate Cards", "201-500", "Head of People Ops", "Clara's corporate card is live across Mexico, Brazil and Colombia — managing a team across those three markets with different labor laws must create friction.", "We're happy with our current setup", "Great to hear. Quick question — when was the last time you audited your contractor classifications in Brazil? The labor courts there have been especially aggressive this year.", "Even happy customers respond to compliance risk — it creates urgency without being pushy", "Gatekeeper"),
        ("Crehana", "Peru", "EdTech / HR Tech", "201-500", "People Director", "Crehana's pivot from online courses into HR software means you're now selling to the same buyers you need internally — People leaders. How are you handling multi-country HR for your own team?", "We use our own platform for some of it", "That's smart for the training side. But payroll, compliance, contractor management — those are different beasts. Have you found gaps between what your platform covers and what you actually need across Peru, Mexico, and Colombia?", "Companies building HR tools often neglect their own HR infrastructure — the irony creates an opening", "SQL"),
    ]

    conn.executemany(
        """INSERT INTO calls (company, country, industry, company_size, contact_title,
           opener_used, objection_heard, counter_response, key_learning, outcome)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        seeds,
    )
    conn.commit()
