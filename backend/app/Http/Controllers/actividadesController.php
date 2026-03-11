<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
 
use App\Http\Requests\actividadesRequest;
use App\Services\actividadesService;


class actividadesController extends Controller
{
    protected $actividadesService;

    public function __construct(actividadesService $actividadesService)
    {
        $this->actividadesService = $actividadesService;
    }

    public function index()
    {
        $actividades = $this->actividadesService->getAllActividades();
        return response()->json([
            'message' => 'actividades retrieved successfully',
            'data' => $actividades
        ]);
    }

    public function show($id)
    {
       $actividades = $this->actividadesService->getActividadesById($id);
        if (!$actividades) {
            return response()->json([
                'message' => 'actividades not found'
            ], 404);
        }
        return response()->json([
            'message' => 'actividades retrieved successfully',
            'data' => $actividades
        ]);

    }
    
    public function store(actividadesRequest $request)
    {
        $actividades = $this->actividadesService->create($request);
        return response()->json([
            'message' => 'actividades created successfully',
            'data' => $actividades
        ], 201);
    }

    public function update($id, actividadesRequest $request)
    {
        $actividades = $this->actividadesService->update($id, $request);
        if (!$actividades) {
            return response()->json([
                'message' => 'actividades not found'
            ], 404);
        }
        return response()->json([
            'message' => 'actividades updated successfully',
            'data' => $actividades
        ]);
    }

    public function destroy($id)
    {
        $result = $this->actividadesService->delete($id);
        if (!$result) {
            return response()->json([
                'message' => 'actividades not found'
            ], 404);
        }
        return response()->json([
            'message' => 'actividades deleted successfully'
        ]);
    }
}
