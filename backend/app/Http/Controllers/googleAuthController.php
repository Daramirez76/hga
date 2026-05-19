<?php

namespace App\Http\Controllers;

use App\Services\googleAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cookie;
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
        [$successRedirect, $errorRedirect] = $this->resolveFrontendTargets($request);
        $state = Str::random(64);
        $secureCookies = $request->isSecure() || (bool) config('session.secure', false);
        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'access_type' => 'offline',
            'include_granted_scopes' => 'true',
            'prompt' => 'select_account',
            'state' => $state,
        ]);

        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?' . $query)
            ->withCookie($this->makeGoogleOAuthCookie('google_oauth_state', $state, $secureCookies))
            ->withCookie($this->makeGoogleOAuthCookie('google_oauth_success_redirect', $successRedirect, $secureCookies))
            ->withCookie($this->makeGoogleOAuthCookie('google_oauth_error_redirect', $errorRedirect, $secureCookies));
    }

    /**
     * Complete OAuth callback from Google.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        $code = trim((string) $request->query('code', ''));
        $oauthError = trim((string) $request->query('error', ''));
        $state = trim((string) $request->query('state', ''));
        $storedState = trim((string) $request->cookie('google_oauth_state', ''));
        $successRedirect = trim((string) $request->cookie('google_oauth_success_redirect', ''));
        $errorRedirect = trim((string) $request->cookie('google_oauth_error_redirect', ''));

        if (!$this->isValidState($state, $storedState)) {
            Log::warning('Google OAuth state mismatch');

            return $this->redirectWithFrontendError(
                $errorRedirect,
                'No fue posible completar la autenticación con Google.'
            );
        }

        if ($oauthError !== '') {
            Log::warning('Google OAuth returned an error', [
                'error' => $oauthError,
            ]);

            return $this->redirectWithFrontendError(
                $errorRedirect,
                'No fue posible completar la autenticación con Google.'
            );
        }

        if ($code === '') {
            return $this->redirectWithFrontendError(
                $errorRedirect,
                'No fue posible completar la autenticación con Google.'
            );
        }

        $result = $this->googleAuthService->handleCallback(
            $code,
            $this->resolveGoogleRedirectUri($request)
        );

        if (!$result['success']) {
            Log::warning('Google OAuth callback failed', [
                'message' => $result['internal_message'] ?? $result['message'] ?? 'unknown_error',
            ]);

            return $this->redirectWithFrontendError(
                $errorRedirect,
                'No fue posible completar la autenticación con Google.'
            );
        }

        return $this->redirectWithFrontendSuccess(
            $result,
            $successRedirect ?: $this->resolveDefaultGoogleSuccessRedirect()
        );
    }

    /**
     * Redirect back to the frontend with the generated local JWT. The frontend
     * persists the session in its own origin.
     *
     * @param array<string, mixed> $payload
     */
    protected function redirectWithFrontendSuccess(array $payload, string $redirectUrl): RedirectResponse
    {
        return redirect()->away($redirectUrl . '?' . http_build_query([
            'success' => '1',
            'message' => (string) ($payload['message'] ?? 'Autenticación con Google completada'),
            'access_token' => (string) ($payload['access_token'] ?? ''),
            'token_type' => (string) ($payload['token_type'] ?? 'Bearer'),
            'expires_in' => (string) ($payload['expires_in'] ?? ''),
            'user' => json_encode($payload['user'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}',
        ]))
            ->withCookie(Cookie::forget('google_oauth_state'))
            ->withCookie(Cookie::forget('google_oauth_success_redirect'))
            ->withCookie(Cookie::forget('google_oauth_error_redirect'));
    }

    /**
     * Redirect the browser back to the frontend with a sanitized error message.
     */
    protected function redirectWithFrontendError(string $redirectUrl, string $message): RedirectResponse
    {
        $target = $redirectUrl !== '' ? $redirectUrl : $this->resolveDefaultGoogleLoginRedirect();

        return redirect()->away($target . '?' . http_build_query([
            'success' => '0',
            'message' => $message,
        ]))
            ->withCookie(Cookie::forget('google_oauth_state'))
            ->withCookie(Cookie::forget('google_oauth_success_redirect'))
            ->withCookie(Cookie::forget('google_oauth_error_redirect'));
    }

    protected function resolveGoogleRedirectUri(Request $request): string
    {
        $configuredRedirect = trim((string) config('services.google.redirect'));

        if ($configuredRedirect !== '' && !$this->looksLikeLocalhostUrl($configuredRedirect, $request)) {
            return $configuredRedirect;
        }

        return $request->getSchemeAndHttpHost() . '/api/auth/google/callback';
    }

    protected function resolveFrontendTargets(Request $request): array
    {
        $frontendRedirect = trim((string) config('services.google.frontend_redirect'));

        $baseUrl = $this->resolveFrontendBaseUrl($frontendRedirect);
        $sourcePath = (string) parse_url((string) $request->headers->get('referer', ''), PHP_URL_PATH);
        $isEmployeeFlow = Str::contains($sourcePath, 'employees');
        $successPath = $isEmployeeFlow ? '/home_employees.html' : '/home.html';
        $errorPath = $isEmployeeFlow ? '/login_employees.html' : '/login.html';

        return [
            rtrim($baseUrl, '/') . $successPath,
            rtrim($baseUrl, '/') . $errorPath,
        ];
    }

    protected function resolveFrontendBaseUrl(?string $frontendRedirect = null): string
    {
        $redirect = trim((string) ($frontendRedirect ?? config('services.google.frontend_redirect')));

        if ($redirect === '') {
            return rtrim((string) config('app.url', 'http://localhost'), '/');
        }

        $parts = parse_url($redirect);

        if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
            return rtrim($redirect, '/');
        }

        $base = $parts['scheme'] . '://' . $parts['host'];

        if (!empty($parts['port'])) {
            $base .= ':' . $parts['port'];
        }

        $path = trim((string) ($parts['path'] ?? ''), '/');
        if ($path !== '') {
            $basePath = str_ends_with($path, '.html') ? dirname($path) : $path;
            if ($basePath !== '.' && $basePath !== '') {
                $base .= '/' . trim($basePath, '/');
            }
        }

        return rtrim($base, '/');
    }

    protected function resolveDefaultGoogleSuccessRedirect(): string
    {
        return $this->resolveFrontendBaseUrl() . '/home.html';
    }

    protected function resolveDefaultGoogleLoginRedirect(): string
    {
        return $this->resolveFrontendBaseUrl() . '/login.html';
    }

    protected function isValidState(string $state, string $storedState): bool
    {
        if ($state === '' || $storedState === '') {
            return false;
        }

        return hash_equals($storedState, $state);
    }

    protected function makeGoogleOAuthCookie(string $name, string $value, bool $secure): \Symfony\Component\HttpFoundation\Cookie
    {
        return cookie($name, $value, 10, '/', null, $secure, true, false, 'lax');
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
