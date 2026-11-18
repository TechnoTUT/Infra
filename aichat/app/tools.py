"""Gemini に渡すツール。クラスタは読み取り専用、リポジトリは git-sync が置いたコピーを読む。

ここにある関数の docstring は、そのまま Gemini へのツールの説明になる。
Secret は RBAC で読めない (k8s/manifest/aichat/rbac.yaml) うえに、ここでも種類として受け付けない。
"""

from __future__ import annotations

import fnmatch
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import yaml
from kubernetes import client, config
from kubernetes.dynamic import DynamicClient
from kubernetes.dynamic.exceptions import NotFoundError, ResourceNotFoundError

MAX_CHARS = 12000  # ツールの結果の上限。無料枠のトークンを節約する
REPO_ROOT = Path(os.environ.get("REPO_DIR", "/repo/current"))

# 名前 -> (apiVersion, kind)。ここにない種類は読ませない (Secret を含めない)
KINDS: dict[str, tuple[str, str]] = {
    "node": ("v1", "Node"),
    "namespace": ("v1", "Namespace"),
    "pod": ("v1", "Pod"),
    "service": ("v1", "Service"),
    "configmap": ("v1", "ConfigMap"),
    "pvc": ("v1", "PersistentVolumeClaim"),
    "pv": ("v1", "PersistentVolume"),
    "serviceaccount": ("v1", "ServiceAccount"),
    "event": ("v1", "Event"),
    "deployment": ("apps/v1", "Deployment"),
    "statefulset": ("apps/v1", "StatefulSet"),
    "daemonset": ("apps/v1", "DaemonSet"),
    "replicaset": ("apps/v1", "ReplicaSet"),
    "job": ("batch/v1", "Job"),
    "cronjob": ("batch/v1", "CronJob"),
    "ingress": ("networking.k8s.io/v1", "Ingress"),
    "networkpolicy": ("networking.k8s.io/v1", "NetworkPolicy"),
    "storageclass": ("storage.k8s.io/v1", "StorageClass"),
    "application": ("argoproj.io/v1alpha1", "Application"),
    "firewallpolicy": ("fortigate.technotut.net/v1alpha1", "FirewallPolicy"),
    "firewalladdress": ("fortigate.technotut.net/v1alpha1", "FirewallAddress"),
    "firewallservice": ("fortigate.technotut.net/v1alpha1", "FirewallService"),
    "ciliumloadbalancerippool": ("cilium.io/v2", "CiliumLoadBalancerIPPool"),
    "network-attachment-definition": ("k8s.cni.cncf.io/v1", "NetworkAttachmentDefinition"),
}
ALIASES = {
    "no": "node", "nodes": "node", "ns": "namespace", "namespaces": "namespace",
    "po": "pod", "pods": "pod", "svc": "service", "services": "service",
    "cm": "configmap", "configmaps": "configmap", "pvcs": "pvc", "pvs": "pv",
    "sa": "serviceaccount", "ev": "event", "events": "event",
    "deploy": "deployment", "deployments": "deployment", "sts": "statefulset",
    "ds": "daemonset", "rs": "replicaset", "jobs": "job", "cronjobs": "cronjob",
    "ing": "ingress", "ingresses": "ingress", "netpol": "networkpolicy",
    "sc": "storageclass", "app": "application", "apps": "application",
    "applications": "application", "nad": "network-attachment-definition",
}
CLUSTER_SCOPED = {"node", "namespace", "pv", "storageclass", "ciliumloadbalancerippool"}

# リポジトリで読ませないもの (暗号化済みでも外に出さない)
REPO_DENY = [".git", ".git/*", "*/.git/*", "*node_modules*", "*/.ansible/*", "*vault.yml",
             "*.key", "*.pem", "*.env", "*/build/*"]

_dyn: DynamicClient | None = None


def _client() -> DynamicClient:
    global _dyn
    if _dyn is None:
        try:
            config.load_incluster_config()
        except config.ConfigException:
            config.load_kube_config()  # 手元で動かすとき
        _dyn = DynamicClient(client.ApiClient())
    return _dyn


def _cut(text: str) -> str:
    if len(text) <= MAX_CHARS:
        return text
    return text[:MAX_CHARS] + f"\n... (長いので {len(text) - MAX_CHARS} 文字を省略)"


def _kind(kind: str) -> str:
    k = kind.strip().lower()
    k = ALIASES.get(k, k)
    if k in ("secret", "secrets"):
        raise ValueError("Secret は読めません (このチャットには権限がありません)。")
    if k not in KINDS:
        raise ValueError(f"対応していない種類です: {kind}。使えるもの: {', '.join(KINDS)}")
    return k


def _api(k: str):
    api_version, kind = KINDS[k]
    return _client().resources.get(api_version=api_version, kind=kind)


def _age(ts: str | None) -> str:
    if not ts:
        return "-"
    t = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    s = int((datetime.now(timezone.utc) - t).total_seconds())
    for unit, n in (("d", 86400), ("h", 3600), ("m", 60)):
        if s >= n:
            return f"{s // n}{unit}"
    return f"{s}s"


def _summary(k: str, o: dict) -> str:
    """一覧の 1 行。種類ごとに状態を読み取りやすく並べる。"""
    md, spec, st = o.get("metadata", {}), o.get("spec", {}) or {}, o.get("status", {}) or {}
    name = md.get("name", "?")
    if md.get("namespace"):
        name = f"{md['namespace']}/{name}"
    cols = [name]
    if k == "pod":
        cs = st.get("containerStatuses") or []
        ready = sum(1 for c in cs if c.get("ready"))
        restarts = sum(c.get("restartCount", 0) for c in cs)
        reason = next((c["state"][s].get("reason") for c in cs for s in ("waiting", "terminated")
                       if (c.get("state") or {}).get(s)), None)
        cols += [st.get("phase", "?") + (f" ({reason})" if reason else ""),
                 f"ready {ready}/{len(spec.get('containers', []))}", f"restarts {restarts}",
                 f"node {spec.get('nodeName', '-')}"]
    elif k in ("deployment", "statefulset", "replicaset"):
        cols.append(f"ready {st.get('readyReplicas', 0)}/{spec.get('replicas', 0)}")
    elif k == "daemonset":
        cols.append(f"ready {st.get('numberReady', 0)}/{st.get('desiredNumberScheduled', 0)}")
    elif k == "service":
        lb = ",".join(i.get("ip", "") for i in (st.get("loadBalancer") or {}).get("ingress") or [])
        ports = ",".join(f"{p.get('port')}/{p.get('protocol', 'TCP')}" for p in spec.get("ports") or [])
        cols += [spec.get("type", "?"), f"clusterIP {spec.get('clusterIP')}",
                 f"LB {lb or '-'}", f"ports {ports}"]
    elif k == "ingress":
        cols.append("hosts " + ",".join(r.get("host", "*") for r in spec.get("rules") or []))
    elif k == "node":
        ready = next((c["status"] for c in st.get("conditions") or [] if c["type"] == "Ready"), "?")
        info = st.get("nodeInfo") or {}
        cols += [f"Ready={ready}", info.get("kubeletVersion", ""), info.get("osImage", "")]
    elif k == "application":
        cols += [f"sync {(st.get('sync') or {}).get('status', '?')}",
                 f"health {(st.get('health') or {}).get('status', '?')}",
                 f"path {(spec.get('source') or {}).get('path', '-')}"]
    elif k in ("pvc", "pv", "namespace"):
        cols.append(st.get("phase", "?"))
    elif k == "event":
        obj = o.get("involvedObject") or {}
        cols = [md.get("namespace", ""), o.get("type", ""), o.get("reason", ""),
                f"{obj.get('kind')}/{obj.get('name')}", (o.get("message") or "").strip()[:200]]
    elif k.startswith("firewall"):
        conds = st.get("conditions") or []
        cols.append("; ".join(f"{c.get('type')}={c.get('status')} {c.get('message', '')}" for c in conds) or "-")
    cols.append(f"age {_age(md.get('creationTimestamp'))}")
    return "  ".join(str(c) for c in cols)


# ---- ここから Gemini に渡すツール ----

def cluster_overview() -> str:
    """クラスタ全体の状態をまとめて返す。ノード、問題のある Pod、Argo CD のアプリの同期と健康状態。
    「クラスタの調子は？」のような質問では最初にこれを呼ぶ。"""
    out = ["# ノード"]
    out += [_summary("node", n) for n in _api("node").get().to_dict()["items"]]
    bad = []
    for p in _api("pod").get().to_dict()["items"]:
        line = _summary("pod", p)
        phase = (p.get("status") or {}).get("phase")
        cs = (p.get("status") or {}).get("containerStatuses") or []
        if phase not in ("Running", "Succeeded") or any(not c.get("ready") for c in cs if phase == "Running"):
            bad.append(line)
    out += ["", "# 問題がありそうな Pod (Running で Ready でないもの、Pending、Failed など)"]
    out += bad or ["なし"]
    out += ["", "# Argo CD のアプリ"]
    try:
        out += [_summary("application", a) for a in _api("application").get(namespace="argocd").to_dict()["items"]]
    except Exception as e:  # noqa: BLE001
        out.append(f"取得できませんでした: {e}")
    return _cut("\n".join(out))


def list_resources(kind: str, namespace: str = "") -> str:
    """Kubernetes のリソースを一覧する (kubectl get 相当)。状態の要点を 1 行ずつ返す。

    Args:
        kind: 種類。pod, deployment, service, ingress, node, namespace, pvc, configmap, event,
            application (Argo CD), firewallpolicy, firewalladdress, firewallservice など。Secret は不可。
        namespace: 名前空間。空なら全ての名前空間。
    """
    k = _kind(kind)
    ns = None if (k in CLUSTER_SCOPED or not namespace) else namespace
    items = _api(k).get(namespace=ns).to_dict()["items"]
    if not items:
        return "見つかりませんでした。"
    return _cut(f"{len(items)} 件\n" + "\n".join(_summary(k, o) for o in items))


def get_resource(kind: str, name: str, namespace: str = "") -> str:
    """1 つのリソースの中身を YAML で返す (kubectl get -o yaml 相当。managedFields などは省く)。

    Args:
        kind: 種類 (list_resources と同じ)。Secret は不可。
        name: リソースの名前。
        namespace: 名前空間。Node や Namespace など名前空間のないものは空にする。
    """
    k = _kind(kind)
    ns = None if k in CLUSTER_SCOPED else (namespace or "default")
    try:
        o = _api(k).get(name=name, namespace=ns).to_dict()
    except NotFoundError:
        return f"{kind} {name} は名前空間 {ns} に見つかりませんでした。"
    md = o.get("metadata", {})
    md.pop("managedFields", None)
    (md.get("annotations") or {}).pop("kubectl.kubernetes.io/last-applied-configuration", None)
    return _cut(yaml.safe_dump(o, allow_unicode=True, sort_keys=False))


def get_pod_logs(name: str, namespace: str, container: str = "", tail_lines: int = 100,
                 previous: bool = False) -> str:
    """Pod のログの末尾を返す (kubectl logs 相当)。

    Args:
        name: Pod の名前。
        namespace: Pod の名前空間。
        container: コンテナ名。Pod にコンテナが複数あるときに指定する。
        tail_lines: 末尾から何行読むか (最大 300)。
        previous: true なら、再起動する前のコンテナのログを読む (CrashLoopBackOff の原因調べに使う)。
    """
    _client()
    kw = {"tail_lines": max(1, min(int(tail_lines), 300)), "previous": bool(previous)}
    if container:
        kw["container"] = container
    try:
        log = client.CoreV1Api().read_namespaced_pod_log(name, namespace, **kw)
    except client.ApiException as e:
        return f"ログを取得できませんでした ({e.status}): {e.reason}"
    return _cut(log or "(ログは空です)")


def get_events(namespace: str = "", only_warnings: bool = True) -> str:
    """最近のイベントを新しい順に返す (kubectl get events 相当)。Pod が起動しない理由などがわかる。

    Args:
        namespace: 名前空間。空なら全て。
        only_warnings: true なら Warning だけにする。
    """
    items = _api("event").get(namespace=namespace or None).to_dict()["items"]
    if only_warnings:
        items = [e for e in items if e.get("type") == "Warning"]
    items.sort(key=lambda e: e.get("lastTimestamp") or e.get("eventTime") or "", reverse=True)
    if not items:
        return "該当するイベントはありません。"
    return _cut("\n".join(_summary("event", e) for e in items[:60]))


def _repo_path(path: str) -> Path:
    p = (REPO_ROOT / path.strip().lstrip("/")).resolve()
    root = REPO_ROOT.resolve()
    if p != root and root not in p.parents:
        raise ValueError("リポジトリの外は読めません。")
    rel = str(p.relative_to(root))
    if any(fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch("/" + rel, pat) for pat in REPO_DENY):
        raise ValueError(f"{rel} は読めません。")
    return p


def list_repo_files(path: str = "") -> str:
    """TechnoTUT/Infra リポジトリ (main ブランチ、数分ごとに更新) のディレクトリの中身を返す。
    構成: docs/content (ドキュメント), k8s/manifest (Argo CD が入れるマニフェスト。apps/ に Application),
    k8s/ansible (クラスタ構築), network (スイッチの設定)。

    Args:
        path: リポジトリのルートからのディレクトリのパス。空ならルート。
    """
    p = _repo_path(path)
    if not p.is_dir():
        return f"{path} はディレクトリではありません。"
    names = []
    for c in sorted(p.iterdir()):
        try:
            _repo_path(str(c.relative_to(REPO_ROOT.resolve())))
        except ValueError:
            continue
        names.append(c.name + ("/" if c.is_dir() else ""))
    return "\n".join(names) or "(空)"


def read_repo_file(path: str) -> str:
    """TechnoTUT/Infra リポジトリのファイルを読む。ドキュメント (docs/content/**.mdx) やマニフェストの確認に使う。

    Args:
        path: リポジトリのルートからのファイルのパス。例: README.md, docs/content/computing/deploy.mdx
    """
    p = _repo_path(path)
    if not p.is_file():
        return f"{path} はファイルではありません。list_repo_files で確かめてください。"
    return _cut(p.read_text(encoding="utf-8", errors="replace"))


def search_repo(pattern: str, path: str = "") -> str:
    """TechnoTUT/Infra リポジトリのテキストを検索する (grep 相当、大文字小文字は区別しない)。
    どのファイルに書いてあるかわからないときに使う。

    Args:
        pattern: 探す文字列 (正規表現も可)。
        path: 検索するディレクトリ。空ならリポジトリ全体。
    """
    base = _repo_path(path)
    try:
        rx = re.compile(pattern, re.IGNORECASE)
    except re.error:
        rx = re.compile(re.escape(pattern), re.IGNORECASE)
    hits: list[str] = []
    root = REPO_ROOT.resolve()
    for f in sorted(base.rglob("*")):
        if not f.is_file() or f.stat().st_size > 512_000:
            continue
        try:
            rel = str(_repo_path(str(f.relative_to(root))).relative_to(root))
            text = f.read_text(encoding="utf-8")
        except (ValueError, UnicodeDecodeError):
            continue
        for i, line in enumerate(text.splitlines(), 1):
            if rx.search(line):
                hits.append(f"{rel}:{i}: {line.strip()[:200]}")
                if len(hits) >= 80:
                    return _cut("\n".join(hits) + "\n... (80 件で打ち切り)")
    return _cut("\n".join(hits) or "見つかりませんでした。")


TOOLS = [cluster_overview, list_resources, get_resource, get_pod_logs, get_events,
         list_repo_files, read_repo_file, search_repo]
TOOL_MAP = {f.__name__: f for f in TOOLS}


def call_tool(name: str, args: dict) -> str:
    fn = TOOL_MAP.get(name)
    if fn is None:
        return f"そのツールはありません: {name}"
    try:
        return fn(**(args or {}))
    except (ValueError, TypeError, ResourceNotFoundError) as e:
        return f"エラー: {e}"
    except client.ApiException as e:
        return f"Kubernetes API のエラー ({e.status}): {e.reason}"
    except Exception as e:  # noqa: BLE001  モデルに返して言い直させる
        return f"エラー: {type(e).__name__}: {e}"
