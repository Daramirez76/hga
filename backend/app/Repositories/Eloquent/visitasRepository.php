<?php

namespace App\Repositories\Eloquent;

use App\Models\visitas;
use App\Repositories\Interfaces\visitasInterface;
use Illuminate\Support\Facades\DB;

class visitasRepository implements visitasInterface
{
    public function getAllVisitas()
    {
        return visitas::query()->orderBy('id')->get();
    }

    public function getVisitaById(int $id)
    {
        return visitas::query()->find($id);
    }

    public function createVisita(array $data)
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['cod_Visitas'])) {
                $data['cod_Visitas'] = $this->nextVisitaCode();
            }

            return visitas::create($data);
        });
    }

    public function updateVisita(int $id, array $data)
    {
        $visita = visitas::query()->find($id);

        if (!$visita) {
            return null;
        }

        $visita->update($data);

        return $visita->refresh();
    }

    public function deleteVisita(int $id)
    {
        $visita = visitas::query()->find($id);

        if (!$visita) {
            return null;
        }

        $visita->delete();

        return true;
    }

    public function hasOverlappingVisit(int $residentCode, string $date, string $startTime, string $endTime, ?int $excludeId = null): bool
    {
        $query = visitas::query()
            ->where('cod_Residente', $residentCode)
            ->where('Fecha_Visita', $date)
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($inner) use ($startTime, $endTime) {
                    $inner->where('hora_inicio', '<', $endTime)
                          ->where('hora_fin', '>', $startTime);
                });
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    public function countVisitsForResidentOnDate(int $residentCode, string $date, ?int $excludeId = null): int
    {
        $query = visitas::query()
            ->where('cod_Residente', $residentCode)
            ->where('Fecha_Visita', $date);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->count();
    }

    /**
     * Genera el siguiente código de visita basado en el máximo actual.
     *
     * @return int
     */
    protected function nextVisitaCode(): int
    {
        $lastCode = visitas::query()->max('cod_Visitas');

        return $lastCode ? ((int) $lastCode + 1) : 1;
    }

    /**
     * Obtiene visitas dentro de un rango de fechas.
     *
     * @param string $startDate Formato: Y-m-d
     * @param string $endDate Formato: Y-m-d
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getVisitasByDateRange(string $startDate, string $endDate)
    {
        return visitas::query()
            ->whereBetween('Fecha_Visita', [$startDate, $endDate])
            ->orderBy('Fecha_Visita')
            ->orderBy('hora_inicio')
            ->get();
    }

    /**
     * Obtiene visitas de un usuario específico dentro de un rango de fechas.
     *
     * @param int $userId doc_id del usuario
     * @param string $startDate Formato: Y-m-d
     * @param string $endDate Formato: Y-m-d
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getVisitasByUserAndDateRange(int $userId, string $startDate, string $endDate)
    {
        return visitas::query()
            ->where('cod_usuario', $userId)
            ->whereBetween('Fecha_Visita', [$startDate, $endDate])
            ->orderBy('Fecha_Visita')
            ->orderBy('hora_inicio')
            ->get();
    }
}
