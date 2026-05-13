<?php

namespace App\Http\Controllers;

use App\Http\Requests\olvideContrasenaRequest;
use App\Services\olvideContrasenaService;
use Illuminate\Http\JsonResponse;

class olvideContrasenaController extends Controller
{
    protected olvideContrasenaService $olvideContrasenaService;

    public function __construct(olvideContrasenaService $olvideContrasenaService)
    {
        $this->olvideContrasenaService = $olvideContrasenaService;
    }

    /**
     * @param olvideContrasenaRequest $request
     * @return JsonResponse
     */
    public function forgotPassword(olvideContrasenaRequest $request): JsonResponse
    {
        $result = $this->olvideContrasenaService->requestReset(
            $request->email,
            $request->input('return_to')
        );

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * @param olvideContrasenaRequest $request
     * @return JsonResponse
     */
    public function resetPassword(olvideContrasenaRequest $request): JsonResponse
    {
        $result = $this->olvideContrasenaService->resetPassword(
            $request->email,
            $request->nueva_contraseña,
            $request->token
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
