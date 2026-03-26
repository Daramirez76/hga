<?php

namespace App\Http\Controllers;

use App\Http\Requests\actividadesRequest;
use App\Services\actividadesService;
use Illuminate\Http\JsonResponse;

class actividadesController extends Controller
{
    protected actividadesService $actividadesService;

    public function __construct(actividadesService $actividadesService)
    {
        $this->actividadesService = $actividadesService;
    }

    public function index(): JsonResponse
    {
        $actividades = $this->actividadesService->getAllActividades();

        return response()->json([
            'message' => 'Actividades retrieved successfully',
            'data' => $actividades
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $actividades = $this->actividadesService->getActividadesById($id);
        if (!$actividades) {
            return response()->json([
                'message' => 'Actividad not found'
            ], 404);
        }

        return response()->json([
            'message' => 'Actividad retrieved successfully',
            'data' => $actividades
        ]);
    }

    public function store(actividadesRequest $request): JsonResponse
    {
        $actividades = $this->actividadesService->create($request->validated());

        return response()->json([
            'message' => 'Actividad created successfully',
            'data' => $actividades
        ], 201);
    }

    public function update(actividadesRequest $request, int $id): JsonResponse
    {
        $actividades = $this->actividadesService->update($id, $request->validated());
        if (!$actividades) {
            return response()->json([
                'message' => 'Actividad not found'
            ], 404);
        }

        return response()->json([
            'message' => 'Actividad updated successfully',
            'data' => $actividades
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $result = $this->actividadesService->delete($id);
        if (!$result) {
            return response()->json([
                'message' => 'Actividad not found'
            ], 404);
        }

        return response()->json([
            'message' => 'Actividad deleted successfully'
        ]);
    }
}
