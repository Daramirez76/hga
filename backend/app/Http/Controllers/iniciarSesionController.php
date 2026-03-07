<?php

namespace App\Http\Controllers;

use App\Http\Requests\iniciarSesionRequest;
use App\Services\iniciarSesionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class iniciarSesionController extends Controller
{
    protected iniciarSesionService $iniciarSesionService;

    public function __construct(iniciarSesionService $iniciarSesionService)
    {
        $this->iniciarSesionService = $iniciarSesionService;
    }

    /**
     * Login user
     *
     * @param iniciarSesionRequest $request
     * @return JsonResponse
     */
    public function login(iniciarSesionRequest $request): JsonResponse
    {
        $identifier = (string) ($request->input('email') ?? $request->input('usuario') ?? '');

        $result = $this->iniciarSesionService->login(
            $identifier,
            $request->password
        );

        if ($result['success']) {
            return response()->json($result, 200);
        }

        return response()->json($result, 401);
    }

    /**
     * Logout user
     *
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $result = $this->iniciarSesionService->logout();
        $authUser = Auth::guard('api')->user();

        if (is_object($authUser)) {
            $result['user'] = [
                'id' => $authUser->id,
                'email' => $authUser->email,
            ];
        }

        if ($result['success']) {
            return response()->json($result, 200);
        }

        return response()->json($result, 400);
    }

    /**
     * Get authenticated user profile.
     *
     * @return JsonResponse
     */
    public function me(): JsonResponse
    {
        $authUser = Auth::guard('api')->user();

        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado',
            ], 401);
        }

        $roleCode = (int) ($authUser->cod_rol ?? 4);
        $roleName = 'Tutor';

        if ($roleCode === 1) {
            $roleName = 'Administrador';
        } elseif ($roleCode === 2) {
            $roleName = 'Enfermero';
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $authUser->id,
                'name' => $authUser->name,
                'apellido' => $authUser->apellido,
                'email' => $authUser->email,
                'username' => $authUser->usuario,
                'telefono' => $authUser->telefono,
                'cod_rol' => $roleCode,
                'rol' => $roleName,
            ],
        ], 200);
    }
}
