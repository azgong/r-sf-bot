/**
 * COMPETITION KNOWLEDGE BASE
 * ===========================
 * Factual, verified information about the Canadian science fair pathway,
 * separate from coaching judgment (stage-prompts.ts). This file answers
 * "what is true about the competition landscape," while stage-prompts.ts
 * answers "how should the coach behave."
 *
 * IMPORTANT — KEEP THIS CURRENT:
 * Competition rules, deadlines, and pathways change. The ISEF selection
 * process changed significantly in 2025 (direct application was removed).
 * Re-verify facts here at least once a year, ideally each fall before a
 * new competition season — don't assume what was true last year still is.
 * Sources to re-check: cwsf-espc.ca, youthscience.ca, isef.net.
 */

export const COMPETITION_KNOWLEDGE = `
CANADIAN SCIENCE FAIR PATHWAY (verified current as of mid-2026):

1. REGIONAL FAIRS (the starting point)
   - Canada has 100+ Youth Science Canada (YSC)-affiliated regional fairs
     across every province/territory (in Quebec, the provincial fair plays
     this role instead of a single regional fair).
   - Students register through their school; a teacher/advisor typically
     needs to approve each project.
   - Roughly 25,000 students compete at this level across the country each
     year.
   - This is where almost every student's journey starts — there is no way
     to skip directly to CWSF.

2. CWSF — CANADA-WIDE SCIENCE FAIR (the national level)
   - Students qualify for CWSF by winning/placing at their regional fair.
   - Open to grades 7-12, split into three age categories: Junior (7-8),
     Intermediate (9-10), Senior (11-12, including CEGEP).
   - About 390-420 finalists nationally each year.
   - Held annually, typically in May; location rotates by city/university
     each year (2026 host: Edmonton).
   - Projects are also judged within project-type categories such as
     "Discovery" (testing a hypothesis through experimentation) versus
     innovation/engineering-style projects — category fit matters for which
     judges see the project and what they're looking for.
   - About $1.3 million in awards/scholarships are distributed at CWSF.

3. TEAM CANADA-ISEF (the international level) — IMPORTANT, CHANGED IN 2025
   - As of 2025, there is NO direct application route to Team Canada-ISEF
     anymore. The only path is: regional fair -> CWSF -> selected as a
     Team Canada-ISEF CANDIDATE -> additional development program ->
     possibly selected as a Team Canada-ISEF FINALIST for the *following*
     year's ISEF.
   - At CWSF, the national judging team identifies roughly 20 candidates
     (typically Grand Award winners/medalists) who then receive several
     months of additional coaching (roughly October-February) before a
     final selection round.
   - Only about 8 students become actual Team Canada-ISEF finalists each
     year — this is extremely selective, on top of already being a CWSF
     medalist/award winner.
   - IMPORTANT IMPLICATION FOR COACHING: a student cannot realistically plan
     to "go to ISEF this year" off a project they're starting now in the
     same season — ISEF representation realistically follows a strong CWSF
     result from the *previous* cycle. Be honest with students about this
     timeline rather than letting them assume a same-year path exists.
   - Regeneron ISEF itself is the world's largest pre-college science
     competition — around 1,700+ finalists from 60+ countries, competing
     for several million dollars in awards. It's organized by the Society
     for Science, not by Youth Science Canada directly.

OTHER PATHS WORTH KNOWING ABOUT (mention if relevant to a student's situation):
   - Regeneron Science Talent Search (STS): a separate, application-based
     competition (no fair/qualifying event required) for graduating
     seniors, judged on a full research project + application, not a
     fair presentation. Different rules from ISEF.
   - JSHS (Junior Science and Humanities Symposium): presentation/paper
     based, sometimes a good fit for students whose strength is written
     research over a fair-style exhibit.
   - A small number of regional fairs (e.g. some in BC, Quebec) have their
     own longstanding direct ISEF affiliations outside the main CWSF
     pathway — rare, worth knowing exists, but not the typical route.

ISEF PROJECT RULES WORTH FLAGGING TO STUDENTS EARLY (so they don't build
something that becomes ineligible later):
   - A project may include no more than 12 months of continuous research.
   - Literature reviews, demonstrations, or "explanation" models (with no
     original experimentation) are not appropriate/eligible for ISEF —
     this matters for idea-narrowing: steer students away from purely
     demonstrative projects if a competitive pathway is the goal.
   - If AI tools are used as part of the research process, ISEF requires
     this to be disclosed/cited, and all submitted material must be in the
     student's own words.
   - Projects involving human or animal subjects require special
     pre-approval paperwork well before starting — flag this immediately
     if a student's idea involves either, since it affects timeline.
`.trim();