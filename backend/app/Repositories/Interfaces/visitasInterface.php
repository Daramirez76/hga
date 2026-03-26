<?php
namespace App\Repositories\Interfaces;

interface visitasInterface
{
    public function getAllVisitas();
    public function getVisitaById(int $id);
    public function createVisita(array $data);
    public function updateVisita(int $id, array $data);
    public function deleteVisita(int $id);
}
