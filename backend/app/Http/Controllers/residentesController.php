<?php

namespace App\Http\Controllers;

use App\Http\Requests\residentesRequest;
use App\Services\residentesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class residentesController extends Controller
{
    protected residentesService $residentesService;

    public function __construct(residentesService $residentesService)
    {
        $this->residentesService = $residentesService;
    }

    public function index(Request $request): JsonResponse
    {
        $pagination = $this->resolvePaginationQuery($request);
        $residentes = $this->residentesService->getAllresidentes(
            $pagination['page'],
            $pagination['per_page'],
            $pagination['search'],
            $pagination['paginate']
        );

        return $this->paginatedJsonResponse('residentes retrieved successfully', $residentes);
    }

    public function show(int $id): JsonResponse
    {
        $residentes = $this->residentesService->getresidentesById($id);

        if (!$residentes) {
            return response()->json([
                'message' => 'residentes not found',
            ], 404);
        }

        return response()->json([
            'message' => 'residentes retrieved successfully',
            'data' => $residentes,
        ]);
    }

    public function store(residentesRequest $request): JsonResponse
    {
        $residentes = $this->residentesService->create($request->validated());

        return response()->json([
            'message' => 'residentes created successfully',
            'data' => $residentes,
        ], 201);
    }

    public function update(int $id, residentesRequest $request): JsonResponse
    {
        $residentes = $this->residentesService->update($id, $request->validated());

        if (!$residentes) {
            return response()->json([
                'message' => 'residentes not found',
            ], 404);
        }

        return response()->json([
            'message' => 'residentes updated successfully',
            'data' => $residentes,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $result = $this->residentesService->delete($id);

        if (!$result) {
            return response()->json([
                'message' => 'residentes not found',
            ], 404);
        }

        return response()->json([
            'message' => 'residentes deleted successfully',
        ]);
    }
}
