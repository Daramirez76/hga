<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticateApi
{
    public function handle(Request $request, Closure $next, ...$guards)
    {
        if (!Auth::guard('api')->check()) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado, inicia sesión.',
            ], 401);
        }

        return $next($request);
    }
}
