<?php

namespace App\Http\Controllers;

use App\Http\Requests\medicamentosRequest;
use App\Services\medicamentosService;
use Illuminate\Http\JsonResponse;

class medicamentosController extends Controller
{
    protected medicamentosService $medicamentosService;

    public function __construct(medicamentosService $medicamentosService)
    {
        $this->medicamentosService = $medicamentosService;
    }

    public function index(): JsonResponse
    {
        $medicamentos = $this->medicamentosService->getAllmedicamentos();

        return response()->json([
            'message' => 'medicamentos retrieved successfully',
            'data' => $medicamentos,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $medicamentos = $this->medicamentosService->getmedicamentosById($id);

        if (!$medicamentos) {
            return response()->json([
                'message' => 'medicamentos not found',
            ], 404);
        }

        return response()->json([
            'message' => 'medicamentos retrieved successfully',
            'data' => $medicamentos,
        ]);
    }

    public function store(medicamentosRequest $request): JsonResponse
    {
        $medicamentos = $this->medicamentosService->create($request->validated());

        return response()->json([
            'message' => 'medicamentos created successfully',
            'data' => $medicamentos,
        ], 201);
    }

    public function update(int $id, medicamentosRequest $request): JsonResponse
    {
        $medicamentos = $this->medicamentosService->update($id, $request->validated());

        if (!$medicamentos) {
            return response()->json([
                'message' => 'medicamentos not found',
            ], 404);
        }

        return response()->json([
            'message' => 'medicamentos updated successfully',
            'data' => $medicamentos,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $result = $this->medicamentosService->delete($id);

        if (!$result) {
            return response()->json([
                'message' => 'medicamentos not found',
            ], 404);
        }

        return response()->json([
            'message' => 'medicamentos deleted successfully',
        ]);
    }
}
