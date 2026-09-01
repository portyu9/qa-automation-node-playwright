#!/usr/bin/env python3
from __future__ import annotations
import fnmatch, json, os, sys, urllib.error, urllib.parse, urllib.request
from dataclasses import dataclass
from typing import Any

API="https://api.github.com"
SAFE={"success","neutral","skipped"}

class Block(RuntimeError): pass
class Error(RuntimeError): pass

def env(name):
    v=os.environ.get(name,"").strip()
    if not v: raise Error(f"{name} is empty")
    return v

def csv(name):
    return tuple(x.strip() for x in os.environ.get(name,"").split(",") if x.strip())

@dataclass(frozen=True)
class Policy:
    repo:str; required:tuple[str,...]; groups:tuple[str,...]; paths:tuple[str,...]; method:str; max_files:int=25
    @classmethod
    def load(cls):
        p=tuple(x.strip() for x in os.environ.get("GOVERNOR_ALLOWED_PATHS","").splitlines() if x.strip())
        obj=cls(env("GITHUB_REPOSITORY"),csv("GOVERNOR_REQUIRED_WORKFLOWS"),csv("GOVERNOR_ALLOWED_GROUPS"),p,os.environ.get("GOVERNOR_MERGE_METHOD","rebase").strip())
        if not obj.required or not obj.groups or not obj.paths: raise Error("policy lists must not be empty")
        if obj.method not in {"merge","rebase","squash"}: raise Error(f"bad merge method {obj.method}")
        return obj

class GH:
    def __init__(self,t): self.t=t
    def call(self,method,path,payload=None):
        req=urllib.request.Request(API+path,data=None if payload is None else json.dumps(payload).encode(),method=method,headers={"Accept":"application/vnd.github+json","Authorization":f"Bearer {self.t}","X-GitHub-Api-Version":"2022-11-28","User-Agent":"dependabot-governor"})
        try:
            with urllib.request.urlopen(req,timeout=30) as r: data=r.read()
        except urllib.error.HTTPError as e:
            raise Error(f"GitHub API {method} {path} failed {e.code}: {e.read().decode('utf-8','replace')[:500]}") from e
        return json.loads(data) if data else None
    def get(self,p): return self.call("GET",p)
    def put(self,p,x): return self.call("PUT",p,x)

def event():
    with open(env("GITHUB_EVENT_PATH"),encoding="utf-8") as f: return json.load(f)

def resolve(e):
    n=env("GITHUB_EVENT_NAME")
    if n=="workflow_dispatch":
        raw=str(e.get("inputs",{}).get("pr_number","")).strip()
        if not raw.isdigit(): raise Error("workflow_dispatch requires numeric pr_number")
        return int(raw),None,None
    if n!="workflow_run": raise Block(f"{n} is not a governance event")
    r=e.get("workflow_run") or {}
    if r.get("event")!="pull_request": raise Block("triggering workflow was not a pull_request run")
    prs=r.get("pull_requests") or []
    if len(prs)!=1 or not isinstance(prs[0].get("number"),int): raise Block("workflow run is not associated with exactly one PR")
    return prs[0]["number"],r.get("head_sha"),((prs[0].get("base") or {}).get("sha"))

def routine(title,groups): return any(g.lower() in title.lower() for g in groups)
def allowed(path,patterns): return any(fnmatch.fnmatchcase(path,p) for p in patterns)

def files_ok(items,p):
    names=[str(x.get("filename","")) for x in items]
    if not names: raise Block("PR has no files")
    if len(names)>p.max_files: raise Block(f"PR changes {len(names)} files; limit is {p.max_files}")
    bad=[x for x in names if not allowed(x,p.paths)]
    if bad: raise Block("non-dependency file scope: "+", ".join(bad))
    return names

def runs_ok(runs,required,main):
    latest={}
    for r in runs:
        path=str(r.get("path",""))
        if path and path not in latest: latest[path]=r
    missing=[p for p in required if p not in latest]
    if missing: raise Block("required workflows have not started: "+", ".join(missing))
    for path in required:
        r=latest[path]
        if r.get("status")!="completed": raise Block(f"required workflow still running: {path}")
        if r.get("conclusion")!="success": raise Block(f"required workflow failed: {path}={r.get('conclusion')}")
        prs=r.get("pull_requests") or []
        base=((prs[0].get("base") or {}).get("sha")) if len(prs)==1 else None
        if base!=main: raise Block(f"{path} tested obsolete base {base or 'unknown'}")
    for r in runs:
        path=str(r.get("path","<unknown>"))
        if r.get("status")!="completed": raise Block(f"PR workflow still running: {path}")
        if r.get("conclusion") not in SAFE: raise Block(f"PR workflow not green: {path}={r.get('conclusion')}")

def summary(lines):
    f=os.environ.get("GITHUB_STEP_SUMMARY")
    if f:
        with open(f,"a",encoding="utf-8") as h: h.write("\n".join(lines)+"\n")

def govern():
    p=Policy.load(); gh=GH(env("GITHUB_TOKEN")); number,trigger_sha,trigger_base=resolve(event())
    pr=gh.get(f"/repos/{p.repo}/pulls/{number}")
    if pr.get("state")!="open": raise Block("PR is not open")
    if pr.get("draft"): raise Block("draft PR")
    if (pr.get("user") or {}).get("login")!="dependabot[bot]": raise Block("author is not dependabot[bot]")
    if (pr.get("base") or {}).get("ref")!="main": raise Block("base is not main")
    if ((pr.get("head") or {}).get("repo") or {}).get("full_name")!=p.repo: raise Block("head repo is not this repo")
    head=(pr.get("head") or {}).get("sha")
    if not head: raise Error("missing PR head SHA")
    if trigger_sha and trigger_sha!=head: raise Block("workflow belongs to obsolete PR head")
    if not routine(str(pr.get("title","")),p.groups): raise Block("not an allowlisted routine group; individual/major migrations stay human-controlled")
    main=((gh.get(f"/repos/{p.repo}/branches/main").get("commit") or {}).get("sha"))
    if not main: raise Error("missing main SHA")
    if trigger_base and trigger_base!=main: raise Block("triggering workflow tested obsolete main; wait for Dependabot rebase")
    names=files_ok(gh.get(f"/repos/{p.repo}/pulls/{number}/files?per_page=100"),p)
    q=urllib.parse.urlencode({"head_sha":head,"event":"pull_request","per_page":100})
    runs=(gh.get(f"/repos/{p.repo}/actions/runs?{q}").get("workflow_runs") or [])
    runs_ok(runs,p.required,main)
    if pr.get("mergeable") is False: raise Block("GitHub reports PR not mergeable")
    result=gh.put(f"/repos/{p.repo}/pulls/{number}/merge",{"sha":head,"merge_method":p.method,"commit_title":str(pr.get("title","Dependabot routine update")),"commit_message":f"Automatically qualified by the repository Dependabot governor.\n\nPR #{number}; exact head {head}; required workflows: {', '.join(p.required)}."})
    if not result or not result.get("merged"): raise Error(f"merge rejected: {result}")
    summary(["## Dependabot governor","",f"- Decision: **merged** PR #{number}",f"- Exact head: `{head}`",f"- Merge method: `{p.method}`",f"- Files: {', '.join(f'`{x}`' for x in names)}"])
    print(f"merged Dependabot PR #{number} at {head}")

def self_test():
    p=Policy("o/r",("ci","security"),("routine-dependencies","routine-actions"),("package.json","package-lock.json",".github/workflows/*.yml"),"rebase")
    assert routine("bump routine-dependencies group",p.groups) and not routine("bump framework 1 to 2",p.groups)
    assert allowed(".github/workflows/ci.yml",p.paths) and not allowed("src/app.py",p.paths)
    assert files_ok([{"filename":"package.json"}],p)==["package.json"]
    try: files_ok([{"filename":"README.md"}],p)
    except Block: pass
    else: raise AssertionError("README must be blocked")
    good=[{"path":"ci","status":"completed","conclusion":"success","pull_requests":[{"base":{"sha":"m"}}]},{"path":"security","status":"completed","conclusion":"success","pull_requests":[{"base":{"sha":"m"}}]}]
    runs_ok(good,p.required,"m")
    for c in ("failure","cancelled","timed_out","action_required"):
        bad=[dict(x) for x in good]; bad[1]["conclusion"]=c
        try: runs_ok(bad,p.required,"m")
        except Block: pass
        else: raise AssertionError(c)
    print("dependabot governor self-test: ok")

def main():
    if "--self-test" in sys.argv: self_test(); return 0
    try: govern(); return 0
    except Block as e:
        summary(["## Dependabot governor","","- Decision: **no merge**",f"- Reason: {e}"]); print(f"policy no-op: {e}"); return 0
    except Error as e: print(f"policy error: {e}",file=sys.stderr); return 1

if __name__=="__main__": raise SystemExit(main())
