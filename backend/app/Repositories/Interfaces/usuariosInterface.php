<?php

namespace App\Repositories\Interfaces;

use App\Models\usuarios;
use Illuminate\Support\Collection;

interface usuariosInterface
{
    public function create(array $data): usuarios;

    public function findByEmail(string $email): ?usuarios;

    public function findByGoogleId(string $googleId): ?usuarios;

    public function findById(int $id): ?usuarios;

    public function findByUsername(string $username): ?usuarios;

    public function getNextDocId(): int;

    public function getUsersByRole(int $roleCode): Collection;

    public function update(int $id, array $data): ?usuarios;

    public function updatePasswordByEmail(string $email, string $password): bool;

    public function delete(int $id): bool;
}
