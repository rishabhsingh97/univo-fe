import { employeeApi } from '../hr/employeeApi';
import type { PageResponse } from '../../types/common';

/**
 * Shared helpers for the "UI built ahead of its backend" domains (Exit, Full & Final,
 * Performance, Career, Retirement - see each domain's api/*.ts file). Every mock api function
 * matches the exact signature its real axios-backed counterpart will have, so swapping the mock
 * implementation for a real HTTP call later never touches a page component.
 */

/** Mimics Spring Data's Page<T> + Pageable `sort` param (e.g. "employeeName,asc") against an
 * in-memory array, so PagedDataTable/usePagedTable work unmodified against mock data. */
export function paginate<T>(all: T[], page: number, size: number, sort?: string): PageResponse<T> {
  let rows = all;
  if (sort) {
    const [key, direction] = sort.split(',');
    const factor = direction === 'desc' ? -1 : 1;
    rows = [...all].sort((a, b) => {
      const av = (a as Record<string, string | number>)[key];
      const bv = (b as Record<string, string | number>)[key];
      if (av === bv) return 0;
      return (av < bv ? -1 : 1) * factor;
    });
  }
  const start = page * size;
  const content = rows.slice(start, start + size);
  return {
    content,
    totalElements: rows.length,
    totalPages: Math.max(1, Math.ceil(rows.length / size)),
    number: page,
    size,
    first: page === 0,
    last: start + size >= rows.length,
  };
}

/** Small artificial delay so loading states (the DataTable spinner, disabled submit buttons)
 * look and behave the way they will once a real network call is behind these functions. */
export function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let mockIdSequence = 5000;

/** IDs for records created during the session - starts well above the seed data's IDs so new
 * rows never collide with them. */
export function nextMockId(): number {
  mockIdSequence += 1;
  return mockIdSequence;
}

/** Real employees exist (Employee Management is fully built) even though these mock domains
 * aren't - so a record created against a real employeeId gets their real name instead of a
 * placeholder, while the hardcoded seed rows below (whose employeeIds won't exist in any real
 * tenant) keep their own hardcoded name. */
export async function resolveEmployeeName(employeeId: number): Promise<string> {
  try {
    const page = await employeeApi.list(0, 200);
    const employee = page.content.find((e) => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${employeeId}`;
  } catch {
    return `Employee #${employeeId}`;
  }
}
