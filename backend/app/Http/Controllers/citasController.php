<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
 
use App\Http\Requests\citasRequest;
use App\Services\citasService;


class citasController extends Controller
{
    protected $citasService;

    public function __construct(citasService $citasService)
    {
        $this->citasService = $citasService;
    }

    public function index()
    {
        $citas = $this->citasService->getAllcitas();
        return response()->json([
            'message' => 'citas retrieved successfully',
            'data' => $citas
        ]);
    }

    public function show($id)
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
    
    public function store(citasRequest $request)
    {
        $citas = $this->citasService->create($request);
        return response()->json([
            'message' => 'citas created successfully',
            'data' => $citas
        ], 201);
    }

    public function update($id, citasRequest $request)
    {
        $citas = $this->citasService->update($id, $request);
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

    public function destroy($id)
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
