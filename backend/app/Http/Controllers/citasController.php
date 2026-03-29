<?php

namespace App\Http\Controllers;

use App\Http\Requests\citasRequest;
use App\Services\citasService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class citasController extends Controller
{
    protected citasService $citasService;

    public function __construct(citasService $citasService)
    {
        $this->citasService = $citasService;
    }

    public function index(Request $request): JsonResponse
    {
        $pagination = $this->resolvePaginationQuery($request);
        $citas = $this->citasService->getAllcitas(
            $pagination['page'],
            $pagination['per_page'],
            $pagination['search'],
            $pagination['paginate']
        );

        return $this->paginatedJsonResponse('citas retrieved successfully', $citas);
    }

    public function show(int $id): JsonResponse
    {
       $citas = $this->citasService->getcitasById($id);
        if (!$citas) {
            return response()->json([
                'message' => 'citas not found'
            ], 404);
        }
        return response()->json([
            'message' => 'citas retrieved successfully',
            'data' => $citas
        ]);

    }
    
    public function store(citasRequest $request): JsonResponse
    {
        $citas = $this->citasService->create($request->validated());
        return response()->json([
            'message' => 'citas created successfully',
            'data' => $citas
        ], 201);
    }

    public function update(citasRequest $request, int $id): JsonResponse
    {
        $citas = $this->citasService->update($id, $request->validated());
        if (!$citas) {
            return response()->json([
                'message' => 'citas not found'
            ], 404);
        }
        return response()->json([
            'message' => 'citas updated successfully',
            'data' => $citas
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $result = $this->citasService->delete($id);
        if (!$result) {
            return response()->json([
                'message' => 'citas not found'
            ], 404);
        }
        return response()->json([
            'message' => 'citas deleted successfully'
        ]);
    }
}
