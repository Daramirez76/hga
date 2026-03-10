<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
 
use App\Http\Requests\residentesRequest;
use App\Services\residentesService;


class residentesController extends Controller
{
    protected $residentesService;

    public function __construct(residentesService $residentesService)
    {
        $this->residentesService = $residentesService;
    }

    public function index()
    {
        $residentes = $this->residentesService->getAllresidentes();
        return response()->json([
            'message' => 'residentes retrieved successfully',
            'data' => $residentes
        ]);
    }

    public function show($id)
    {
       $residentes = $this->residentesService->getresidentesById($id);
        if (!$residentes) {
            return response()->json([
                'message' => 'residentes not found'
            ], 404);
        }
        return response()->json([
            'message' => 'residentes retrieved successfully',
            'data' => $residentes
        ]);

    }
    
    public function store(residentesRequest $request)
    {
        $residentes = $this->residentesService->create($request);
        return response()->json([
            'message' => 'residentes created successfully',
            'data' => $residentes
        ], 201);
    }

    public function update($id, residentesRequest $request)
    {
        $residentes = $this->residentesService->update($id, $request);
        if (!$residentes) {
            return response()->json([
                'message' => 'residentes not found'
            ], 404);
        }
        return response()->json([
            'message' => 'residentes updated successfully',
            'data' => $residentes
        ]);
    }

    public function destroy($id)
    {
        $result = $this->residentesService->delete($id);
        if (!$result) {
            return response()->json([
                'message' => 'residentes not found'
            ], 404);
        }
        return response()->json([
            'message' => 'residentes deleted successfully'
        ]);
    }
}
