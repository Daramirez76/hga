<?php

namespace App\Repositories\Eloquent;

use App\Models\usuarios;
use App\Repositories\Interfaces\usuariosInterface;

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
        return usuarios::create([
            'tipo_doc' => $data['tipo_doc'],
            'doc_id' => $data['doc_id'],
            'nombre' => $data['name'],
            'apellido' => $data['apellido'],
            'edad' => $data['edad'],
            'direccion' => $data['direccion'],
            'telefono' => $data['telefono'],
            'email' => $data['email'],
            'usuario' => $data['usuario'],
            'contraseña' => $data['password'],
            'cod_rol' => $data['cod_rol'] ?? 4,
            'parentesco' => $data['parentesco'] ?? '',
            'google_id' => $data['google_id'] ?? null,
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
            $user->update($data);
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
        return usuarios::where('email', $email)->update([
            'contraseña' => $password,
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
}
