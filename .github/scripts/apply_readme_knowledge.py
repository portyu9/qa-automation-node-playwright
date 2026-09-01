from pathlib import Path
import re

path = Path("README.md")
text = path.read_text(encoding="utf-8")

replacements = {
    "| Fast CI | Configuration, API, persistence, diagnostics + browser discovery | Node / 24 | Jest + discovery output |":
    "| Fast CI | Configuration, API, persistence, diagnostics + browser discovery | Primary Node runtime | Jest + discovery output |",
    "supported Node.js runtimes are the supported runtime lines. Node is the primary current-LTS runtime and is pinned by `.nvmrc`; Node remains an explicit maintenance-LTS compatibility line. Other majors are intentionally outside the declared `>=22 <25` engine range.":
    "CI qualifies the repository-declared supported Node runtime lines. `.nvmrc` selects the primary runtime used for browser and quality gates; an additional supported runtime remains an explicit compatibility line. Runtimes outside the package engine contract are intentionally unsupported until they are separately qualified.",
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f"missing expected README text: {old[:90]}")
    text = text.replace(old, new)

marker = "## Dependency maintenance\n"
section = """## Confidence boundaries

The suite separates **browser correctness**, **framework correctness**, **compatibility**, and **environment correctness** so one green lane is never overstated as proof of another.

| Signal | Confidence gained | Deliberate limit |
| --- | --- | --- |
| Jest configuration/API/data contracts | Deterministic policy, transport behavior, persistence ownership, and diagnostic utilities work without a browser | Does not prove rendering, actionability, browser events, or deployed infrastructure |
| Required Chromium gate | Critical browser-visible behavior works in the primary qualified engine against the repository-owned fixture | Does not imply Firefox/WebKit parity or universal browser/device coverage |
| Firefox/WebKit compatibility | Covered contracts survive a deliberate engine change while the application contract remains fixed | Passing selected compatibility lanes is not a claim that every feature is identical across engines |
| Native routing/request-context tests | Playwright interception, request, context, file, popup, download, and event semantics are exercised without wrapper distortion | Owned stubs prove the controlled condition; they do not prove a live dependency |
| Repository `webServer` lifecycle | Framework health is independent of public DNS, third-party uptime, and undeclared environment state | It does not prove a deployed environment's routing, TLS, identity, data, or service dependencies |
| Retry diagnostics + `failOnFlakyTests` | A retry can capture evidence without converting instability into a clean CI result | A retry explains neither root cause nor acceptable reliability; recovered failures still require investigation |
| Trace/video/screenshot evidence | Rich browser-state evidence is available for attributable failures | Pixels and traces can contain application-visible or session data and require synthetic data plus retention controls |
| CodeQL / npm Audit / Trivy / dependency review | Independent security controls inspect different code, dependency, repository, and change-diff surfaces | No individual scanner—and no all-green scanner set—proves vulnerability absence |

Use the **cheapest sufficient oracle** for each requirement. Browser automation is justified when the browser contributes semantics; otherwise API, transport, configuration, or persistence tests produce faster and more attributable evidence.

"""
if "## Confidence boundaries\n" not in text:
    if marker not in text:
        raise SystemExit("Dependency maintenance marker missing")
    text = text.replace(marker, section + marker)
path.write_text(text, encoding="utf-8")

patterns = [
    re.compile(r"\bNode(?:\.js)?\s*/?\s*\d", re.I),
    re.compile(r"`?>=\s*\d+\s*<\s*\d+`?"),
    re.compile(r"\bPlaywright\s+\d", re.I),
    re.compile(r"\bJest\s+\d", re.I),
]
candidates = []
for md in [Path("README.md"), *Path("docs").rglob("*.md")]:
    for number, line in enumerate(md.read_text(encoding="utf-8").splitlines(), 1):
        if any(pattern.search(line) for pattern in patterns):
            candidates.append(f"{md}:{number}: {line}")
if candidates:
    raise SystemExit("Residual Node/Playwright version candidates:\n" + "\n".join(candidates))
