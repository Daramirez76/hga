<?php

namespace App\Repositories\Interfaces;

use App\Models\usuarios;

interface usuariosInterface
{
    public function create(array $data): usuarios;

    public function findByEmail(string $email): ?usuarios;

    public function findById(int $id): ?usuarios;

    public function findByUsername(string $username): ?usuarios;

    public function update(int $id, array $data): ?usuarios;

    public function updatePasswordByEmail(string $email, string $password): bool;

    public function delete(int $id): bool;
}
