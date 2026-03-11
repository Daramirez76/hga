<?php

namespace App\Http\Controllers;

use App\Services\googleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;

class googleAuthController extends Controller
{
    public function __construct(
        protected googleAuthService $googleAuthService
    ) {
    }

    /**
     * Complete OAuth callback from Google.
     */
    public function handleGoogleCallback(Request $request): JsonResponse|RedirectResponse
    {
        $code = trim((string) $request->query('code', ''));
        $oauthError = trim((string) $request->query('error', ''));

        if ($oauthError !== '') {
            return $this->respondWithFrontendRedirect([
                'success' => false,
                'message' => 'Google rechazó la autenticación: ' . $oauthError,
            ], 400);
        }

        if ($code === '') {
            return $this->respondWithFrontendRedirect([
                'success' => false,
                'message' => 'No se recibió el código de autorización de Google',
            ], 400);
        }

        $result = $this->googleAuthService->handleCallback($code);
        $status = $result['success'] ? 200 : 400;

        if (!$result['success']) {
            Log::warning('Google OAuth callback failed', [
                'message' => $result['message'] ?? 'unknown_error',
            ]);
        }

        return $this->respondWithFrontendRedirect($result, $status);
    }

    /**
     * Return JSON for API clients or redirect the browser to the frontend.
     *
     * @param array<string, mixed> $payload
     */
    protected function respondWithFrontendRedirect(array $payload, int $status): JsonResponse|RedirectResponse
    {
        $frontendRedirect = (string) config('services.google.frontend_redirect');

        if ($frontendRedirect === '') {
            return response()->json($payload, $status);
        }

        $query = [
            'success' => !empty($payload['success']) ? '1' : '0',
            'message' => (string) ($payload['message'] ?? ''),
        ];

        if (!empty($payload['access_token'])) {
            $query['access_token'] = (string) $payload['access_token'];
            $query['token_type'] = (string) ($payload['token_type'] ?? 'Bearer');
            $query['expires_in'] = (string) ($payload['expires_in'] ?? '');
        }

        if (!empty($payload['user']) && is_array($payload['user'])) {
            $query['user'] = json_encode($payload['user']);
        }

        return redirect()->away($frontendRedirect . '?' . http_build_query($query));
    }
}
