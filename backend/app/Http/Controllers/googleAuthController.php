<?php

namespace App\Http\Controllers;

use App\Services\googleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class googleAuthController extends Controller
{
    public function __construct(
        protected googleAuthService $googleAuthService
    ) {
    }

    /**
     * Start OAuth flow by redirecting to Google.
     */
    public function redirectToGoogle(Request $request): RedirectResponse|JsonResponse
    {
        $clientId = trim((string) config('services.google.client_id'));

        if ($clientId === '') {
            return response()->json([
                'success' => false,
                'message' => 'Falta configurar GOOGLE_CLIENT_ID',
            ], 500);
        }

        $redirectUri = $this->resolveGoogleRedirectUri($request);
        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'access_type' => 'offline',
            'include_granted_scopes' => 'true',
            'prompt' => 'select_account',
        ]);

        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?' . $query);
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

        $result = $this->googleAuthService->handleCallback(
            $code,
            $this->resolveGoogleRedirectUri($request)
        );
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
        $frontendRedirect = $this->resolveFrontendRedirectUrl();

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

    protected function resolveGoogleRedirectUri(Request $request): string
    {
        $configuredRedirect = trim((string) config('services.google.redirect'));

        if ($configuredRedirect !== '' && !$this->looksLikeLocalhostUrl($configuredRedirect, $request)) {
            return $configuredRedirect;
        }

        return $request->getSchemeAndHttpHost() . '/api/auth/google/callback';
    }

    protected function resolveFrontendRedirectUrl(): string
    {
        $frontendRedirect = trim((string) config('services.google.frontend_redirect'));

        if ($frontendRedirect === '') {
            return '';
        }

        if (Str::endsWith($frontendRedirect, '/frontend/login.html')) {
            return Str::replaceEnd('/frontend/login.html', '/login.html', $frontendRedirect);
        }

        return $frontendRedirect;
    }

    protected function looksLikeLocalhostUrl(string $url, Request $request): bool
    {
        $configuredHost = parse_url($url, PHP_URL_HOST);
        $requestHost = $request->getHost();

        if (!is_string($configuredHost) || $configuredHost === '' || $requestHost === '') {
            return false;
        }

        return in_array($configuredHost, ['localhost', '127.0.0.1'], true)
            && !in_array($requestHost, ['localhost', '127.0.0.1'], true);
    }
}
