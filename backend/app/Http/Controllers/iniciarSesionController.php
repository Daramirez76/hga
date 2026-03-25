<?php

namespace App\Http\Controllers;

use App\Http\Requests\iniciarSesionRequest;
use App\Http\Requests\updateGoogleProfileRequest;
use App\Services\iniciarSesionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;

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
                'tipo_doc' => $authUser->tipo_doc,
                'doc_id' => $authUser->doc_id,
                'email' => $authUser->email,
                'username' => $authUser->usuario,
                'telefono' => $authUser->telefono,
                'direccion' => $authUser->direccion,
                'edad' => $authUser->edad,
                'cod_rol' => $roleCode,
                'rol' => $roleName,
                'google_id' => $authUser->google_id,
                'profile_completed' => $this->isProfileCompleted($authUser),
            ],
        ], 200);
    }

    public function updateMe(updateGoogleProfileRequest $request): JsonResponse
    {
        $authUser = Auth::guard('api')->user();

        if (!$authUser) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado',
            ], 401);
        }

        $previousDocId = (int) ($authUser->doc_id ?? 0);
        $authUser->fill($request->validated());
        $authUser->save();
        $authUser->refresh();
        $token = '';
        $expiresIn = (int) config('jwt.ttl', 60) * 60;

        if ((int) ($authUser->doc_id ?? 0) !== $previousDocId) {
            $token = JWTAuth::fromUser($authUser);
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
            'message' => 'Perfil actualizado exitosamente',
            'access_token' => $token,
            'token_type' => $token !== '' ? 'Bearer' : '',
            'expires_in' => $token !== '' ? $expiresIn : 0,
            'user' => [
                'id' => $authUser->id,
                'name' => $authUser->name,
                'apellido' => $authUser->apellido,
                'tipo_doc' => $authUser->tipo_doc,
                'doc_id' => $authUser->doc_id,
                'email' => $authUser->email,
                'username' => $authUser->usuario,
                'telefono' => $authUser->telefono,
                'direccion' => $authUser->direccion,
                'edad' => $authUser->edad,
                'cod_rol' => $roleCode,
                'rol' => $roleName,
                'google_id' => $authUser->google_id,
                'profile_completed' => $this->isProfileCompleted($authUser),
            ],
        ], 200);
    }

    protected function isProfileCompleted(object $user): bool
    {
        return trim((string) ($user->name ?? '')) !== ''
            && trim((string) ($user->apellido ?? '')) !== ''
            && trim((string) ($user->direccion ?? '')) !== ''
            && trim((string) ($user->telefono ?? '')) !== ''
            && trim((string) ($user->usuario ?? '')) !== ''
            && (int) ($user->edad ?? 0) >= 18;
    }
}
