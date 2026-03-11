<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
 
use App\Http\Requests\informesRequest;
use App\Services\informesService;

class informesController extends Controller
{
    protected $informesService;

    public function __construct(informesService $informesService)
    {
        $this->informesService = $informesService;
    }

    public function index()
    {
        $informes = $this->informesService->getAllinformes();
        return response()->json([
            'message' => 'informes retrieved successfully',
            'data' => $informes
        ]);
    }

    public function show($id)
    {
       $informes = $this->informesService->getinformesById($id);
        if (!$informes) {
            return response()->json([
                'message' => 'informes not found'
            ], 404);
        }
        return response()->json([
            'message' => 'informes retrieved successfully',
            'data' => $informes
        ]);

    }
    
    public function store(informesRequest $request)
    {
        $informes = $this->informesService->create($request);
        return response()->json([
            'message' => 'informes created successfully',
            'data' => $informes
        ], 201);
    }

    public function update($id, informesRequest $request)
    {
        $informes = $this->informesService->update($id, $request);
        if (!$informes) {
            return response()->json([
                'message' => 'informes not found'
            ], 404);
        }
        return response()->json([
            'message' => 'informes updated successfully',
            'data' => $informes
        ]);
    }

    public function destroy($id)
    {
        $result = $this->informesService->delete($id);
        if (!$result) {
            return response()->json([
                'message' => 'informes not found'
            ], 404);
        }
        return response()->json([
            'message' => 'informes deleted successfully'
        ]);
    }
}