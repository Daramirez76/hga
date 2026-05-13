<?php

namespace App\Http\Controllers;

use App\Http\Requests\registrarseRequest;
use App\Services\registrarseService;
use Illuminate\Http\JsonResponse;

class registrarseController extends Controller
{
    protected registrarseService $registrarseService;

    public function __construct(registrarseService $registrarseService)
    {
        $this->registrarseService = $registrarseService;
    }

    /**
     * Register a new user
     *
     * @param registrarseRequest $request
     * @return JsonResponse
     */
    public function register(registrarseRequest $request): JsonResponse
    {
        $result = $this->registrarseService->register(
            $request->validated(),
            (string) $request->header('X-Register-Source', 'public')
        );

        if ($result['success']) {
            return response()->json($result, 201);
        }

        return response()->json($result, 400);
    }
}
