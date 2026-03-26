<?php

namespace App\Services;

use App\Repositories\Interfaces\usuariosInterface;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class iniciarSesionService
{
    protected usuariosInterface $userRepository;

    public function __construct(usuariosInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function login(string $identifier, string $password): array
    {
        try {
            $identifier = trim($identifier);
            $user = $this->userRepository->findByEmail($identifier);

            // Si no llega por email, intentamos por usuario.
            if (!$user) {
                $user = $this->userRepository->findByUsername($identifier);
            }

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'Credenciales inválidas',
                ];
            }

            $storedPassword = (string) $user->password;
            $passwordOk = false;
            $storedPasswordInfo = password_get_info($storedPassword);

            // Soportar contraseñas en texto plano y en hash.
            if ($password === $storedPassword) {
                $passwordOk = true;
                if (($storedPasswordInfo['algo'] ?? 0) === 0) {
                    $this->userRepository->updatePasswordByEmail($user->email, $password);
                    $user = $this->userRepository->findByEmail($identifier) ?? $user;
                }
            } elseif (($storedPasswordInfo['algo'] ?? 0) !== 0) {
                $passwordOk = Hash::check($password, $storedPassword);
            }

            if (!$passwordOk) {
                return [
                    'success' => false,
                    'message' => 'Credenciales inválidas',
                ];
            }

            $expiresIn = (int) config('jwt.ttl', 60) * 60;
            $token = JWTAuth::fromUser($user);
            $roleCode = (int) ($user->cod_rol ?? 4);
            $roleName = 'Tutor';

            if ($roleCode === 1) {
                $roleName = 'Administrador';
            } elseif ($roleCode === 2) {
                $roleName = 'Enfermero';
            } elseif ($roleCode === 3) {
                $roleName = 'Doctor';
            } elseif ($roleCode === 4) {
                $roleName = 'Tutor';
            }

            return [
                'success' => true,
                'message' => 'Sesión iniciada exitosamente',
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
                    'rol' => $roleName,
                    'google_id' => $user->google_id,
                    'profile_completed' => $this->isProfileCompleted($user),
                ],
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'No fue posible iniciar sesión. Intenta nuevamente.',
            ];
        }
    }

    public function logout(): array
    {
        try {
            JWTAuth::parseToken()->invalidate();

            return [
                'success' => true,
                'message' => 'Sesión cerrada exitosamente',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'No fue posible cerrar sesión. Intenta nuevamente.',
            ];
        }
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
