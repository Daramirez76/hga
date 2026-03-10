<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests\medicamentosRequest;
use App\Services\medicamentosService;

class medicamentosController extends Controller
{
    protected $medicamentosService;

       public function __construct(medicamentosServices $medicamentosService)
    {
        $this->medicamentosService = $medicamentosService;
    }

    public function index()
    {
        $medicamentos = $this->medicamentosService->getAllmedicamentos();
        return response()->json([
            'message' => 'medicamentos retrieved successfully',
            'data' => $medicamentos
        ]);
    }

    public function show($id)
    {
       $medicamentos = $this->medicamentosService->getmedicamentosById($id);
        if (!$medicamentos) {
            return response()->json([
                'message' => 'medicamentos not found'
            ], 404);
        }
        return response()->json([
            'message' => 'medicamentos retrieved successfully',
            'data' => $medicamentos
        ]);

    }
    
    public function store(medicamentosRequest $request)
    {
        $medicamentos = $this->medicamentosService->create($request);
        return response()->json([
            'message' => 'medicamentos created successfully',
            'data' => $medicamentos
        ], 201);
    }

    public function update($id, medicamentosRequest $request)
    {
        $medicamentos = $this->medicamentosService->update($id, $request);
        if (!$medicamentos) {
            return response()->json([
                'message' => 'medicamentos not found'
            ], 404);
        }
        return response()->json([
            'message' => 'medicamentos updated successfully',
            'data' => $medicamentos
        ]);
    }

    public function destroy($id)
    {
        $result = $this->medicamentosService->delete($id);
        if (!$result) {
            return response()->json([
                'message' => 'medicamentos not found'
            ], 404);
        }
        return response()->json([
            'message' => 'medicamentos deleted successfully'
        ]);
    }
}
