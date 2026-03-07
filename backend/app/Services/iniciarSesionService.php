<?php

namespace App\Services;

use App\Repositories\Eloquent\usuariosRepository as UserRepository;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class iniciarSesionService
{
    protected UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
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

            // Soportar contraseñas en texto plano y en hash.
            if ($password === $storedPassword) {
                $passwordOk = true;
            } elseif (str_starts_with($storedPassword, '$2y$') || str_starts_with($storedPassword, '$2a$')) {
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
                    'cod_rol' => $roleCode,
                    'rol' => $roleName,
                ],
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al iniciar sesión: ' . $e->getMessage(),
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
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al cerrar sesión: ' . $e->getMessage(),
            ];
        }
    }
}
