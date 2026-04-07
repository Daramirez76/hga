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
        try {
            $visita = $this->visitasService->create($request->validated());
            return response()->json([
                'message' => 'visita created successfully',
                'data' => $visita,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => ['validation' => [$e->getMessage()]],
            ], 422);
        }
    }

    public function update(visitasRequest $request, int $id): JsonResponse
    {
        try {
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
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => ['validation' => [$e->getMessage()]],
            ], 422);
        }
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

    /**
     * Obtiene las visitas para el calendario dentro de un rango de fechas.
     * 
     * Query params:
     * - start: fecha inicio (Y-m-d)
     * - end: fecha fin (Y-m-d)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function calendar(Request $request): JsonResponse
    {
        $startDate = $request->query('start', '');
        $endDate = $request->query('end', '');

        // Validar fechas
        if (!$startDate || !$endDate) {
            return response()->json([
                'message' => 'Los parámetros "start" y "end" son requeridos en formato Y-m-d',
            ], 400);
        }

        // Validar formato de fechas
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
            return response()->json([
                'message' => 'Las fechas deben estar en formato Y-m-d',
            ], 400);
        }

        try {
            $visitas = $this->visitasService->getCalendarVisitas($startDate, $endDate);

            return response()->json([
                'message' => 'calendar visitas retrieved successfully',
                'data' => $visitas,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener las visitas del calendario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
