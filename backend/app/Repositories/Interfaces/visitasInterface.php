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
    public function getVisitasByDateRange(string $startDate, string $endDate);
    public function getVisitasByUserAndDateRange(int $userId, string $startDate, string $endDate);
    public function hasOverlappingVisitGlobal(string $date, string $startTime, string $endTime, ?int $excludeId = null): bool;
    public function countVisitsOnDateGlobal(string $date, ?int $excludeId = null): int;
    public function countVisitsByTutorInWeek(int $userId, string $date, ?int $excludeId = null): int;
    public function getOccupiedTimeSlotsForDate(string $date): array;
}
