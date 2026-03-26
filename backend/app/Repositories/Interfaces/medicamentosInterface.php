<?php

namespace App\Repositories\Interfaces;

interface medicamentosInterface
{
    public function getAllmedicamentos();

    public function getmedicamentosById(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id);

    public function getNextCodMedicamento(): int;
}
