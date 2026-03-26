<?php

namespace App\Services;

use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Throwable;

class olvideContrasenaService
{
    private const INVALID_RESET_MESSAGE = 'El enlace de recuperación no es válido o expiró.';
    private const GENERIC_REQUEST_MESSAGE = 'Si el correo está registrado, recibirás un enlace de recuperación.';

    /**
     * Request a password reset link.
     *
     * @param string $email
     * @param string|null $returnTo
     * @return array<string, mixed>
     */
    public function requestReset(string $email, ?string $returnTo = null): array
    {
        $normalizedReturnTo = $this->normalizeReturnTo($returnTo);

        ResetPasswordNotification::createUrlUsing(
            fn ($notifiable, string $token): string => $this->buildResetUrl(
                $token,
                (string) $notifiable->getEmailForPasswordReset(),
                $normalizedReturnTo
            )
        );

        try {
            Password::broker()->sendResetLink([
                'email' => $this->normalizeEmail($email),
            ]);

            return [
                'success' => true,
                'mensaje' => self::GENERIC_REQUEST_MESSAGE,
            ];
        } catch (Throwable $throwable) {
            report($throwable);

            return [
                'success' => false,
                'mensaje' => 'No fue posible procesar tu solicitud en este momento.',
            ];
        } finally {
            ResetPasswordNotification::$createUrlCallback = null;
        }
    }

    /**
     * Reset the password with a real token.
     *
     * @param string $email
     * @param string $newPassword
     * @param string|null $token
     * @return array<string, mixed>
     */
    public function resetPassword(string $email, string $newPassword, ?string $token = null): array
    {
        $providedToken = trim((string) $token);

        if ($providedToken === '') {
            return [
                'success' => false,
                'mensaje' => self::INVALID_RESET_MESSAGE,
            ];
        }

        try {
            $status = Password::broker()->reset(
                [
                    'email' => $this->normalizeEmail($email),
                    'token' => $providedToken,
                    'password' => $newPassword,
                    'password_confirmation' => $newPassword,
                ],
                function ($user, string $password): void {
                    $user->forceFill([
                        'password' => Hash::make($password),
                    ])->save();
                }
            );

            if ($status !== Password::PASSWORD_RESET) {
                return [
                    'success' => false,
                    'mensaje' => self::INVALID_RESET_MESSAGE,
                ];
            }

            return [
                'success' => true,
                'mensaje' => 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.',
            ];
        } catch (Throwable $throwable) {
            report($throwable);

            return [
                'success' => false,
                'mensaje' => self::INVALID_RESET_MESSAGE,
            ];
        }
    }

    /**
     * Normalize an email before looking it up.
     */
    protected function normalizeEmail(string $email): string
    {
        return trim($email);
    }

    /**
     * Normalize the target return path.
     */
    protected function normalizeReturnTo(?string $returnTo): ?string
    {
        $normalized = trim((string) $returnTo);

        if ($normalized === '') {
            return null;
        }

        $allowed = ['login.html', 'login_employees.html'];

        return in_array($normalized, $allowed, true) ? $normalized : null;
    }

    /**
     * Build the frontend reset URL.
     */
    protected function buildResetUrl(string $token, string $email, ?string $returnTo = null): string
    {
        $frontendBase = $this->getFrontendBaseUrl();
        $query = [
            'token' => $token,
            'email' => $email,
        ];

        if ($returnTo !== null) {
            $query['return_to'] = $returnTo;
        }

        return rtrim($frontendBase, '/') . '/reset_password.html?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    }

    /**
     * Extract the public frontend base URL from configuration.
     */
    protected function getFrontendBaseUrl(): string
    {
        $redirect = (string) config('services.google.frontend_redirect', config('app.url', 'http://localhost'));
        $parts = parse_url($redirect);

        if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
            return rtrim($redirect, '/');
        }

        $base = $parts['scheme'] . '://' . $parts['host'];

        if (!empty($parts['port'])) {
            $base .= ':' . $parts['port'];
        }

        return $base;
    }
}
