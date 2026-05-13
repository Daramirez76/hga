<?php

namespace App\Repositories\Interfaces;

interface informesInterface
{
    public function getAllVisibleForUser(?object $user);

    public function findVisibleById(int $id, ?object $user);

    public function create(array $data);

    public function update(int $id, array $data, ?object $user);

    public function delete(int $id, ?object $user);

    public function getNextCode(): int;
}
