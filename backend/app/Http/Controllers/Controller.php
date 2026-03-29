<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * @return array{page: int, per_page: int, search: ?string, paginate: bool}
     */
    protected function resolvePaginationQuery(Request $request, bool $allowLegacyLimit = false): array
    {
        $page = (int) $request->query('page', 1);
        $page = $page > 0 ? $page : 1;

        $perPageInput = $allowLegacyLimit
            ? $request->query('per_page', $request->query('limit', 5))
            : $request->query('per_page', 5);

        $perPage = (int) $perPageInput;
        if ($perPage <= 0) {
            $perPage = 5;
        }

        $perPage = min(5, $perPage);

        $search = trim((string) $request->query('search', ''));
        $paginate = filter_var($request->query('paginate', false), FILTER_VALIDATE_BOOLEAN) === true;

        return [
            'page' => $page,
            'per_page' => $perPage,
            'search' => $search !== '' ? $search : null,
            'paginate' => $paginate,
        ];
    }

    /**
     * @param array{data: array<int, mixed>, meta: array<string, mixed>} $result
     */
    protected function paginatedJsonResponse(string $message, array $result, int $status = 200): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'data' => $result['data'],
            'meta' => $result['meta'],
        ], $status);
    }
}
