<?php

namespace App\Http\Controllers;

use App\Http\Requests\informesRequest;
use App\Services\informesService;
use Illuminate\Http\JsonResponse;

class informesController extends Controller
{
    protected informesService $informesService;

    public function __construct(informesService $informesService)
    {
        $this->informesService = $informesService;
    }

    public function index(): JsonResponse
    {
        $informes = $this->informesService->getAllInformes();

        return response()->json([
            'message' => 'informes retrieved successfully',
            'data' => $informes,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $informes = $this->informesService->getInformeById($id);

        if (!$informes) {
            return response()->json([
                'message' => 'informes not found',
            ], 404);
        }

        return response()->json([
            'message' => 'informes retrieved successfully',
            'data' => $informes,
        ]);
    }

    public function store(informesRequest $request): JsonResponse
    {
        $informes = $this->informesService->create($request->validated());

        return response()->json([
            'message' => 'informes created successfully',
            'data' => $informes,
        ], 201);
    }

    public function update(informesRequest $request, int $id): JsonResponse
    {
        $informes = $this->informesService->update($id, $request->validated());

        if (!$informes) {
            return response()->json([
                'message' => 'informes not found',
            ], 404);
        }

        return response()->json([
            'message' => 'informes updated successfully',
            'data' => $informes,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $result = $this->informesService->delete($id);

        if (!$result) {
            return response()->json([
                'message' => 'informes not found',
            ], 404);
        }

        return response()->json([
            'message' => 'informes deleted successfully',
        ]);
    }
}
