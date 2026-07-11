/**
 * Curated catalog of free-resource providers, injected into the Planner
 * agent's prompt. Two jobs:
 *
 * 1. Anchor the model to providers that are genuinely free, so plans never
 *    contain paywalled content.
 * 2. Give SAFE deep-link patterns. LLMs hallucinate course URLs; when the
 *    model isn't certain of an exact page, it must use the provider's
 *    search/catalog pattern below so the link always lands somewhere correct.
 *    The link checker in lib/verify-links.ts is the final safety net.
 */
export const RESOURCE_CATALOG = `
FREE RESOURCE PROVIDERS (only recommend from providers like these; everything must be free to consume):

Programming / Data / Tech
- freeCodeCamp — https://www.freecodecamp.org/learn — full curricula + FREE verified certifications anyone can take (Responsive Web Design, JS, Data Analysis with Python, Relational Databases/SQL, etc.). Cert pages: https://www.freecodecamp.org/learn/<cert-slug>/
- Kaggle Learn — https://www.kaggle.com/learn — short practical courses (Python, Pandas, SQL, Intro ML) with free completion certificates. Course pattern: https://www.kaggle.com/learn/<course-slug>
- The Odin Project — https://www.theodinproject.com/paths — free full-stack paths.
- MIT OpenCourseWare — https://ocw.mit.edu/search/?q=<query> — free university courses.
- CS50 (Harvard) — https://cs50.harvard.edu/x/ — free, free certificate from cs50.harvard.edu.
- SQLBolt — https://sqlbolt.com — interactive SQL basics.
- Mode SQL Tutorial — https://mode.com/sql-tutorial/ — analyst-focused SQL.
- Microsoft Learn — https://learn.microsoft.com/en-us/training/browse/?terms=<query> — free modules/paths for Excel, Power BI, Azure, Dynamics; free Applied Skills credentials at https://learn.microsoft.com/en-us/credentials/browse/?credential_types=applied%20skills (note: role-based cert EXAMS cost money — say so if recommending one).
- Google Skillshop — https://skillshop.docebosaas.com/pages/16/home (Analytics, Ads) — free certifications anyone can take.
- Google Cloud Skills Boost — https://www.cloudskillsboost.google/catalog?price=free — free courses/labs.
- AWS Skill Builder (free tier) — https://explore.skillbuilder.aws/learn/catalog?ctldoc-catalog-0=se-%22free%22 — free digital courses; AWS cert EXAMS cost money (flag this).
- IBM SkillsBuild — https://skillsbuild.org — free courses + digital credentials.
- Khan Academy — https://www.khanacademy.org/search?page_search_query=<query> — math, statistics, finance, economics.
- YouTube — https://www.youtube.com/results?search_query=<query> — name the specific channel/series (e.g. freeCodeCamp.org, 3Blue1Brown, Leila Gharani for Excel/Power BI).

Business / Finance / Analyst
- Corporate Finance Institute free courses — https://corporatefinanceinstitute.com/collections/#free — free fundamentals with certificates.
- HubSpot Academy — https://academy.hubspot.com/courses?price=free — free marketing/sales/ops certifications.
- Coursera (audit mode) — https://www.coursera.org/search?query=<query> — most courses free to AUDIT (no certificate unless paid; say "audit for free").
- edX (audit mode) — https://www.edx.org/search?q=<query> — same audit rule.
- Alison — https://alison.com/courses?query=<query> — free courses/diplomas (paper certificate costs, learning is free).
- OpenLearn (Open University) — https://www.open.edu/openlearn/free-courses/full-catalogue — free courses with statements of participation.
- Salesforce Trailhead — https://trailhead.salesforce.com/search?keywords=<query> — free learning + badges (cert exams cost money; flag).
- Oracle MyLearn free — https://mylearn.oracle.com/ou/home — some free learning paths.
- Wall Street Prep / Macabacus free resources — free Excel & modeling templates and articles.

Practice / Interview
- LeetCode free tier — https://leetcode.com/problemset/ — coding practice.
- StrataScratch free questions — https://www.stratascratch.com — data/SQL interview questions.
- interviewing.io learn — https://interviewing.io/learn — free interview guides.
- Glassdoor interview questions — https://www.glassdoor.com/Interview/index.htm — company-specific questions.

HARD RULES ABOUT CERTIFICATIONS:
- Only recommend certifications that ANY member of the public can register for and complete free of charge (freeCodeCamp, Kaggle, Google Skillshop, HubSpot Academy, CFI free tier, IBM SkillsBuild, CS50).
- NEVER recommend certifications that require an employer to own/license the system, e.g. Workday Pro, NetSuite (SuiteFoundation requires partner/customer access), SAP certifications tied to customer systems, Oracle Cloud certs requiring paid exams. If such a system appears in the JD, say exactly that, and point to the closest FREE public alternative (vendor free training, YouTube deep-dives, community sandboxes like Salesforce Developer Edition, SAP Learning Hub free tier).
- If an exam costs money but the training is free, recommend the training and clearly note the exam fee.

HARD RULES ABOUT LINKS:
- Deep-link to the exact course/lesson page ONLY when you are certain the URL is real and stable (patterns above).
- If not certain, use the provider's search/catalog URL pattern with the query filled in — never invent a plausible-looking course URL.
`;
