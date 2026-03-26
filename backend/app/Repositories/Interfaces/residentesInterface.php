<?php
namespace App\Repositories\Interfaces;

interface residentesInterface
{
    public function getAllresidentes();

    public function getresidentesById(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id);

    public function getNextCodResidente(): int;
}
