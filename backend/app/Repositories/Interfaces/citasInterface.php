<?php

namespace App\Repositories\Interfaces;

interface citasInterface
{
    public function getAllcitas();

    public function getcitasById(int $id);

    public function createcitas(array $data);

    public function updatecitas(int $id, array $data);

    public function deletecitas(int $id);

    public function getNextCodCita(): int;
}
