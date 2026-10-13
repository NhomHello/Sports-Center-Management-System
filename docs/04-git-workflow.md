# 04 · Git workflow

## Nhánh

```
main      ổn định, chỉ merge từ dev khi demo/nộp. KHÔNG push thẳng.
dev       tích hợp. Mọi PR merge vào đây.
feature/<flow>-<viec>     ví dụ: feature/f1-membership-plan-crud, feature/f2-class-booking-ui
fix/<viec>                ví dụ: fix/login-redirect
chore/<viec>              cấu hình, docs, lint
```

Một nhánh = một task trên board. Nhánh sống tối đa ~3 ngày, task to thì chia nhỏ.

## Quy trình

```bash
git checkout dev && git pull                 # luôn bắt đầu từ dev mới nhất
git checkout -b feature/f1-membership-plan-crud
# ... code, commit nhiều lần nhỏ ...
git fetch origin && git rebase origin/dev    # (hoặc merge dev vào) trước khi tạo PR
git push -u origin feature/f1-membership-plan-crud
# tạo PR vào dev trên GitHub, điền template, gắn reviewer
```

- PR phải có **≥ 1 người review approve** và CI xanh mới merge. Merge bằng **Squash and merge** để lịch sử dev sạch.
- Review trong 24h. Người review kiểm tra theo checklist trong PR template + `docs/01-quy-tac-code.md` mục 7.
- Xoá nhánh sau khi merge.

## Commit message (Conventional Commits – commitlint blocks bad format)

**Language rule: commit messages are written in English only** (subject, body and footer). Do not mix Vietnamese and English.
Do not add AI tools as authors: no `Co-Authored-By: Claude ...` trailer and no "Generated with ..." lines. Commits belong to the team members who wrote and reviewed them.

```
<type>(<scope>): <short English description, <= 100 chars, imperative mood, no trailing period>

[body - optional: explain WHY and the impact, in English]
[footer - optional: Closes #12, BREAKING CHANGE: ...]
```

### Meaning of each `type` – pick by asking "what does this commit do for the product?"

| type       | Use when                                                                              | Example                                                   | Do not use when                          |
| ---------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------- |
| `feat`     | Add a **new feature** users can see: new API, screen, button, business rule          | `feat(class): add class enrollment with time-clash check` | Fixing an old feature (use `fix`)        |
| `fix`      | **Fix a bug**: behavior was wrong, now correct                                        | `fix(auth): log out automatically when token expires`     | Changing behavior on purpose (`feat`)    |
| `refactor` | **Restructure code, same behavior**: split files > 200 lines, rename, extract helpers | `refactor(user): extract table columns to UserTableColumns` | Mixed with a bug fix or feature          |
| `perf`     | Improve **performance**, same behavior                                                | `perf(report): add index on invoices.created_at`          |                                          |
| `style`    | **Formatting only**: whitespace, semicolons, Prettier, import order                   | `style(fe): run prettier on all pages`                    | CSS/UI changes (those are feat or fix)   |
| `test`     | Add/change **tests** or test cases only                                               | `test(rbac): add permission revoke case`                  |                                          |
| `docs`     | **Documentation only**: README, docs/, JSDoc, comments                                | `docs(rbac): document attendance permission`              |                                          |
| `chore`    | **Maintenance** with no product code impact: deps, ESLint/CI/husky config, scripts    | `chore(deps): bump antd to 6.6.3`                         |                                          |
| `revert`   | **Undo** a previous commit                                                            | `revert: feat(class): add class enrollment API` + footer `Reverts abc123` |                          |

Rule of thumb: users see a difference -> `feat`/`fix`; only developers see it -> `refactor`/`style`/`test`/`docs`/`chore`.

### `scope` – area of change (lowercase, short)

| Group      | Suggested scopes                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE modules | `auth`, `user`, `role`, `setting`, `member`, `membership`, `plan`, `subject`, `room`, `class`, `schedule`, `payment`, `invoice`, `report`, `sepay`, `db` (schema/migration/seed) |
| FE         | `fe` (general), or a page name: `login`, `dashboard`, `roles`, `users`, `classes`                                                                                 |
| Other      | `shared`, `docs`, `ci`, `deps`, `scripts`, `test`                                                                                                                 |

Scope may be omitted when the change is very broad: `chore: reconfigure eslint for all 3 workspaces`.

### Good / bad examples

```
OK  feat(payment): generate SePay QR with invoice code in transfer content
OK  fix(class): block enrollment when the class is full (BR-2.2)
OK  refactor(role): extract resolvePermissionIds from create/update
OK  chore(deps): bump prisma to 7.10
OK  test(auth): add TC-AUTH-09 default role on register
OK  docs: add commit type table

BAD update code                       (no type, says nothing)
BAD feat: fix login bug               (feat but the content is a fix)
BAD fix(class): fix error             (which error?)
BAD feat(class): add enroll API, fix login, format code   (3 changes -> 3 commits)
BAD Feat(Class): Add API              (type/scope must be lowercase)
BAD feat(class): them API dang ky lop (Vietnamese / mixed language)
```

Each commit is **one** meaningful, working change. No "wip", "fix bug", "update". Commit small and often; the PR is squashed into one commit on dev, so history stays clean.

## Hook tự động (husky)

| Lúc        | Chạy gì                                                     | Nếu fail                              |
| ---------- | ----------------------------------------------------------- | ------------------------------------- |
| pre-commit | `lint-staged`: ESLint --fix + Prettier trên file đã stage   | Sửa lỗi ESLint báo (đa số tự fix), `git add` lại, commit lại |
| commit-msg | `commitlint`                                                | Sửa message theo mẫu trên             |
| CI (GitHub)| format:check, lint, prisma generate, build FE               | Xem tab Actions, sửa, push lại        |

Không dùng `--no-verify`. Nếu thấy rule vô lý, mở issue để cả nhóm quyết.

## Xử lý conflict

1. `git fetch origin` → `git rebase origin/dev` (hoặc `git merge origin/dev`).
2. Mở file conflict, giữ đúng phần, chạy `npm run lint` và thử lại tính năng.
3. `git add` → `git rebase --continue` → `git push --force-with-lease` (chỉ trên nhánh feature của mình).

Conflict hay xảy ra ở: `src/routes.js`, `routeRegistry.jsx`, `constants/index.js`, `schema.prisma`, `permissions.js`. Khi sửa các file này, **thêm vào cuối khối liên quan** và merge dev thường xuyên.

## Migration Prisma khi làm nhóm

- Sửa `schema.prisma` → `npm run db:migrate` → nhập tên → commit cả thư mục `prisma/migrations/<timestamp>_<ten>/`.
- Pull về thấy migration mới → `npm run dev` tự apply (`migrate deploy`). Lỗi "drift" → `npm run db:reset` (xoá DB dev, seed lại, mất data test).
- Hai người cùng sửa schema → người merge sau chạy `npm run db:migrate` lại để sinh migration hợp nhất, không sửa tay migration đã push.

## Không commit

`.env`, `node_modules`, `dist`, file IDE cá nhân, ảnh/GIF lớn (đính vào PR thay vì repo), data dump.
