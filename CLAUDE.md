# erp-frontend

React 19 + TypeScript + Vite admin frontend for the ERP system. Talks to `erp-backend`
(Spring Boot) at `VITE_API_BASE_URL` (default `http://localhost:8080`) via the single axios
instance in `src/api/client.ts`.

## Backend contract — check before changing API code

The backend is a sibling repo at `D:\rishi\erp\erp-backend`, same machine. Before changing a
request/response shape, endpoint path, or adding a field in `src/api/**` or `src/types/**`,
read the matching backend controller/DTO instead of guessing — a mismatch here fails silently
at runtime (axios + TS don't catch a shape mismatch against the real server).

Domain map (frontend → backend Java package, relative to
`D:\rishi\erp\erp-backend\src\main\java\com\rishierp\erp\`):

| Frontend | Backend controller package |
|---|---|
| `api/auth/authApi.ts`, `api/auth/meApi.ts` | `auth.controller` (`AuthController`, `MeController`) |
| `api/admin/roleApi.ts` | `auth.controller.RoleController` |
| `api/admin/userApi.ts` | `auth.controller.UserAdminController` |
| `api/hr/employeeApi.ts`, `orgUnitApi.ts` | `module.hr.controller` |
| `api/attendance/*` | `module.attendance.controller` |
| `api/payroll/*` | `module.payroll.controller` |
| `api/finance/*` | `module.finance.controller` |
| `api/admin/auditLogApi.ts` | `common.auditlog.AuditLogController` |
| `api/admin/fieldConfigApi.ts` | `common.customization.UiFieldConfigController` |
| `api/public/brandingApi.ts` | `tenant.branding.TenantBrandingController` |

DTOs live in the matching `dto` package next to each `controller` package (e.g.
`module.hr.dto` for `module.hr.controller`).

Secondary cross-check if the backend is running locally: OpenAPI spec at
`http://localhost:8080/v3/api-docs`, Swagger UI at `http://localhost:8080/swagger-ui/index.html`.

## Design tokens / theming

All colors/spacing/radii live as CSS custom properties in `src/styles/theme.css`. Tenant
branding (`src/context/BrandingContext.tsx`) overrides `--color-primary`, `--color-primary-hover`,
`--font-sans`, plus any arbitrary `--*` var via the `themeVars` map from
`GET /api/public/tenant-branding` — new brandable tokens should be added as backend `themeVars`
entries, not new named fields, where possible. Derived tokens (`--color-primary-active`,
`--color-primary-soft`, `--gradient-primary`) are computed from `--color-primary`/`-hover` via
`color-mix()` in `:root` only — don't redeclare them per-theme or they'll stop tracking branding.
