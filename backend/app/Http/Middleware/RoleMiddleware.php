<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Restrict route access by role code or role name.
     *
     * Examples:
     * - ->middleware('role:1')
     * - ->middleware('role:Administrador')
     * - ->middleware('role:1,2')
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user('api');

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        if (empty($roles)) {
            return $next($request);
        }

        $allowed = array_map(
            static fn ($role): string => strtolower(trim((string) $role)),
            $roles
        );

        $userRoleCode = trim((string) ($user->cod_rol ?? ''));
        $userRoleName = strtolower($this->resolveRoleName((int) ($user->cod_rol ?? 0)));
        $currentRoles = array_filter([$userRoleCode, $userRoleName]);

        if (!$this->hasAnyRole($currentRoles, $allowed)) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para acceder',
            ], 403);
        }

        return $next($request);
    }

    /**
     * @param array<int, string> $currentRoles
     * @param array<int, string> $allowedRoles
     */
    private function hasAnyRole(array $currentRoles, array $allowedRoles): bool
    {
        foreach ($currentRoles as $role) {
            if (in_array($role, $allowedRoles, true)) {
                return true;
            }
        }

        return false;
    }

    private function resolveRoleName(int $roleCode): string
    {
        return match ($roleCode) {
            1 => 'administrador',
            2 => 'enfermero',
            3 => 'doctor',
            4 => 'tutor',
            default => 'tutor',
        };
    }
}
