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

## Commit message (Conventional Commits – commitlint chặn sai định dạng)

```
<type>(<scope>): <mô tả ngắn, ≤ 100 ký tự, viết ở thì hiện tại, không chấm cuối>

[phần thân – tuỳ chọn: giải thích TẠI SAO, ảnh hưởng gì]
[footer – tuỳ chọn: Closes #12, BREAKING CHANGE: …]
```

### Ý nghĩa từng `type` – chọn theo câu hỏi "commit này làm gì cho sản phẩm?"

| type       | Dùng khi                                                                                   | Ví dụ                                                            | Không dùng khi                                    |
| ---------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------- |
| `feat`     | Thêm **tính năng mới** người dùng thấy được: API mới, màn hình mới, nút mới, business rule mới | `feat(class): thêm API đăng ký lớp và kiểm tra trùng giờ`      | Sửa lỗi của tính năng cũ (→ `fix`)               |
| `fix`      | **Sửa lỗi** – trước đó hành vi sai, giờ đúng                                                | `fix(auth): token hết hạn không tự đăng xuất`                    | Thay đổi hành vi theo ý muốn mới (→ `feat`)      |
| `refactor` | **Sửa cấu trúc code, không đổi hành vi**: tách file > 200 dòng, đổi tên, gom hàm dùng chung  | `refactor(user): tách cột bảng ra UserTableColumns`              | Có kèm sửa bug hay thêm tính năng (tách commit)  |
| `perf`     | Cải thiện **hiệu năng**, hành vi không đổi                                                  | `perf(report): thêm index cho invoices.created_at`               |                                                   |
| `style`    | Chỉ **định dạng**: khoảng trắng, dấu chấm phẩy, Prettier, thứ tự import. Không đổi logic     | `style(fe): chạy prettier toàn bộ pages`                         | Sửa CSS/giao diện (đó là `feat` hoặc `fix`)      |
| `test`     | Thêm/sửa **test** hoặc test case, không đụng code sản phẩm                                  | `test(rbac): thêm case thu hồi quyền`                            |                                                   |
| `docs`     | Chỉ **tài liệu**: README, docs/, JSDoc, comment                                             | `docs(rbac): bổ sung permission attendance`                      |                                                   |
| `chore`    | **Việc vặt** không ảnh hưởng code sản phẩm: nâng thư viện, cấu hình ESLint/CI/husky, script, .gitignore | `chore(fe): nâng antd lên 6.6.3` · `chore(ci): thêm bước build` |                                        |
| `revert`   | **Hoàn tác** một commit trước                                                               | `revert: feat(class): thêm API đăng ký lớp` + footer `Reverts abc123` |                                             |

Mẹo nhớ: người dùng thấy khác → `feat`/`fix`; chỉ dev thấy khác → `refactor`/`style`/`test`/`docs`/`chore`.

### `scope` – phạm vi thay đổi (chữ thường, ngắn)

| Nhóm       | scope gợi ý                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Module BE  | `auth`, `user`, `role`, `setting`, `member`, `membership`, `plan`, `subject`, `room`, `class`, `schedule`, `payment`, `invoice`, `report`, `sepay`, `db` (schema/migration/seed) |
| FE         | `fe` (chung), hoặc tên trang: `login`, `dashboard`, `roles`, `users`, `classes`…                |
| Khác       | `shared`, `docs`, `ci`, `deps`, `scripts`, `test`                                               |

Bỏ scope được nếu thay đổi quá rộng: `chore: cấu hình lại eslint cho cả 3 workspace`.

### Ví dụ đúng / sai

```
✅ feat(payment): sinh QR SePay kèm mã hoá đơn trong nội dung chuyển khoản
✅ fix(class): không cho đăng ký khi lớp đã đủ chỗ (BR-2.2)
✅ refactor(role): tách resolvePermissionIds ra khỏi create/update
✅ chore(deps): nâng prisma lên 7.10
✅ test(auth): thêm TC-AUTH-09 role mặc định khi đăng ký
✅ docs: thêm bảng ý nghĩa commit type

❌ update code            (không type, không nói gì)
❌ feat: fix bug login     (feat nhưng nội dung là fix)
❌ fix(class): sửa lỗi     (sửa lỗi gì?)
❌ feat(class): thêm API đăng ký lớp, sửa lỗi login, format code   (3 việc → 3 commit)
❌ Feat(Class): Thêm API   (type/scope phải chữ thường)
```

Mỗi commit là **một** thay đổi có nghĩa và chạy được. Không commit "wip", "fix bug", "update". Commit nhỏ, thường xuyên; PR sẽ squash lại thành 1 commit trên dev nên lịch sử vẫn gọn.

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
