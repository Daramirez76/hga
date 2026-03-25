<?php

namespace App\Services;

use App\Models\usuarios;
use App\Repositories\Interfaces\usuariosInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class googleAuthService
{
    public function __construct(
        protected usuariosInterface $userRepository
    ) {
    }

    /**
     * Resolve the Google OAuth callback and issue a local JWT.
     *
     * @param string $authorizationCode
     * @param string $redirectUri
     * @return array<string, mixed>
     */
    public function handleCallback(string $authorizationCode, string $redirectUri): array
    {
        try {
            $googleUser = $this->fetchGoogleUser($authorizationCode, $redirectUri);
            $user = $this->resolveLocalUser($googleUser);
            $roleCode = (int) ($user->cod_rol ?? 4);
            $expiresIn = (int) config('jwt.ttl', 60) * 60;
            $token = JWTAuth::fromUser($user);

            return [
                'success' => true,
                'message' => 'Autenticación con Google completada',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => $expiresIn,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'apellido' => $user->apellido,
                    'email' => $user->email,
                    'username' => $user->usuario,
                    'telefono' => $user->telefono,
                    'direccion' => $user->direccion,
                    'edad' => $user->edad,
                    'cod_rol' => $roleCode,
                    'rol' => $this->resolveRoleName($roleCode),
                    'google_id' => $user->google_id,
                    'profile_completed' => $this->isProfileCompleted($user),
                ],
            ];
        } catch (\Throwable $exception) {
            return [
                'success' => false,
                'message' => $exception->getMessage(),
            ];
        }
    }

    /**
     * @param string $authorizationCode
     * @param string $redirectUri
     * @return array<string, mixed>
     */
    protected function fetchGoogleUser(string $authorizationCode, string $redirectUri): array
    {
        $clientId = (string) config('services.google.client_id');
        $clientSecret = (string) config('services.google.client_secret');

        if ($clientId === '' || $clientSecret === '' || $redirectUri === '') {
            throw new \RuntimeException('Falta configurar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REDIRECT_URI');
        }

        $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'code' => $authorizationCode,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri' => $redirectUri,
            'grant_type' => 'authorization_code',
        ]);

        if ($tokenResponse->failed()) {
            $error = $tokenResponse->json('error_description')
                ?? $tokenResponse->json('error')
                ?? 'No fue posible obtener el token de Google';

            throw new \RuntimeException('Error OAuth Google: ' . $error);
        }

        $accessToken = (string) $tokenResponse->json('access_token', '');

        if ($accessToken === '') {
            throw new \RuntimeException('Google no retornó access_token');
        }

        $profileResponse = Http::withToken($accessToken)
            ->get('https://openidconnect.googleapis.com/v1/userinfo');

        if ($profileResponse->failed()) {
            throw new \RuntimeException('No fue posible consultar el perfil del usuario en Google');
        }

        $profile = $profileResponse->json();

        if (!is_array($profile) || empty($profile['sub']) || empty($profile['email'])) {
            throw new \RuntimeException('La respuesta de Google no incluye los datos mínimos del usuario');
        }

        return $profile;
    }

    /**
     * @param array<string, mixed> $googleUser
     * @return usuarios
     */
    protected function resolveLocalUser(array $googleUser): usuarios
    {
        $googleId = (string) $googleUser['sub'];
        $email = trim((string) $googleUser['email']);

        $user = $this->userRepository->findByGoogleId($googleId);

        if ($user) {
            return $user;
        }

        $user = $this->userRepository->findByEmail($email);

        if ($user) {
            return $this->userRepository->update((int) $user->id, [
                'google_id' => $googleId,
            ]) ?? $user;
        }

        $fullName = trim((string) ($googleUser['name'] ?? ''));
        $givenName = trim((string) ($googleUser['given_name'] ?? ''));
        $familyName = trim((string) ($googleUser['family_name'] ?? ''));

        return $this->userRepository->create([
            'tipo_doc' => 'cc',
            'doc_id' => $this->userRepository->getNextDocId(),
            'name' => $givenName !== '' ? $givenName : $this->extractFirstName($fullName),
            'apellido' => $familyName !== '' ? $familyName : $this->extractLastName($fullName),
            'edad' => 0,
            'direccion' => '',
            'telefono' => 0,
            'email' => $email,
            'usuario' => $this->generateUsername($email, $fullName),
            'password' => Hash::make(Str::random(32)),
            'cod_rol' => 4,
            'parentesco' => '',
            'google_id' => $googleId,
        ]);
    }

    protected function extractFirstName(string $fullName): string
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];

        return (string) ($parts[0] ?? 'Usuario');
    }

    protected function extractLastName(string $fullName): string
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];

        if (count($parts) <= 1) {
            return '';
        }

        array_shift($parts);

        return trim(implode(' ', $parts));
    }

    protected function generateUsername(string $email, string $fullName): string
    {
        $base = Str::lower((string) Str::before($email, '@'));

        if ($base === '') {
            $base = Str::slug($fullName, '_');
        }

        if ($base === '') {
            $base = 'usuario_google';
        }

        $candidate = Str::limit($base, 90, '');
        $suffix = 1;

        while ($this->userRepository->findByUsername($candidate)) {
            $candidate = Str::limit($base, 84, '') . '_' . $suffix;
            $suffix++;
        }

        return $candidate;
    }

    protected function resolveRoleName(int $roleCode): string
    {
        return match ($roleCode) {
            1 => 'Administrador',
            2 => 'Enfermero',
            default => 'Tutor',
        };
    }

    protected function isProfileCompleted(usuarios $user): bool
    {
        return trim((string) ($user->name ?? '')) !== ''
            && trim((string) ($user->apellido ?? '')) !== ''
            && trim((string) ($user->direccion ?? '')) !== ''
            && trim((string) ($user->telefono ?? '')) !== ''
            && trim((string) ($user->usuario ?? '')) !== ''
            && (int) ($user->edad ?? 0) >= 18;
    }
}
