<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
 
use App\Http\Requests\visitasRequest;
use App\Services\visitassService;

class visitasController extends Controller
{
    protected $visitassService;

    public function __construct(visitassService $visitassService)
    {
        $this->visitassService = $visitassService;
    }

    public function index()
    {
        $visitass = $this->visitassService->getAllvisitass();
        return response()->json([
            'message' => 'visitass retrieved successfully',
            'data' => $visitass
        ]);
    }

    public function show($id)
    {
       $visitass = $this->visitassService->getvisitassById($id);
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
        $visitass = $this->visitassService->create($request);
        return response()->json([
            'message' => 'visitass created successfully',
            'data' => $visitass
        ], 201);
    }

    public function update($id, visitasRequest $request)
    {
        $visitass = $this->visitassService->update($id, $request);
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
        $visitass = $this->visitassService->delete($id);
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



