<?php
namespace App\Repositories\Interfaces;

interface visitasInterface
{
    public function getAllVisitas();
    public function getVisitaById(int $id);
    public function createVisita(array $data);
    public function updateVisita(int $id, array $data);
    public function deleteVisita(int $id);
    public function hasOverlappingVisit(int $residentCode, string $date, string $startTime, string $endTime, ?int $excludeId = null): bool;
    public function countVisitsForResidentOnDate(int $residentCode, string $date, ?int $excludeId = null): int;
}
