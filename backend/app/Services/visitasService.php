<?php

namespace App\Services;

use App\Repositories\Interfaces\visitasInterface;
use Illuminate\Support\Facades\Auth;

class visitasService
{
    protected visitasInterface $visitasRepository;

    private const MAX_VISITS_PER_RESIDENT_PER_DAY = 3;

    public function __construct(
        visitasInterface $visitasRepository,
        protected notificacionesService $notificacionesService,
        protected AccessScopeService $accessScopeService,
        protected QueryPaginationService $paginationService
    ) {
        $this->visitasRepository = $visitasRepository;
    }

    public function getAllVisitas(?int $page = 1, ?int $perPage = 5, ?string $search = null, bool $paginate = false): array
    {
        $visitas = $this->accessScopeService->filterByResidentFields(
            collect($this->visitasRepository->getAllVisitas()),
            ['cod_Residente']
        );

        $visitas = $this->paginationService->filterCollection($visitas, $search, [
            'id',
            'cod_Visitas',
            'doc_id',
            'Nomb_visitante',
            'cod_Residente',
            'Fecha_Visita',
            'hora_inicio',
            'hora_fin',
            'cod_usuario',
        ]);

        if (!$paginate) {
            return [
                'data' => $visitas->values()->all(),
                'meta' => [],
            ];
        }

        return $this->paginationService->paginateCollection($visitas, $page, $perPage, [], $search);
    }

    public function getVisitaById(int $id)
    {
        $visita = $this->visitasRepository->getVisitaById($id);

        if (!$visita) {
            return null;
        }

        return $this->accessScopeService->canAccessResidentId((int) ($visita->cod_Residente ?? 0)) ? $visita : null;
    }

    public function create(array $data)
    {
        $payload = $this->normalizePayload($data);
        $payload['cod_usuario'] = $this->resolveAuthenticatedUserCode($payload['cod_usuario'] ?? null);

        $this->validateVisitConstraints($payload);

        $visita = $this->visitasRepository->createVisita($payload);
        $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyVisitaCreated($visita));

        return $visita;
    }

    public function update(int $id, array $data)
    {
        $payload = $this->normalizePayload($data);
        unset($payload['cod_Visitas'], $payload['cod_usuario']);

        $this->validateVisitConstraints($payload, $id);

        $visita = $this->visitasRepository->updateVisita($id, $payload);

        if ($visita) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyVisitaUpdated($visita));
        }

        return $visita;
    }

    public function delete(int $id)
    {
        $visita = $this->visitasRepository->getVisitaById($id);

        if (!$visita) {
            return null;
        }

        $deleted = $this->visitasRepository->deleteVisita($id);

        if ($deleted) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyVisitaDeleted($visita));
        }

        return $deleted;
    }

    protected function resolveAuthenticatedUserCode(mixed $fallback = null): int
    {
        $user = Auth::guard('api')->user();

        if (is_object($user)) {
            $docId = (int) ($user->doc_id ?? $user->id ?? 0);

            if ($docId > 0) {
                return $docId;
            }
        }

        $fallback = (int) ($fallback ?? 0);

        return $fallback > 0 ? $fallback : 1;
    }

    protected function normalizePayload(array $data): array
    {
        if (isset($data['cod_Visitas'])) {
            $data['cod_Visitas'] = (int) $data['cod_Visitas'];
        }

        if (isset($data['doc_id'])) {
            $data['doc_id'] = (int) $data['doc_id'];
        }

        if (isset($data['cod_Residente'])) {
            $data['cod_Residente'] = (int) $data['cod_Residente'];
        }

        if (isset($data['cod_usuario'])) {
            $data['cod_usuario'] = (int) $data['cod_usuario'];
        }

        if (isset($data['Nomb_visitante'])) {
            $data['Nomb_visitante'] = trim((string) $data['Nomb_visitante']);
        }

        if (isset($data['Fecha_Visita'])) {
            $data['Fecha_Visita'] = trim((string) $data['Fecha_Visita']);
        }

        if (isset($data['hora_inicio'])) {
            $data['hora_inicio'] = trim((string) $data['hora_inicio']);
        }

        if (isset($data['hora_fin'])) {
            $data['hora_fin'] = trim((string) $data['hora_fin']);
        }

        return $data;
    }

    protected function validateVisitConstraints(array $data, ?int $excludeId = null): void
    {
        $residentCode = $data['cod_Residente'] ?? null;
        $date = $data['Fecha_Visita'] ?? null;
        $startTime = $data['hora_inicio'] ?? null;
        $endTime = $data['hora_fin'] ?? null;

        if (!$residentCode || !$date || !$startTime || !$endTime) {
            return; // Dejar que el request valide los campos requeridos
        }

        // Validar cruces de horarios
        if ($this->visitasRepository->hasOverlappingVisit($residentCode, $date, $startTime, $endTime, $excludeId)) {
            throw new \InvalidArgumentException('Ya existe una visita programada para este residente en el horario especificado.');
        }

        // Validar aforo (capacidad máxima de visitas por residente por día)
        $currentVisits = $this->visitasRepository->countVisitsForResidentOnDate($residentCode, $date, $excludeId);
        if ($currentVisits >= self::MAX_VISITS_PER_RESIDENT_PER_DAY) {
            throw new \InvalidArgumentException('Se ha alcanzado el límite máximo de visitas para este residente en la fecha especificada.');
        }
    }

    protected function dispatchNotificationSafely(callable $callback): void
    {
        try {
            $callback();
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
