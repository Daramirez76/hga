<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class QueryPaginationService
{
    private const DEFAULT_PER_PAGE = 5;
    private const MAX_PER_PAGE = 5;

    public function normalizePage(mixed $page): int
    {
        $page = (int) $page;

        return $page > 0 ? $page : 1;
    }

    public function normalizePerPage(mixed $perPage): int
    {
        $perPage = (int) $perPage;

        if ($perPage <= 0) {
            return self::DEFAULT_PER_PAGE;
        }

        return min(self::MAX_PER_PAGE, $perPage);
    }

    public function normalizeSearch(mixed $search): ?string
    {
        $search = trim((string) $search);

        return $search !== '' ? $search : null;
    }

    /**
     * @param Collection<int, mixed> $items
     * @param list<string> $fields
     */
    public function filterCollection(Collection $items, mixed $search, array $fields): Collection
    {
        $normalizedSearch = $this->normalizeSearch($search);

        if ($normalizedSearch === null) {
            return $items->values();
        }

        $needle = $this->normalizeSearchableValue($normalizedSearch);

        return $items
            ->filter(function ($item) use ($fields, $needle): bool {
                foreach ($fields as $field) {
                    $value = data_get($item, $field);

                    if (str_contains($this->normalizeSearchableValue($value), $needle)) {
                        return true;
                    }
                }

                return false;
            })
            ->values();
    }

    /**
     * @param Collection<int, mixed> $items
     * @param array<string, mixed> $extraMeta
     * @return array{data: array<int, mixed>, meta: array<string, mixed>}
     */
    public function paginateCollection(Collection $items, mixed $page = 1, mixed $perPage = null, array $extraMeta = [], mixed $search = null): array
    {
        $requestedPage = $this->normalizePage($page);
        $perPageValue = $this->normalizePerPage($perPage);
        $normalizedSearch = $this->normalizeSearch($search);
        $items = $items->values();
        $total = $items->count();
        $lastPage = max(1, (int) ceil($total / $perPageValue));
        $currentPage = min($requestedPage, $lastPage);

        $pageItems = $total > 0
            ? $items->forPage($currentPage, $perPageValue)->values()
            : collect();

        $hasItems = $pageItems->isNotEmpty();
        $from = $hasItems ? (($currentPage - 1) * $perPageValue) + 1 : null;
        $to = $hasItems ? min($from + $pageItems->count() - 1, $total) : null;

        return [
            'data' => $pageItems->all(),
            'meta' => array_merge([
                'pagination' => [
                    'current_page' => $currentPage,
                    'per_page' => $perPageValue,
                    'total' => $total,
                    'last_page' => $lastPage,
                    'from' => $from,
                    'to' => $to,
                    'has_more' => $currentPage < $lastPage && $hasItems,
                    'has_previous' => $currentPage > 1 && $total > 0,
                    'search' => $normalizedSearch,
                ],
            ], $extraMeta),
        ];
    }

    protected function normalizeSearchableValue(mixed $value): string
    {
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '';
        }

        return Str::of((string) $value)->ascii()->lower()->squish()->toString();
    }
}
