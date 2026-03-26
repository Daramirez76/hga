<?php

namespace App\Services;

use App\Repositories\Interfaces\visitasInterface;
use Illuminate\Support\Facades\Auth;

class visitasService
{
    protected visitasInterface $visitasRepository;

    public function __construct(
        visitasInterface $visitasRepository,
        protected notificacionesService $notificacionesService
    ) {
        $this->visitasRepository = $visitasRepository;
    }

    public function getAllVisitas()
    {
        return $this->visitasRepository->getAllVisitas();
    }

    public function getVisitaById(int $id)
    {
        return $this->visitasRepository->getVisitaById($id);
    }

    public function create(array $data)
    {
        $payload = $this->normalizePayload($data);
        $payload['cod_usuario'] = $this->resolveAuthenticatedUserCode($payload['cod_usuario'] ?? null);

        $visita = $this->visitasRepository->createVisita($payload);
        $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyVisitaCreated($visita));

        return $visita;
    }

    public function update(int $id, array $data)
    {
        $payload = $this->normalizePayload($data);
        unset($payload['cod_Visitas'], $payload['cod_usuario']);

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

        return $data;
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
