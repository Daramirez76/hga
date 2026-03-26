<?php

namespace App\Services;

use App\Repositories\Interfaces\usuariosInterface;
use Illuminate\Support\Facades\Log;

class registrarseService
{
    protected usuariosInterface $userRepository;

    public function __construct(usuariosInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function register(array $data): array
    {
        try {
            $tipoDoc = strtolower((string) ($data['tipo_doc'] ?? ''));

            if ($tipoDoc === 'doc1') {
                $tipoDoc = 'cc';
            }

            if ($tipoDoc === 'doc2') {
                $tipoDoc = 'ce';
            }

            $payload = [];
            $payload['name'] = trim((string) ($data['name'] ?? ''));
            $payload['apellido'] = trim((string) ($data['apellido'] ?? ''));
            $payload['tipo_doc'] = $tipoDoc;
            $payload['doc_id'] = (int) ($data['doc_id'] ?? 0);
            $payload['direccion'] = trim((string) ($data['direccion'] ?? ''));
            $payload['telefono'] = (int) ($data['telefono'] ?? 0);
            $payload['edad'] = (int) ($data['edad'] ?? 0);
            $payload['email'] = trim((string) ($data['email'] ?? ''));
            $payload['usuario'] = trim((string) ($data['usuario'] ?? ''));
            $payload['password'] = (string) ($data['password'] ?? '');
            $payload['cod_rol'] = (int) ($data['cod_rol'] ?? 4);
            $payload['parentesco'] = (string) ($data['parentesco'] ?? '');

            $user = $this->userRepository->create($payload);

            return [
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->usuario,
                ],
            ];
        } catch (\Throwable $e) {
            Log::error('Error al registrar usuario', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'No fue posible registrar el usuario. Intenta nuevamente.',
            ];
        }
    }
}
