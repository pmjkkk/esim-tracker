# esim-tracker

极简的 eSIM 保号提醒面板：记录到期日、保号周期、绑定平台、备注与激活码，到期前通过 Telegram 自动提醒。

- 🗂 **单文件**：前端、API、鉴权、定时任务全部在 `worker.js`
- ☁️ **零运维**：无需服务器、数据库或构建流程，数据存于 Cloudflare KV
- 🔔 **主动提醒**：Cron 定时跑，到期前后自动推送 Telegram
- 🔐 **带鉴权**：Telegram 动态验证码登录，无需额外账号体系

> 仓库名与 Cloudflare Worker 服务名统一使用小写短横线：`esim-tracker`。

## 功能

| 功能 | 说明 |
|------|------|
| 到期提醒 | 到期前 30 天每天提醒；到期当天提醒；过期后每天提醒 |
| 一键续期 | 按保号周期从今天起自动顺延到期日 |
| 状态看板 | 安全（>45 天）、关注（16–45 天）、告警（≤15 天）三类统计，按到期时间排序 |
| 区号识别 | 根据国际区号显示 Emoji 国旗，无外部图片依赖 |
| 平台标签 | 支持 Telegram、Google、WhatsApp 等平台标签 |
| eSIM 激活码 | 存储 LPA 激活码，卡片上一键复制，不显示明文 |
| 备注 & 搜索 | 按名称、号码、平台、备注实时搜索 |
| Telegram 验证码 | 6 位验证码登录，5 分钟有效，3 次错误后失效 |
| 安全加固 | 验证码哈希存储、发送冷却、输入校验、HTML 转义、CSP 响应头 |

## 技术栈

Cloudflare Workers · Workers KV · Telegram Bot API · 原生 HTML/CSS/JS · Wrangler

## 项目结构

```text
.
├── README.md
├── worker.js        # 前端 + API + 定时提醒
└── wrangler.toml    # Worker 名称、入口和 Cron 配置
```

## 配置速查

部署前先在 Cloudflare Worker 中准备好以下绑定与变量：

| 类型 | 名称 | 值 / 说明 |
|------|------|-----------|
| KV 绑定 | `ESIM_DB` | 指向你创建的 KV Namespace（建议命名 `esim_kv`） |
| 环境变量 | `TG_BOT_TOKEN` | @BotFather 颁发的 Telegram Bot Token |
| 环境变量 | `TG_CHAT_ID` | @userinfobot 返回的 Chat ID |

## 部署

### 1. 准备 Telegram Bot

1. 在 Telegram 搜索 [@BotFather](https://t.me/BotFather)，发送 `/newbot` 创建机器人，保存返回的 **Bot Token**（形如 `1234567890:ABCdef...`）。
2. 搜索 [@userinfobot](https://t.me/userinfobot) 获取自己的 **Chat ID**（形如 `123456789`）。
3. 给你的机器人主动发送一条消息，激活会话（否则机器人无法给你推送）。

### 2. 创建 KV

Cloudflare Dashboard → `Storage & databases → Workers KV → Create Instance`，建议命名 `esim_kv`。

### 3. 部署 Worker

任选其一：

- **连接 Git**：`Workers & Pages → Create application → Workers → Connect to Git`，选择 `esim-tracker` 仓库，无需设置构建输出目录。
- **本地 CLI**：

  ```bash
  npx wrangler deploy
  ```

### 4. 绑定 KV 与环境变量

进入 Worker 项目 `esim-tracker`，按「[配置速查](#配置速查)」完成：

- `Settings → Bindings → Add binding → KV Namespace`：变量名 `ESIM_DB` → 选择 `esim_kv`
- `Settings → Variables and Secrets → Add`：添加 `TG_BOT_TOKEN` 与 `TG_CHAT_ID`

### 5. 访问面板

打开 `https://esim-tracker.<your-subdomain>.workers.dev`，点击「发送验证码」，在 Telegram 收到 6 位验证码后登录。

## 定时提醒

`wrangler.toml` 默认每天执行一次：

```toml
[triggers]
crons = ["0 2 * * *"]
```

Cloudflare Cron 使用 UTC 时间，`0 2 * * *` 约等于北京时间每天 10:00。提醒规则：

| 到期状态 | 提醒规则 |
|----------|----------|
| 剩余 1–30 天 | 每天提醒 |
| 今天到期 | 当天提醒 |
| 已过期 | 每天提醒 |

## 数据字段

每张 eSIM 卡片包含：

| 字段 | 必填 | 示例 / 说明 |
|------|:----:|-------------|
| 名称 | ✅ | `GiffGaff` |
| 周期 | ✅ | 保号周期天数，范围 1–3650，例如 `180` |
| 到期日 | ✅ | 格式 `YYYY-MM-DD` |
| 号码 | — | `+1 234 567 8900`（用于识别国旗） |
| 平台 | — | 逗号或空格分隔，例如 `Telegram, Google` |
| 备注 | — | 记录保号要求 |
| eSIM 激活码 | — | LPA 格式，例如 `LPA:1$smdp.example.com$XXXX-XXXX`，最长 512 字符 |

## 安全说明

- 验证码仅以加盐哈希存储，KV 中不保存明文
- 验证码 5 分钟有效，错误 3 次后自动失效
- 发送验证码有冷却限制，避免频繁刷 Telegram
- 登录 Token 24 小时有效，且仅保存在前端内存中，关闭页面即清空
- 用户输入统一进行 HTML 转义，降低 XSS 风险
- 响应头包含基础 CSP、`nosniff`、`no-referrer`
- eSIM 激活码不在卡片上显示明文，仅提供一键复制

## 常见问题

| 问题 | 处理方式 |
|------|----------|
| Wrangler 报 `name` 不合法 | `wrangler.toml` 的 `name` 必须全小写，只能包含字母、数字和短横线 |
| 页面 404 | 确认 Worker 部署成功，入口文件是 `worker.js` |
| API 报 KV 未绑定 | 确认绑定变量名是 `ESIM_DB` |
| 收不到验证码 | 确认 Bot Token / Chat ID 正确，且已主动给机器人发过消息 |
| 验证码过期 | 重新点击「发送验证码」 |
| 定时提醒没收到 | 检查 Cron 是否启用、TG 环境变量是否正确、KV 中是否有卡片数据 |
| 激活码复制后乱码 | 确认输入时以 `LPA:` 开头，系统会自动纠正大小写 |

## License

MIT
