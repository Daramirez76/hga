<?php

namespace App\Repositories\Eloquent;

use App\Models\usuarios;
use App\Repositories\Interfaces\usuariosInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Collection;

class usuariosRepository implements usuariosInterface
{
    /**
     * Create a new user
     *
     * @param array $data
     * @return usuarios
     */
    public function create(array $data): usuarios
    {
        $payload = $this->preparePayload($data);

        return usuarios::create([
            'tipo_doc' => $payload['tipo_doc'],
            'doc_id' => $payload['doc_id'],
            'nombre' => $payload['name'],
            'apellido' => $payload['apellido'],
            'edad' => $payload['edad'],
            'direccion' => $payload['direccion'],
            'telefono' => $payload['telefono'],
            'email' => $payload['email'],
            'usuario' => $payload['usuario'],
            'contraseña' => $payload['contraseña'],
            'cod_rol' => $payload['cod_rol'],
            'parentesco' => $payload['parentesco'],
            'google_id' => $payload['google_id'] ?? null,
        ]);
    }

    /**
     * Find user by email
     *
     * @param string $email
     * @return usuarios|null
     */
    public function findByEmail(string $email): ?usuarios
    {
        return usuarios::where('email', $email)->first();
    }

    /**
     * Find user by Google ID.
     *
     * @param string $googleId
     * @return usuarios|null
     */
    public function findByGoogleId(string $googleId): ?usuarios
    {
        return usuarios::where('google_id', $googleId)->first();
    }

    /**
     * Find user by ID
     *
     * @param int $id
     * @return usuarios|null
     */
    public function findById(int $id): ?usuarios
    {
        return usuarios::find($id);
    }

    /**
     * Find user by login username.
     *
     * @param string $username
     * @return usuarios|null
     */
    public function findByUsername(string $username): ?usuarios
    {
        return usuarios::where('usuario', $username)->first();
    }

    /**
     * Get the next available document ID for legacy user records.
     *
     * @return int
     */
    public function getNextDocId(): int
    {
        $lastDocId = (int) usuarios::max('doc_id');

        return $lastDocId > 0 ? $lastDocId + 1 : 1;
    }

    public function getUsersByRole(int $roleCode): Collection
    {
        return usuarios::query()
            ->where('cod_rol', $roleCode)
            ->orderBy('nombre')
            ->orderBy('apellido')
            ->get();
    }

    /**
     * Update user
     *
     * @param int $id
     * @param array $data
     * @return usuarios|null
     */
    public function update(int $id, array $data): ?usuarios
    {
        $user = usuarios::find($id);
        if ($user) {
            $user->update($this->preparePayload($data, true));
        }
        return $user;
    }

    /**
     * Update password by email.
     *
     * @param string $email
     * @param string $password
     * @return bool
     */
    public function updatePasswordByEmail(string $email, string $password): bool
    {
        $hashedPassword = $this->normalizePassword($password);

        return usuarios::where('email', $email)->update([
            'contraseña' => $hashedPassword,
        ]) > 0;
    }

    /**
     * Delete user
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        return usuarios::destroy($id) > 0;
    }

    /**
     * Normalize the payload before persisting it.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    protected function preparePayload(array $data, bool $isUpdate = false): array
    {
        $payload = $data;
        $password = (string) ($payload['password'] ?? $payload['contraseña'] ?? '');

        if ($password !== '') {
            $payload['contraseña'] = $this->normalizePassword($password);
        }

        unset($payload['password']);

        if (array_key_exists('name', $payload)) {
            $payload['name'] = trim((string) $payload['name']);
        }

        if (array_key_exists('tipo_doc', $payload)) {
            $payload['tipo_doc'] = trim((string) $payload['tipo_doc']);
        }

        if (array_key_exists('apellido', $payload)) {
            $payload['apellido'] = trim((string) $payload['apellido']);
        }

        if (array_key_exists('direccion', $payload)) {
            $payload['direccion'] = trim((string) $payload['direccion']);
        }

        if (array_key_exists('email', $payload)) {
            $payload['email'] = trim((string) $payload['email']);
        }

        if (array_key_exists('usuario', $payload)) {
            $payload['usuario'] = trim((string) $payload['usuario']);
        }

        if (array_key_exists('parentesco', $payload)) {
            $payload['parentesco'] = trim((string) $payload['parentesco']);
        }

        if (array_key_exists('cod_rol', $payload)) {
            $payload['cod_rol'] = (int) $payload['cod_rol'];
        } elseif (!$isUpdate) {
            $payload['cod_rol'] = 4;
        }

        if (array_key_exists('google_id', $payload)) {
            $payload['google_id'] = $payload['google_id'] ?: null;
        } elseif (!$isUpdate) {
            $payload['google_id'] = null;
        }

        if (array_key_exists('doc_id', $payload)) {
            $payload['doc_id'] = (int) $payload['doc_id'];
        }

        if (array_key_exists('edad', $payload)) {
            $payload['edad'] = (int) $payload['edad'];
        }

        if (array_key_exists('telefono', $payload)) {
            $payload['telefono'] = (int) $payload['telefono'];
        }

        return $payload;
    }

    /**
     * Hash a password only when it is still stored as plain text.
     */
    protected function normalizePassword(string $password): string
    {
        if ($password === '') {
            return $password;
        }

        $info = password_get_info($password);
        if (($info['algo'] ?? 0) !== 0) {
            return $password;
        }

        return Hash::make($password);
    }
}
