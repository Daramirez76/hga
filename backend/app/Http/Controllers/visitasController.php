<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
 
use App\Http\Requests\visitasRequest;
use App\Services\visitasService;

class visitasController extends Controller
{
    protected $visitasService;

    public function __construct(visitasService $visitasService)
    {
        $this->visitasService = $visitasService;
    }

    public function index()
    {
        $visitass = $this->visitasService->getAllvisitas();
        return response()->json([
            'message' => 'visitass retrieved successfully',
            'data' => $visitass
        ]);
    }

    public function show($id)
    {
       $visitass = $this->visitasService->getvisitasById($id);
        if (!$visitass) {
            return response()->json([
                'message' => 'visitass not found'
            ], 404);
        }
        return response()->json([
            'message' => 'visitass retrieved successfully',
            'data' => $visitass
        ]);
    }

    public function store(visitasRequest $request)
    {
        $visitass = $this->visitasService->create($request);
        return response()->json([
            'message' => 'visitass created successfully',
            'data' => $visitass
        ], 201);
    }

    public function update($id, visitasRequest $request)
    {
        $visitass = $this->visitasService->update($id, $request);
        if (!$visitass) {
            return response()->json([
                'message' => 'visitass not found'
            ], 404);
        }
        return response()->json([
            'message' => 'visitass updated successfully',
            'data' => $visitass
        ]);
    }

    public function destroy($id)
    {
        $visitass = $this->visitasService->delete($id);
        if (!$visitass) {
            return response()->json([
                'message' => 'visitass not found'
            ], 404);
        }
        return response()->json([
            'message' => 'visitass deleted successfully'
        ]);
    }
}


