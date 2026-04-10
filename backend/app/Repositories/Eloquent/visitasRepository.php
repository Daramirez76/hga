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

    /**
     * Valida si un horario está ocupado globalmente (para cualquier residente).
     * Restricción: Solo puede haber una visita por hora en todo el hogar.
     *
     * @param string $date Formato: Y-m-d
     * @param string $startTime Formato: H:i
     * @param string $endTime Formato: H:i
     * @param int|null $excludeId ID de la visita a excluir (para updates)
     * @return bool
     */
    public function hasOverlappingVisitGlobal(string $date, string $startTime, string $endTime, ?int $excludeId = null): bool
    {
        $query = visitas::query()
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

    /**
     * Cuenta el total de visitas en un día (límite global: máximo 6 por día).
     *
     * @param string $date Formato: Y-m-d
     * @param int|null $excludeId ID de la visita a excluir (para updates)
     * @return int
     */
    public function countVisitsOnDateGlobal(string $date, ?int $excludeId = null): int
    {
        $query = visitas::query()
            ->where('Fecha_Visita', $date);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->count();
    }

    /**
     * Cuenta las visitas de un tutor en la semana (máximo 1 por semana).
     * Una semana es de lunes a viernes (dias laborales).
     *
     * @param int $userId doc_id del tutor
     * @param string $date Formato: Y-m-d (fecha de referencia para calcular la semana)
     * @param int|null $excludeId ID de la visita a excluir (para updates)
     * @return int
     */
    public function countVisitsByTutorInWeek(int $userId, string $date, ?int $excludeId = null): int
    {
        // Validar que userId sea válido
        if ($userId <= 0) {
            return 0;
        }

        try {
            $dateObj = new \DateTime($date);
        } catch (\Exception $e) {
            return 0;
        }

        // Calcular inicio de semana laboral (lunes)
        // format('N') retorna: 1=lunes, 2=martes, ..., 5=viernes, 6=sábado, 7=domingo
        $dayOfWeek = (int) $dateObj->format('N');
        
        // Retroceder al lunes de la semana actual
        if ($dayOfWeek > 1) {
            // Si es martes-viernes o fin de semana, retroceder al lunes
            $daysToSubtract = $dayOfWeek - 1; // martes(2)-1=1, miércoles(3)-1=2, ..., domingo(7)-1=6
            $dateObj->modify("-{$daysToSubtract} days");
        }
        // Si ya es lunes (dayOfWeek == 1), no se resta nada
        
        $weekStart = $dateObj->format('Y-m-d');
        
        // Fin de semana laboral: lunes + 4 días = viernes
        $weekEndObj = clone $dateObj;
        $weekEndObj->modify('+4 days');
        $weekEnd = $weekEndObj->format('Y-m-d');

        $query = visitas::query()
            ->where('cod_usuario', $userId)
            ->whereBetween('Fecha_Visita', [$weekStart, $weekEnd]);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->count();
    }

    /**
     * Obtiene los horarios ocupados en una fecha específica (para mostrar disponibilidad).
     * Retorna un array de arrays con hora_inicio y hora_fin de cada visita registrada.
     *
     * @param string $date Formato: Y-m-d
     * @return array Array de visitas con [hora_inicio, hora_fin]
     */
    public function getOccupiedTimeSlotsForDate(string $date): array
    {
        $visitas = visitas::query()
            ->where('Fecha_Visita', $date)
            ->select('hora_inicio', 'hora_fin')
            ->get();

        return $visitas->map(function ($visita) {
            return [
                'hora_inicio' => $visita->hora_inicio,
                'hora_fin' => $visita->hora_fin,
            ];
        })->toArray();
    }
}
