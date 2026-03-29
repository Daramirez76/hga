<?php

namespace App\Http\Controllers;

use App\Http\Requests\visitasRequest;
use App\Services\visitasService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class visitasController extends Controller
{
    protected visitasService $visitasService;

    public function __construct(visitasService $visitasService)
    {
        $this->visitasService = $visitasService;
    }

    public function index(Request $request): JsonResponse
    {
        $pagination = $this->resolvePaginationQuery($request);
        $visitas = $this->visitasService->getAllVisitas(
            $pagination['page'],
            $pagination['per_page'],
            $pagination['search'],
            $pagination['paginate']
        );

        return $this->paginatedJsonResponse('visitas retrieved successfully', $visitas);
    }

    public function show(int $id): JsonResponse
    {
        $visita = $this->visitasService->getVisitaById($id);

        if (!$visita) {
            return response()->json([
                'message' => 'visita not found',
            ], 404);
        }

        return response()->json([
            'message' => 'visita retrieved successfully',
            'data' => $visita,
        ]);
    }

    public function store(visitasRequest $request): JsonResponse
    {
        $visita = $this->visitasService->create($request->validated());
        return response()->json([
            'message' => 'visita created successfully',
            'data' => $visita,
        ], 201);
    }

    public function update(visitasRequest $request, int $id): JsonResponse
    {
        $visita = $this->visitasService->update($id, $request->validated());

        if (!$visita) {
            return response()->json([
                'message' => 'visita not found',
            ], 404);
        }

        return response()->json([
            'message' => 'visita updated successfully',
            'data' => $visita,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->visitasService->delete($id);

        if (!$deleted) {
            return response()->json([
                'message' => 'visita not found',
            ], 404);
        }

        return response()->json([
            'message' => 'visita deleted successfully',
        ]);
    }
}
