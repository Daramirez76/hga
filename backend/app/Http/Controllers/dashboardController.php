<?php

namespace App\Http\Controllers;

use App\Services\dashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class dashboardController extends Controller
{
    public function __construct(
        protected dashboardService $dashboardService
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'dashboard retrieved successfully',
            'data' => $this->dashboardService->buildDashboard(Auth::guard('api')->user()),
        ]);
    }
}
