// esim-tracker v7.0 — Minimalist
// 单文件 Cloudflare Worker：前端 / API / 定时提醒
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>保号面板</title>
    <style>
        /* ========== Design System ========== */
        :root {
            --bg: #fafafa;
            --surface: #ffffff;
            --border: #e5e5e5;
            --border-light: #f0f0f0;
            --text: #171717;
            --text-secondary: #737373;
            --text-tertiary: #a3a3a3;
            --accent: #4f46e5;
            --safe: #16a34a;
            --warn: #ca8a04;
            --danger: #dc2626;
            --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            --font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
            --s: 8px;
            --m: 16px;
            --l: 24px;
            --xl: 32px;
            --max-w: 960px;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--font);
            background: var(--bg);
            color: var(--text);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            line-height: 1.5;
            font-size: 14px;
            padding: var(--l);
            min-height: 100vh;
        }
        .mono { font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.02em; }

        /* ========== Layout ========== */
        .container { max-width: var(--max-w); margin: 0 auto; }
        .hidden { display: none !important; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .gap-s { gap: var(--s); }
        .gap-m { gap: var(--m); }
        .flex-1 { flex: 1; }
        .flex-wrap { flex-wrap: wrap; }
        .text-center { text-align: center; }
        .text-secondary { color: var(--text-secondary); }
        .text-tertiary { color: var(--text-tertiary); }
        .mt-s { margin-top: var(--s); }
        .mb-s { margin-bottom: var(--s); }
        .mb-m { margin-bottom: var(--m); }
        .mb-l { margin-bottom: var(--l); }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* ========== Grid ========== */
        .grid { display: grid; gap: var(--m); }
        .grid-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-3 { grid-template-columns: repeat(3, 1fr); }
        .col-span { grid-column: 1 / -1; }

        @media (max-width: 640px) {
            .grid-2, .grid-3 { grid-template-columns: 1fr; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
            .grid-3 { grid-template-columns: repeat(2, 1fr); }
        }

        /* ========== Typography ========== */
        h1 { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
        h2 { font-size: 16px; font-weight: 600; }
        .text-xs { font-size: 11px; }
        .text-sm { font-size: 13px; }
        .text-2xl { font-size: 24px; }
        .font-semibold { font-weight: 600; }
        .uppercase { text-transform: uppercase; letter-spacing: 0.06em; }
        .tracking-wider { letter-spacing: 0.04em; }

        /* ========== Cards ========== */
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            padding: var(--l);
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .card:hover {
            border-color: #d4d4d4;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .card-enter {
            opacity: 0; transform: translateY(8px);
            animation: fadeUp 0.4s ease forwards;
        }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        .stat-card {
            background: var(--surface);
            border: 1px solid var(--border);
            padding: var(--m);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .stat-dot {
            width: 6px; height: 6px; border-radius: 50%; display: inline-block;
            margin-right: 5px; vertical-align: middle;
        }
        .dot-safe { background: var(--safe); }
        .dot-warn { background: var(--warn); }
        .dot-danger { background: var(--danger); }

        /* ========== Progress Bar ========== */
        .progress-track {
            height: 2px; background: var(--border-light); overflow: hidden;
            margin: var(--s) 0;
        }
        .progress-fill {
            height: 2px; transition: width 0.6s ease;
        }
        .progress-safe { background: var(--safe); }
        .progress-warn { background: var(--warn); }
        .progress-danger { background: var(--danger); }

        /* ========== Status Badge ========== */
        .badge {
            font-size: 10px; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.04em; padding: 2px 6px;
            display: inline-flex; align-items: center; gap: 4px;
        }
        .badge-safe { color: var(--safe); background: #f0fdf4; }
        .badge-warn { color: var(--warn); background: #fefce8; }
        .badge-danger { color: var(--danger); background: #fef2f2; }

        /* ========== Platform Tags ========== */
        .platform-tag {
            display: inline-block; font-size: 10px; font-weight: 500;
            padding: 1px 8px; margin: 2px 4px 2px 0;
            border: 1px solid var(--border); color: var(--text-secondary);
            letter-spacing: 0.02em; white-space: nowrap;
        }

        /* ========== Inputs ========== */
        .input {
            border: none; border-bottom: 1px solid var(--accent);
            background: transparent; font-family: var(--font);
            font-size: 14px; padding: 8px 0; width: 100%;
            color: var(--text); transition: border-color 0.15s;
            border-radius: 0;
        }
        .input:focus { outline: none; }
        .input::placeholder { color: var(--text-tertiary); }
        .input-mono { font-family: var(--font-mono); letter-spacing: 0.4em; text-align: center; }
        #authCode, #authCode:focus, #searchInput, #searchInput:focus { border-bottom-color: var(--border); }
        .input-box {
            border: 1px solid var(--border); padding: 8px 12px;
            background: var(--surface); font-size: 13px;
            font-family: var(--font); transition: border-color 0.15s;
        }
        .input-box:focus { outline: none; border-color: var(--accent); }
        .input-box::placeholder { color: var(--text-tertiary); }

        /* ========== Buttons ========== */
        .btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 6px;
            font-family: var(--font); font-size: 13px; font-weight: 500;
            padding: 9px 18px; cursor: pointer; border: 1px solid;
            transition: all 0.15s ease; letter-spacing: 0.02em;
            white-space: nowrap;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary {
            background: var(--text); color: #fff; border-color: var(--text);
        }
        .btn-primary:hover:not(:disabled) { background: #404040; }
        .btn-secondary {
            background: transparent; color: var(--text); border-color: var(--border);
        }
        .btn-secondary:hover:not(:disabled) { border-color: #a3a3a3; background: #fafafa; }
        .btn-sm { padding: 5px 12px; font-size: 11px; }
        .btn-danger { background: var(--danger); color: #fff; border-color: var(--danger); }
        .btn-danger:hover:not(:disabled) { background: #b91c1c; }
        .btn-icon { padding: 6px; border: none; background: none; cursor: pointer; color: var(--text-tertiary); font-size: 14px; }
        .btn-icon:hover { color: var(--text); }

        /* ========== Modal ========== */
        .modal-backdrop {
            position: fixed; inset: 0; background: rgba(0,0,0,0.3);
            z-index: 100; display: flex; align-items: center; justify-content: center;
            padding: var(--m);
        }
        .modal {
            background: var(--surface); border: 1px solid var(--border);
            width: 100%; max-width: 420px; max-height: 90vh; overflow-y: auto;
            padding: var(--l); position: relative;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .modal-enter { opacity: 0; transform: scale(0.97); }

        /* ========== Toast ========== */
        .toast-container {
            position: fixed; top: var(--m); right: var(--m);
            z-index: 200; display: flex; flex-direction: column; gap: 8px;
            pointer-events: none;
        }
        .toast {
            pointer-events: auto;
            padding: 10px 16px; font-size: 13px; font-weight: 500;
            background: var(--text); color: #fff; border: 1px solid var(--text);
            max-width: 320px;
            animation: toastIn 0.25s ease, toastOut 0.2s ease 2.5s forwards;
        }
        .toast-error { background: #7f1d1d; border-color: #7f1d1d; }
        @keyframes toastIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastOut { from { opacity:1; } to { opacity:0; } }

        /* ========== Login Gate ========== */
        .gate {
            max-width: 360px; margin: 80px auto 0;
            background: var(--surface); border: 1px solid var(--border);
            padding: var(--xl); text-align: center;
        }
        .gate-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-tertiary); margin-bottom: var(--l); }

        /* ========== Header ========== */
        .header {
            display: flex; justify-content: space-between; align-items: flex-start;
            flex-wrap: wrap; gap: var(--m); margin-bottom: var(--l);
            padding-bottom: var(--l); border-bottom: 1px solid var(--border);
        }

        /* ========== Stats Row ========== */
        .stats-row {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--m);
            margin-bottom: var(--l);
        }

        .stat-value { font-size: 24px; font-weight: 700; line-height: 1; }
        .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); }

        /* ========== Card Content ========== */
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--s); }
        .card-actions { display: flex; gap: 2px; flex-shrink: 0; margin-left: var(--s); }
        .card-name { font-size: 16px; font-weight: 600; margin-bottom: 2px; }
        .card-number { font-size: 13px; color: var(--text-secondary); margin-bottom: var(--s); font-family: var(--font-mono); }
        .card-remark { font-size: 12px; color: var(--text-tertiary); margin-bottom: var(--s); line-height: 1.5; display: flex; gap: 5px; align-items: center; }
        .card-remark svg { flex-shrink: 0; }
        .card-platforms { margin-bottom: var(--s); }
        .card-footer { margin-top: var(--m); padding-top: var(--m); border-top: 1px solid var(--border-light); }
        .card-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-tertiary); }

        /* ========== Misc ========== */
        .py-s { padding-top: var(--s); padding-bottom: var(--s); }
        .text-danger { color: var(--danger); }
        .text-warn { color: var(--warn); }
        .text-safe { color: var(--safe); }
        .min-w-0 { min-width: 0; }
        .relative { position: relative; }
        .absolute { position: absolute; }
        .w-full { width: 100%; }
        .label { display: block; }
        .search-icon { top: 9px; left: 0; display: flex; align-items: center; }
        .input-search { padding-left: 22px; }
        .modal-close { top: 12px; right: 12px; }
        .confirm-dialog { max-width: 320px; }
        .flag { display: inline-flex; gap: 1px; font-size: 16px; line-height: 1; }
        .btn-icon-danger { color: var(--danger); }

        /* ========== eSIM Code ========== */
        .esim-code-wrap {
            margin-top: var(--s);
        }
        .btn-copy {
            padding: 5px 12px; font-size: 11px; font-weight: 500;
            border: 1px solid var(--border); background: transparent;
            color: var(--text-secondary); cursor: pointer;
            transition: all 0.15s; font-family: var(--font);
        }
        .btn-copy:hover { border-color: #a3a3a3; background: #fafafa; }
        .btn-copy.copied { border-color: var(--safe); color: var(--safe); }
    </style>
</head>
<body class="container">

    <!-- Toast -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- ========== LOGIN ========== -->
    <div id="login-container" class="gate">
        <div class="gate-label">安全验证</div>
        <div class="mb-m">
            <input type="text" id="authCode" placeholder="000000" maxlength="6" inputmode="numeric" pattern="[0-9]*" autofocus class="input input-mono text-center text-2xl"
                oninput="if(this.value.length===6)verifyCode()" onclick="this.select()">
        </div>
        <div class="flex flex-col gap-s">
            <button id="loginBtn" onclick="verifyCode()" class="btn btn-primary w-full">登录</button>
            <button id="sendCodeBtn" onclick="sendAuthCode()" class="btn btn-secondary w-full">发送验证码</button>
        </div>
    </div>

    <!-- ========== MAIN PANEL ========== -->
    <div id="main-container" class="hidden">

        <!-- Header -->
        <div class="header">
            <div>
                <h1>eSIM 保号面板</h1>
                <p class="text-sm text-secondary mt-s">到期前 30 天 Telegram 提醒</p>
            </div>
            <div class="flex items-center gap-s flex-wrap">
                <button onclick="openModal()" class="btn btn-primary btn-sm"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 添加</button>
            </div>
        </div>

        <!-- Search -->
        <div class="relative mb-l">
            <span class="absolute text-tertiary search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input type="text" id="searchInput" placeholder="搜索…" oninput="filterCards()"
                class="input input-search">
        </div>

        <!-- Stats -->
        <div class="stats-row">
            <div class="stat-card">
                <div><span class="stat-dot dot-safe"></span><span class="stat-label">未到期</span></div>
                <span class="stat-value text-safe" id="stat-safe">—</span>
            </div>
            <div class="stat-card">
                <div><span class="stat-dot dot-danger"></span><span class="stat-label">告警</span></div>
                <span class="stat-value text-danger" id="stat-danger">—</span>
            </div>
            <div class="stat-card">
                <div><span class="stat-dot dot-warn"></span><span class="stat-label">已过期</span></div>
                <span class="stat-value text-warn" id="stat-warn">—</span>
            </div>
        </div>

        <!-- Cards -->
        <div class="grid grid-3" id="esim-container">
            <div class="col-span text-center text-secondary py-s">加载中…</div>
        </div>
    </div>

    <!-- ========== ADD/EDIT MODAL ========== -->
    <div id="addModal" class="modal-backdrop hidden">
        <div class="modal modal-enter" id="modalContent">
            <button onclick="closeModal()" class="btn-icon absolute modal-close" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <h2 class="mb-m" id="modalTitle">新增 eSIM</h2>
            <form id="addForm" onsubmit="submitForm(event)" class="flex flex-col gap-m">
                <div>
                    <label class="text-xs uppercase tracking-wider text-tertiary mb-s label">名称 *</label>
                    <input type="text" id="simName" required placeholder="GiffGaff" class="input-box w-full">
                </div>
                <div>
                    <label class="text-xs uppercase tracking-wider text-tertiary mb-s label">号码</label>
                    <input type="text" id="simNumber" placeholder="+1 234 567 8900" class="input-box w-full">
                </div>
                <div class="grid grid-2">
                    <div>
                        <label class="text-xs uppercase tracking-wider text-tertiary mb-s label">周期（天）*</label>
                        <input type="number" id="simCycle" required placeholder="180" class="input-box w-full">
                    </div>
                    <div>
                        <label class="text-xs uppercase tracking-wider text-tertiary mb-s label">到期日 *</label>
                        <input type="date" id="simExpire" required class="input-box w-full">
                    </div>
                </div>
                <div>
                    <label class="text-xs uppercase tracking-wider text-tertiary mb-s label">平台</label>
                    <input type="text" id="simPlatforms" placeholder="Telegram, Google" class="input-box w-full">
                </div>
                <div>
                    <label class="text-xs uppercase tracking-wider text-tertiary mb-s label">eSIM 激活码</label>
                    <textarea id="simEsimCode" rows="3" placeholder="LPA:1$smdp.example.com$XXXX-XXXX-XXXX-XXXX" class="input-box w-full" style="resize:vertical;font-family:var(--font-mono);font-size:12px;letter-spacing:0.02em" autocapitalize="none" autocorrect="off" spellcheck="false"></textarea>
                </div>
                <div>
                    <label class="text-xs uppercase tracking-wider text-tertiary mb-s label">备注</label>
                    <input type="text" id="simRemark" placeholder="保号要求" class="input-box w-full">
                </div>
                <button type="submit" id="submitBtn" class="btn btn-primary w-full mt-s">保存</button>
            </form>
        </div>
    </div>

    <!-- ========== CONFIRM MODAL ========== -->
    <div id="confirmModal" class="modal-backdrop hidden">
        <div class="modal modal-enter text-center confirm-dialog" id="confirmModalContent">
            <h2 class="mb-s" id="confirmTitle">确认操作</h2>
            <p class="text-sm text-secondary mb-m" id="confirmMessage"></p>
            <div class="flex gap-s">
                <button onclick="closeConfirmModal()" class="btn btn-secondary flex-1">取消</button>
                <button id="confirmActionBtn" class="btn btn-primary flex-1">确定</button>
            </div>
        </div>
    </div>

    <script>
        // ==================== CONSTANTS ====================
        const WORKER_API_URL = "/api/esims";
        let esimData = [];
        let editingId = null;
        let authToken = null;  // in-memory, cleared on page close

        // ==================== TOAST ====================
        function showToast(msg, type) {
            type = type || 'error';
            var c = document.getElementById('toastContainer');
            var t = document.createElement('div');
            t.className = 'toast' + (type === 'error' ? ' toast-error' : '');
            t.textContent = msg;
            c.appendChild(t);
            setTimeout(function(){ if(t.parentNode) t.remove(); }, 2800);
        }

        // ==================== COUNTRY FLAGS ====================
        const countryFlags = [
            {prefix:"+1242",iso:["bs"]},{prefix:"+1246",iso:["bb"]},{prefix:"+1264",iso:["ai"]},{prefix:"+1268",iso:["ag"]},{prefix:"+1284",iso:["vg"]},{prefix:"+1340",iso:["vi"]},{prefix:"+1345",iso:["ky"]},{prefix:"+1441",iso:["bm"]},{prefix:"+1473",iso:["gd"]},{prefix:"+1649",iso:["tc"]},{prefix:"+1664",iso:["ms"]},{prefix:"+1670",iso:["mp"]},{prefix:"+1671",iso:["gu"]},{prefix:"+1684",iso:["as"]},{prefix:"+1721",iso:["sx"]},{prefix:"+1758",iso:["lc"]},{prefix:"+1767",iso:["dm"]},{prefix:"+1784",iso:["vc"]},{prefix:"+1787",iso:["pr"]},{prefix:"+1939",iso:["pr"]},{prefix:"+1809",iso:["do"]},{prefix:"+1829",iso:["do"]},{prefix:"+1849",iso:["do"]},{prefix:"+1868",iso:["tt"]},{prefix:"+1876",iso:["jm"]},{prefix:"+1204",iso:["ca"]},{prefix:"+1226",iso:["ca"]},{prefix:"+1236",iso:["ca"]},{prefix:"+1249",iso:["ca"]},{prefix:"+1250",iso:["ca"]},{prefix:"+1263",iso:["ca"]},{prefix:"+1289",iso:["ca"]},{prefix:"+1306",iso:["ca"]},{prefix:"+1343",iso:["ca"]},{prefix:"+1354",iso:["ca"]},{prefix:"+1365",iso:["ca"]},{prefix:"+1367",iso:["ca"]},{prefix:"+1368",iso:["ca"]},{prefix:"+1382",iso:["ca"]},{prefix:"+1403",iso:["ca"]},{prefix:"+1416",iso:["ca"]},{prefix:"+1418",iso:["ca"]},{prefix:"+1428",iso:["ca"]},{prefix:"+1431",iso:["ca"]},{prefix:"+1437",iso:["ca"]},{prefix:"+1438",iso:["ca"]},{prefix:"+1450",iso:["ca"]},{prefix:"+1468",iso:["ca"]},{prefix:"+1474",iso:["ca"]},{prefix:"+1506",iso:["ca"]},{prefix:"+1514",iso:["ca"]},{prefix:"+1519",iso:["ca"]},{prefix:"+1548",iso:["ca"]},{prefix:"+1579",iso:["ca"]},{prefix:"+1581",iso:["ca"]},{prefix:"+1584",iso:["ca"]},{prefix:"+1587",iso:["ca"]},{prefix:"+1604",iso:["ca"]},{prefix:"+1613",iso:["ca"]},{prefix:"+1639",iso:["ca"]},{prefix:"+1647",iso:["ca"]},{prefix:"+1672",iso:["ca"]},{prefix:"+1683",iso:["ca"]},{prefix:"+1705",iso:["ca"]},{prefix:"+1709",iso:["ca"]},{prefix:"+1742",iso:["ca"]},{prefix:"+1753",iso:["ca"]},{prefix:"+1778",iso:["ca"]},{prefix:"+1780",iso:["ca"]},{prefix:"+1782",iso:["ca"]},{prefix:"+1807",iso:["ca"]},{prefix:"+1819",iso:["ca"]},{prefix:"+1825",iso:["ca"]},{prefix:"+1867",iso:["ca"]},{prefix:"+1873",iso:["ca"]},{prefix:"+1879",iso:["ca"]},{prefix:"+1902",iso:["ca"]},{prefix:"+1905",iso:["ca"]},{prefix:"+1",iso:["us"]},{prefix:"+86",iso:["cn"]},{prefix:"+852",iso:["hk"]},{prefix:"+853",iso:["mo"]},{prefix:"+886",iso:["tw"]},{prefix:"+81",iso:["jp"]},{prefix:"+82",iso:["kr"]},{prefix:"+850",iso:["kp"]},{prefix:"+65",iso:["sg"]},{prefix:"+60",iso:["my"]},{prefix:"+62",iso:["id"]},{prefix:"+63",iso:["ph"]},{prefix:"+66",iso:["th"]},{prefix:"+84",iso:["vn"]},{prefix:"+91",iso:["in"]},{prefix:"+92",iso:["pk"]},{prefix:"+93",iso:["af"]},{prefix:"+94",iso:["lk"]},{prefix:"+95",iso:["mm"]},{prefix:"+98",iso:["ir"]},{prefix:"+971",iso:["ae"]},{prefix:"+972",iso:["il"]},{prefix:"+973",iso:["bh"]},{prefix:"+974",iso:["qa"]},{prefix:"+975",iso:["bt"]},{prefix:"+976",iso:["mn"]},{prefix:"+977",iso:["np"]},{prefix:"+960",iso:["mv"]},{prefix:"+961",iso:["lb"]},{prefix:"+962",iso:["jo"]},{prefix:"+963",iso:["sy"]},{prefix:"+964",iso:["iq"]},{prefix:"+965",iso:["kw"]},{prefix:"+966",iso:["sa"]},{prefix:"+968",iso:["om"]},{prefix:"+992",iso:["tj"]},{prefix:"+993",iso:["tm"]},{prefix:"+994",iso:["az"]},{prefix:"+995",iso:["ge"]},{prefix:"+996",iso:["kg"]},{prefix:"+998",iso:["uz"]},{prefix:"+855",iso:["kh"]},{prefix:"+856",iso:["la"]},{prefix:"+880",iso:["bd"]},{prefix:"+90",iso:["tr"]},{prefix:"+441534",iso:["je"]},{prefix:"+441481",iso:["gg"]},{prefix:"+441624",iso:["im"]},{prefix:"+447624",iso:["im"]},{prefix:"+44",iso:["gb"]},{prefix:"+33",iso:["fr"]},{prefix:"+49",iso:["de"]},{prefix:"+39",iso:["it"]},{prefix:"+34",iso:["es"]},{prefix:"+76",iso:["kz"]},{prefix:"+77",iso:["kz"]},{prefix:"+7",iso:["ru"]},{prefix:"+380",iso:["ua"]},{prefix:"+31",iso:["nl"]},{prefix:"+32",iso:["be"]},{prefix:"+41",iso:["ch"]},{prefix:"+43",iso:["at"]},{prefix:"+46",iso:["se"]},{prefix:"+47",iso:["no"]},{prefix:"+48",iso:["pl"]},{prefix:"+45",iso:["dk"]},{prefix:"+358",iso:["fi"]},{prefix:"+351",iso:["pt"]},{prefix:"+30",iso:["gr"]},{prefix:"+353",iso:["ie"]},{prefix:"+370",iso:["lt"]},{prefix:"+371",iso:["lv"]},{prefix:"+372",iso:["ee"]},{prefix:"+374",iso:["am"]},{prefix:"+381",iso:["rs"]},{prefix:"+359",iso:["bg"]},{prefix:"+357",iso:["cy"]},{prefix:"+420",iso:["cz"]},{prefix:"+421",iso:["sk"]},{prefix:"+36",iso:["hu"]},{prefix:"+40",iso:["ro"]},{prefix:"+385",iso:["hr"]},{prefix:"+386",iso:["si"]},{prefix:"+387",iso:["ba"]},{prefix:"+389",iso:["mk"]},{prefix:"+355",iso:["al"]},{prefix:"+352",iso:["lu"]},{prefix:"+356",iso:["mt"]},{prefix:"+354",iso:["is"]},{prefix:"+376",iso:["ad"]},{prefix:"+373",iso:["md"]},{prefix:"+377",iso:["mc"]},{prefix:"+378",iso:["sm"]},{prefix:"+382",iso:["me"]},{prefix:"+423",iso:["li"]},{prefix:"+350",iso:["gi"]},{prefix:"+298",iso:["fo"]},{prefix:"+55",iso:["br"]},{prefix:"+54",iso:["ar"]},{prefix:"+56",iso:["cl"]},{prefix:"+57",iso:["co"]},{prefix:"+51",iso:["pe"]},{prefix:"+58",iso:["ve"]},{prefix:"+591",iso:["bo"]},{prefix:"+593",iso:["ec"]},{prefix:"+595",iso:["py"]},{prefix:"+598",iso:["uy"]},{prefix:"+592",iso:["gy"]},{prefix:"+597",iso:["sr"]},{prefix:"+52",iso:["mx"]},{prefix:"+501",iso:["bz"]},{prefix:"+502",iso:["gt"]},{prefix:"+503",iso:["sv"]},{prefix:"+504",iso:["hn"]},{prefix:"+505",iso:["ni"]},{prefix:"+506",iso:["cr"]},{prefix:"+507",iso:["pa"]},{prefix:"+61",iso:["au"]},{prefix:"+64",iso:["nz"]},{prefix:"+679",iso:["fj"]},{prefix:"+675",iso:["pg"]},{prefix:"+678",iso:["vu"]},{prefix:"+677",iso:["sb"]},{prefix:"+676",iso:["to"]},{prefix:"+685",iso:["ws"]},{prefix:"+686",iso:["ki"]},{prefix:"+688",iso:["tv"]},{prefix:"+674",iso:["nr"]},{prefix:"+680",iso:["pw"]},{prefix:"+692",iso:["mh"]},{prefix:"+691",iso:["fm"]},{prefix:"+687",iso:["nc"]},{prefix:"+689",iso:["pf"]},{prefix:"+27",iso:["za"]},{prefix:"+234",iso:["ng"]},{prefix:"+20",iso:["eg"]},{prefix:"+254",iso:["ke"]},{prefix:"+212",iso:["ma"]},{prefix:"+213",iso:["dz"]},{prefix:"+216",iso:["tn"]},{prefix:"+218",iso:["ly"]},{prefix:"+249",iso:["sd"]},{prefix:"+251",iso:["et"]},{prefix:"+255",iso:["tz"]},{prefix:"+256",iso:["ug"]},{prefix:"+233",iso:["gh"]},{prefix:"+225",iso:["ci"]},{prefix:"+237",iso:["cm"]},{prefix:"+221",iso:["sn"]},{prefix:"+223",iso:["ml"]},{prefix:"+224",iso:["gn"]},{prefix:"+228",iso:["tg"]},{prefix:"+229",iso:["bj"]},{prefix:"+227",iso:["ne"]},{prefix:"+226",iso:["bf"]},{prefix:"+231",iso:["lr"]},{prefix:"+232",iso:["sl"]},{prefix:"+220",iso:["gm"]},{prefix:"+245",iso:["gw"]},{prefix:"+238",iso:["cv"]},{prefix:"+239",iso:["st"]},{prefix:"+240",iso:["gq"]},{prefix:"+241",iso:["ga"]},{prefix:"+242",iso:["cg"]},{prefix:"+243",iso:["cd"]},{prefix:"+244",iso:["ao"]},{prefix:"+260",iso:["zm"]},{prefix:"+263",iso:["zw"]},{prefix:"+264",iso:["na"]},{prefix:"+267",iso:["bw"]},{prefix:"+268",iso:["sz"]},{prefix:"+266",iso:["ls"]},{prefix:"+261",iso:["mg"]},{prefix:"+230",iso:["mu"]},{prefix:"+248",iso:["sc"]},{prefix:"+262269",iso:["yt"]},{prefix:"+262639",iso:["yt"]},{prefix:"+262",iso:["re"]},{prefix:"+253",iso:["dj"]},{prefix:"+252",iso:["so"]},{prefix:"+250",iso:["rw"]},{prefix:"+257",iso:["bi"]},{prefix:"+258",iso:["mz"]},{prefix:"+265",iso:["mw"]}
        ];
        countryFlags.sort(function(a,b){ return b.prefix.length - a.prefix.length; });

        function isoToFlag(code) {
            return String.fromCodePoint.apply(null, code.toUpperCase().split('').map(function(c){ return c.charCodeAt(0) + 127397; }));
        }

        function getCountryFlag(num) {
            if (!num) return '';
            var c = num.replace(/[\\s\\-\\(\\)\\.]/g,'');
            if (!c.startsWith('+')) return '';
            for (var i=0;i<countryFlags.length;i++) {
                if (c.startsWith(countryFlags[i].prefix)) {
                    return '<span class="flag">'+countryFlags[i].iso.map(isoToFlag).join('')+'</span>';
                }
            }
            return '';
        }

        // ==================== INIT ====================
        function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
        function parseDate(s){ var p=String(s||'').split('-').map(Number); return new Date(p[0]||1970,(p[1]||1)-1,p[2]||1); }
        function dateStr(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
        function countdownText(sec){ return Math.floor(sec/60)+' 分 '+String(sec%60).padStart(2,'0')+' 秒'; }
        function getAuthHeaders(){ return {'Content-Type':'application/json','Authorization':authToken||''}; }

        // ==================== AUTH ====================
        let countdownInterval;

        async function sendAuthCode(){
            var b=document.getElementById('sendCodeBtn'),o=b.textContent;
            b.disabled=true;b.textContent='发送中…';
            try{
                var r=await fetch('/api/auth/send',{method:'POST'}),d=await r.json();
                if(r.ok&&d.success){
                    if(countdownInterval) clearInterval(countdownInterval);
                    var l=300;
                    b.textContent=countdownText(l);
                    countdownInterval=setInterval(function(){
                        l--;if(l<=0){clearInterval(countdownInterval);b.disabled=false;b.textContent=o;}
                        else{b.textContent=countdownText(l);}
                    },1000);
                }else{showToast(d.message||'发送失败','error');b.disabled=false;b.textContent=o;}
            }catch(e){showToast('连接失败','error');b.disabled=false;b.textContent=o;}
        }

        async function verifyCode(){
            var c=document.getElementById('authCode').value.trim();
            if(!c||c.length!==6){showToast('请输入 6 位验证码','error');return;}
            var b=document.getElementById('loginBtn'),o=b.textContent;
            b.disabled=true;b.textContent='验证中…';
            try{
                var r=await fetch('/api/auth/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:c})}),d=await r.json();
                if(r.ok&&d.success){authToken=d.token;document.getElementById('authCode').value='';fetchEsimData();}
                else{showToast(d.message||'验证码错误','error');b.disabled=false;b.textContent=o;}
            }catch(e){showToast('连接失败','error');b.disabled=false;b.textContent=o;}
        }

        function logout(){
            if(countdownInterval) clearInterval(countdownInterval);
            authToken = null;
            document.getElementById('login-container').classList.remove('hidden');
            document.getElementById('main-container').classList.add('hidden');
        }

        // ==================== SVG ICONS ====================
        var SVG = {
            edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
            refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
            trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
        };

        // ==================== DATA ====================
        async function fetchEsimData(){
            var c=document.getElementById('esim-container');
            c.innerHTML='<div class="col-span text-center text-secondary py-s">加载中…</div>';
            try{
                var r=await fetch(WORKER_API_URL,{headers:getAuthHeaders()});
                if(r.status===401){logout();return;}
                if(!r.ok)throw new Error('fail');
                esimData=await r.json();
                document.getElementById('login-container').classList.add('hidden');
                document.getElementById('main-container').classList.remove('hidden');
                renderCards();
            }catch(e){
                c.innerHTML='<div class="col-span text-center py-s"><p class="text-secondary">加载失败，请重试</p></div>';
            }
        }

        function renderCards(){
            var c=document.getElementById('esim-container');
            var today=new Date();today.setHours(0,0,0,0);
            var safeC=0,warnC=0,dangC=0,html='';

            if(!esimData.length){
                c.innerHTML='<div class="col-span text-center py-s text-tertiary">暂无卡片，点击「添加」</div>';
            }else{
                var sorted = esimData.slice().sort(function(a,b){return parseDate(a.expireDate)-parseDate(b.expireDate);});
                sorted.forEach(function(sim,idx){
                        var exp=parseDate(sim.expireDate);exp.setHours(0,0,0,0);
                        var diff=Math.ceil((exp-today)/86400000);
                        var fillClass,badgeClass,statusText;
                        if(diff>15){fillClass='progress-safe';badgeClass='badge-safe';statusText='未到期';safeC++;}
                        else if(diff>0){fillClass='progress-danger';badgeClass='badge-danger';statusText='告警';dangC++;}
                        else{fillClass='progress-warn';badgeClass='badge-warn';statusText='已过期';warnC++;}
                        var cycleNum=parseInt(sim.cycle,10)||180;
                        var elapsed=cycleNum-diff;
                        var pct=Math.max(2,Math.min(100,Math.round(elapsed/cycleNum*100)));
                        var flag=getCountryFlag(sim.number);
                        var platformsHTML='';
                        if(sim.platforms){
                            platformsHTML='<div class="card-platforms">'+sim.platforms.split(/[,，\\s]+/).filter(Boolean).map(function(t){return '<span class="platform-tag">'+esc(t)+'</span>';}).join('')+'</div>';
                        }
                        var remark=sim.remark||'';
                        var remarkHTML=remark?'<div class="card-remark"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'+esc(remark.length>60?remark.substring(0,60)+'…':remark)+'</div>':'';
                        var esimCodeHTML='';
                        if(sim.esimCode){
                            esimCodeHTML='<div class="esim-code-wrap">'+
                                '<button class="btn-copy w-full" data-code="'+esc(sim.esimCode)+'" onclick="copyEsimCodeRaw(this)">复制 eSIM 激活码</button>'+
                            '</div>';
                        }
                        var id=esc(sim.id);

                        html+='<div class="card card-enter" style="animation-delay:'+(idx*0.04)+'s" data-search-text="'+esc((sim.name||'')+' '+(sim.number||'')+' '+(sim.platforms||'')+' '+(sim.remark||'')).toLowerCase()+'">'+
                            '<div class="card-header">'+
                                '<div class="flex items-center gap-s min-w-0 flex-1">'+flag+
                                    '<span class="badge '+badgeClass+'">'+statusText+'</span>'+
                                '</div>'+
                                '<div class="card-actions">'+
                                    '<button onclick="openEditModal(\\''+id+'\\')" class="btn-icon" title="编辑">'+SVG.edit+'</button>'+
                                    '<button onclick="renewEsim(\\''+id+'\\','+cycleNum+')" class="btn-icon" title="续期">'+SVG.refresh+'</button>'+
                                    '<button onclick="deleteEsim(\\''+id+'\\')" class="btn-icon btn-icon-danger" title="删除">'+SVG.trash+'</button>'+
                                '</div>'+
                            '</div>'+
                            '<div class="card-name truncate" title="'+esc(sim.name)+'">'+esc(sim.name||'')+'</div>'+
                            '<div class="card-number truncate">'+esc(sim.number||'—')+'</div>'+esimCodeHTML+remarkHTML+platformsHTML+
                            '<div class="card-footer">'+
                                '<div class="flex justify-between text-sm mb-s"><span class="text-secondary">剩余</span><span class="font-semibold'+(diff<=0?' text-warn':diff<=15?' text-danger':'')+'">'+( diff<0?'0':diff)+' 天</span></div>'+
                                '<div class="progress-track"><div class="progress-fill '+fillClass+'" style="width:'+pct+'%"></div></div>'+
                                '<div class="card-meta mt-s"><span>周期 '+(parseInt(sim.cycle,10)||'-')+' 天</span><span class="mono">'+esc(sim.expireDate)+'</span></div>'+
                            '</div>'+
                        '</div>';
                });
                c.innerHTML=html;
            }
            document.getElementById('stat-safe').innerText=safeC;
            document.getElementById('stat-warn').innerText=warnC;
            document.getElementById('stat-danger').innerText=dangC;
        }

        // ==================== COPY ====================
        function copyEsimCodeRaw(btn){
            var text=(btn.getAttribute('data-code')||'').replace(/^lpa:/i,'LPA:');
            var orig=btn.textContent;
            function onSuccess(){
                btn.textContent='已复制';
                setTimeout(function(){btn.textContent=orig;},1500);
            }
            if(navigator.clipboard&&navigator.clipboard.writeText){
                navigator.clipboard.writeText(text).then(onSuccess).catch(function(){fallbackCopy(text,btn,orig);});
            }else{fallbackCopy(text,btn,orig);}
        }
        function fallbackCopy(text,btn,orig){
            var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
            document.body.appendChild(ta);ta.select();
            try{document.execCommand('copy');btn.textContent='已复制';setTimeout(function(){btn.textContent=orig;},1500);}
            catch(e){showToast('复制失败','error');}
            document.body.removeChild(ta);
        }

        // ==================== SEARCH ====================
        function filterCards(){
            var q=document.getElementById('searchInput').value.toLowerCase().trim();
            var cards=document.querySelectorAll('#esim-container > .card');
            var found=0;
            cards.forEach(function(card){
                var v=!q||card.getAttribute('data-search-text').indexOf(q)!==-1;
                card.style.display=v?'':'none';
                if(v)found++;
            });
            var nr=document.getElementById('no-result-msg');
            if(found===0&&esimData.length>0){
                if(!nr){nr=document.createElement('div');nr.id='no-result-msg';nr.className='col-span text-center text-tertiary py-s';nr.textContent='无匹配结果';document.getElementById('esim-container').appendChild(nr);}
            }else{if(nr)nr.remove();}
        }

        // ==================== CRUD ====================
        async function submitForm(e){
            e.preventDefault();
            var b=document.getElementById('submitBtn'),o=b.textContent;
            b.disabled=true;b.textContent='保存中…';
            var p={name:document.getElementById('simName').value.trim(),number:document.getElementById('simNumber').value.trim(),cycle:parseInt(document.getElementById('simCycle').value,10)||0,platforms:document.getElementById('simPlatforms').value.trim(),remark:document.getElementById('simRemark').value.trim(),expireDate:document.getElementById('simExpire').value,esimCode:(function(s){return s?s.replace(/^lpa:/i,'LPA:'):''})(document.getElementById('simEsimCode').value.trim())};
            if(editingId)p.id=editingId;
            try{
                var r=await fetch(WORKER_API_URL,{method:editingId?'PUT':'POST',headers:getAuthHeaders(),body:JSON.stringify(p)});
                if(r.status===401){logout();return;}
                if(r.ok){closeModal();await fetchEsimData();}else{showToast('保存失败','error');}
            }catch(e){showToast('连接失败','error');}
            finally{b.textContent=o;b.disabled=false;}
        }

        function renewEsim(id,cycle){
            if(!cycle||cycle===0){showToast('未设置保号周期','error');return;}
            openConfirmModal({
                title:'一键续期',message:'以今天为基准，往后顺延 '+cycle+' 天。',
                btnText:'确定续期',btnClass:'btn-primary',
                onConfirm:async function(){
                    var b=document.getElementById('confirmActionBtn'),o=b.textContent;
                    b.disabled=true;b.textContent='续期中…';
                    var d=new Date();d.setDate(d.getDate()+parseInt(cycle,10));
                    var s=dateStr(d);
                    try{
                        var r=await fetch(WORKER_API_URL,{method:'PUT',headers:getAuthHeaders(),body:JSON.stringify({id:id,expireDate:s})});
                        if(r.status===401){logout();return;}
                        if(r.ok){closeConfirmModal();await fetchEsimData();}else{showToast('续期失败','error');b.textContent=o;b.disabled=false;}
                    }catch(e){showToast('连接失败','error');b.textContent=o;b.disabled=false;}
                }
            });
        }

        function deleteEsim(id){
            openConfirmModal({
                title:'确认删除',message:'此操作无法恢复。',btnText:'删除',btnClass:'btn-danger',
                onConfirm:async function(){
                    var b=document.getElementById('confirmActionBtn'),o=b.textContent;
                    b.disabled=true;b.textContent='删除中…';
                    try{
                        var r=await fetch(WORKER_API_URL,{method:'DELETE',headers:getAuthHeaders(),body:JSON.stringify({id:id})});
                        if(r.status===401){logout();return;}
                        if(r.ok){closeConfirmModal();await fetchEsimData();}else{showToast('删除失败','error');b.textContent=o;b.disabled=false;}
                    }catch(e){showToast('连接失败','error');b.textContent=o;b.disabled=false;}
                }
            });
        }

        // ==================== MODALS ====================
        function showModal(mid,cid){
            var m=document.getElementById(mid),c=document.getElementById(cid);
            m.classList.remove('hidden');
            setTimeout(function(){c.classList.remove('modal-enter');},10);
        }
        function hideModal(mid,cid,cb){
            var m=document.getElementById(mid),c=document.getElementById(cid);
            c.classList.add('modal-enter');
            setTimeout(function(){m.classList.add('hidden');if(cb)cb();},200);
        }
        function openModal(){
            editingId=null;
            document.getElementById('modalTitle').textContent='新增 eSIM';
            document.getElementById('addForm').reset();
            showModal('addModal','modalContent');
        }
        function openEditModal(id){
            var s=esimData.find(function(x){return x.id===id;});
            if(!s)return;editingId=id;
            document.getElementById('modalTitle').textContent='编辑 eSIM';
            document.getElementById('simName').value=s.name||'';
            document.getElementById('simNumber').value=s.number||'';
            document.getElementById('simCycle').value=s.cycle||'';
            document.getElementById('simPlatforms').value=s.platforms||'';
            document.getElementById('simRemark').value=s.remark||'';
            document.getElementById('simEsimCode').value=s.esimCode||'';
            document.getElementById('simExpire').value=s.expireDate||'';
            showModal('addModal','modalContent');
        }
        function closeModal(){hideModal('addModal','modalContent',function(){editingId=null;});}

        function openConfirmModal(opts){
            document.getElementById('confirmTitle').textContent=opts.title||'确认操作';
            document.getElementById('confirmMessage').textContent=opts.message||'';
            var b=document.getElementById('confirmActionBtn');
            b.textContent=opts.btnText||'确定';
            b.className='btn flex-1 '+(opts.btnClass||'btn-primary');
            b.onclick=async function(){if(opts.onConfirm)await opts.onConfirm();};
            showModal('confirmModal','confirmModalContent');
        }
        function closeConfirmModal(){hideModal('confirmModal','confirmModalContent');}
    </script>
</body>
</html>`;

// ==================== Cloudflare Worker Backend ====================
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const JSON_HEADERS = { "Content-Type": "application/json;charset=UTF-8" };
const MAX_LEN = { name: 80, number: 40, platforms: 120, remark: 240, esimCode: 512 };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS_HEADERS, ...JSON_HEADERS } });
}

function clip(value, max) {
  return String(value || "").trim().slice(0, max);
}

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function cleanCycle(value, required) {
  if (value === undefined || value === null || value === "") return required ? null : undefined;
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= 1 && n <= 3650 ? n : null;
}

function cleanSim(input, partial = false) {
  const out = {};
  if (!partial || input.name !== undefined) {
    out.name = clip(input.name, MAX_LEN.name);
    if (!out.name) return { error: "名称为必填" };
  }
  if (!partial || input.expireDate !== undefined) {
    out.expireDate = clip(input.expireDate, 10);
    if (!validDate(out.expireDate)) return { error: "到期日格式错误" };
  }
  if (!partial || input.cycle !== undefined) {
    const cycle = cleanCycle(input.cycle, !partial);
    if (cycle === null) return { error: "周期必须是 1-3650 天" };
    if (cycle !== undefined) out.cycle = cycle;
  }
  if (!partial || input.number !== undefined) out.number = clip(input.number, MAX_LEN.number);
  if (!partial || input.platforms !== undefined) out.platforms = clip(input.platforms, MAX_LEN.platforms);
  if (!partial || input.remark !== undefined) out.remark = clip(input.remark, MAX_LEN.remark);
  if (!partial || input.esimCode !== undefined) {
    const raw = clip(input.esimCode, MAX_LEN.esimCode);
    out.esimCode = raw ? raw.replace(/^lpa:/i, 'LPA:') : raw;
  }
  return { value: out };
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function readEsims(env) {
  const esims = await env.ESIM_KV.get("esim_list", { type: "json" });
  return Array.isArray(esims) ? esims : [];
}

async function authorized(request, env) {
  const token = (request.headers.get("Authorization") || "").trim();
  if (!token) return false;
  const stored = await env.ESIM_KV.get("admin_session_token");
  return stored && stored === token;
}

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

function tgEsc(value) {
  return String(value || "").replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

async function sendTelegram(token, chat, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML" })
  });
}

function daysUntilCST(dateString, now = new Date()) {
  const [y, m, d] = dateString.split("-").map(Number);
  const exp = Date.UTC(y, m - 1, d);
  const cst = new Date(now.getTime() + 8 * 3600 * 1000);
  const today = Date.UTC(cst.getUTCFullYear(), cst.getUTCMonth(), cst.getUTCDate());
  return Math.ceil((exp - today) / 86400000);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (path === "/" || path === "/index.html") {
      return new Response(HTML_CONTENT, {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
          "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
        }
      });
    }

    if (!env.ESIM_KV) {
      return json({ success: false, message: "KV 未绑定，请绑定 ESIM_KV" }, 500);
    }

    if (path === "/api/auth/send" && request.method === "POST") {
      const tgToken = env.TG_BOT_TOKEN, tgChat = env.TG_CHAT_ID;
      try {
        if (!tgToken || !tgChat) return json({ success: false, message: "TG 机器人未配置，请检查 TG_BOT_TOKEN / TG_CHAT_ID" }, 500);
        if (await env.ESIM_KV.get("admin_auth_send_cooldown")) return json({ success: false, message: "验证码已发送，请稍后再试" }, 429);

        const code = String(Math.floor(100000 + Math.random() * 900000));
        const salt = crypto.randomUUID();
        await Promise.all([
          env.ESIM_KV.put("admin_auth_code_hash", await sha256(salt + code), { expirationTtl: 300 }),
          env.ESIM_KV.put("admin_auth_salt", salt, { expirationTtl: 300 }),
          env.ESIM_KV.put("admin_auth_attempts", "0", { expirationTtl: 300 }),
          env.ESIM_KV.put("admin_auth_send_cooldown", "1", { expirationTtl: 60 })
        ]);

        const text = `🔐 <b>eSIM 保号面板 · 安全验证</b>\n\n动态验证码：<code>${code}</code>\n\n<i>5 分钟内有效。如非本人操作请忽略。</i>`;
        const tgRes = await sendTelegram(tgToken, tgChat, text);
        if (!tgRes.ok) {
          await Promise.all([
            env.ESIM_KV.delete("admin_auth_code_hash"),
            env.ESIM_KV.delete("admin_auth_salt"),
            env.ESIM_KV.delete("admin_auth_attempts"),
            env.ESIM_KV.delete("admin_auth_send_cooldown")
          ]);
          return json({ success: false, message: "发送失败，请检查机器人状态" }, 500);
        }
        return json({ success: true });
      } catch {
        return json({ success: false, message: "系统错误，请重试" }, 500);
      }
    }

    if (path === "/api/auth/verify" && request.method === "POST") {
      try {
        const body = await readJson(request);
        const code = String(body && body.code || "").trim();
        if (!/^\d{6}$/.test(code)) return json({ success: false, message: "请输入 6 位验证码" }, 400);

        const [storedHash, salt, attemptsRaw] = await Promise.all([
          env.ESIM_KV.get("admin_auth_code_hash"),
          env.ESIM_KV.get("admin_auth_salt"),
          env.ESIM_KV.get("admin_auth_attempts")
        ]);
        let attempts = parseInt(attemptsRaw, 10) || 0;

        if (attempts >= 3) {
          await Promise.all([env.ESIM_KV.delete("admin_auth_code_hash"), env.ESIM_KV.delete("admin_auth_salt"), env.ESIM_KV.delete("admin_auth_attempts")]);
          return json({ success: false, message: "错误次数过多，验证码已失效" }, 403);
        }
        if (!storedHash || !salt) return json({ success: false, message: "验证码已过期，请重新获取" }, 400);

        if (await sha256(salt + code) === storedHash) {
          const token = crypto.randomUUID();
          await Promise.all([
            env.ESIM_KV.put("admin_session_token", token, { expirationTtl: 86400 }),
            env.ESIM_KV.delete("admin_auth_code_hash"),
            env.ESIM_KV.delete("admin_auth_salt"),
            env.ESIM_KV.delete("admin_auth_attempts")
          ]);
          return json({ success: true, token });
        }

        attempts++;
        await env.ESIM_KV.put("admin_auth_attempts", String(attempts), { expirationTtl: 300 });
        return json({ success: false, message: `验证码错误！剩余 ${Math.max(0, 3 - attempts)} 次` }, 401);
      } catch {
        return json({ success: false, message: "系统错误，请重试" }, 500);
      }
    }

    if (path === "/api/esims") {
      if (!await authorized(request, env)) return json({ error: "Unauthorized" }, 401);

      let esims;
      try { esims = await readEsims(env); }
      catch { return json({ error: "KV 读取失败" }, 500); }

      if (request.method === "GET") return json(esims);

      if (request.method === "POST") {
        const body = await readJson(request);
        if (!body) return json({ success: false, message: "请求格式错误" }, 400);
        const cleaned = cleanSim(body);
        if (cleaned.error) return json({ success: false, message: cleaned.error }, 400);
        const sim = { id: crypto.randomUUID(), ...cleaned.value };
        esims.push(sim);
        await env.ESIM_KV.put("esim_list", JSON.stringify(esims));
        return json({ success: true, id: sim.id });
      }

      if (request.method === "PUT") {
        const body = await readJson(request);
        const id = body && String(body.id || "").trim();
        if (!id) return json({ success: false, message: "缺少记录 ID" }, 400);
        const cleaned = cleanSim(body, true);
        if (cleaned.error) return json({ success: false, message: cleaned.error }, 400);

        let found = false;
        esims = esims.map(sim => {
          if (sim.id !== id) return sim;
          found = true;
          return { ...sim, ...cleaned.value, id: sim.id };
        });
        if (!found) return json({ success: false, message: "未找到记录" }, 404);
        await env.ESIM_KV.put("esim_list", JSON.stringify(esims));
        return json({ success: true });
      }

      if (request.method === "DELETE") {
        const body = await readJson(request);
        const id = body && String(body.id || "").trim();
        if (!id) return json({ success: false, message: "缺少记录 ID" }, 400);
        const before = esims.length;
        esims = esims.filter(sim => sim.id !== id);
        if (esims.length === before) return json({ success: false, message: "未找到记录" }, 404);
        await env.ESIM_KV.put("esim_list", JSON.stringify(esims));
        return json({ success: true });
      }

      return json({ error: "Method Not Allowed" }, 405);
    }

    return new Response("404 Not Found", { status: 404, headers: { "Content-Type": "text/plain;charset=UTF-8" } });
  },

  async scheduled(event, env) {
    const tgToken = env.TG_BOT_TOKEN, tgChat = env.TG_CHAT_ID;
    if (!env.ESIM_KV || !tgToken || !tgChat) return;

    let esims;
    try { esims = await readEsims(env); }
    catch { return; }
    if (!esims.length) return;

    const messages = [];
    esims.forEach(sim => {
      if (!validDate(sim.expireDate)) return;
      const diff = daysUntilCST(sim.expireDate);
      const name = tgEsc(sim.name || "未命名");
      const number = tgEsc(sim.number || "未填写");
      const cycle = sim.cycle ? `${tgEsc(sim.cycle)}天` : "未设置";
      const remark = sim.remark ? `\n📝 备注: ${tgEsc(sim.remark)}` : "";
      const platforms = sim.platforms ? `\n🌐 平台: ${tgEsc(sim.platforms)}` : "";

      if (diff <= 30 && diff > 0) messages.push(`⚠️ <b>保号提醒</b>\n📱 ${name}\n📞 ${number}\n🔄 ${cycle}\n📅 ${tgEsc(sim.expireDate)}${remark}${platforms}\n⏳ 剩余 ${diff} 天`);
      else if (diff === 0) messages.push(`🚨 <b>紧急</b>\n📱 ${name} 今天到期！${remark}${platforms}`);
      else if (diff < 0) messages.push(`❌ <b>已过期</b>\n📱 ${name} 已过期 ${Math.abs(diff)} 天${remark}${platforms}`);
    });

    if (messages.length) await sendTelegram(tgToken, tgChat, messages.join("\n\n---\n\n"));
  }
};
