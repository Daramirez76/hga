<?php

namespace App\Services;

use App\Repositories\Interfaces\citasInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class citasService
{
    protected citasInterface $citasRepository;

    public function __construct(
        citasInterface $citasRepository,
        protected notificacionesService $notificacionesService,
        protected AccessScopeService $accessScopeService
    ) {
        $this->citasRepository = $citasRepository;
    }

    public function getAllcitas()
    {
        return $this->accessScopeService->filterByResidentFields(
            collect($this->citasRepository->getAllcitas()),
            ['cod_Residente']
        );
    }

    public function getcitasById($id)
    {
        $cita = $this->citasRepository->getcitasById((int) $id);

        if (!$cita) {
            return null;
        }

        return $this->accessScopeService->canAccessResidentId((int) ($cita->cod_Residente ?? 0)) ? $cita : null;
    }

    public function create(array $data)
    {
        $data = $this->normalizePayload($data);
        $data['cod_usuario'] = $this->resolveAuthenticatedUserCode($data['cod_usuario'] ?? null);

        if (!isset($data['cod_cita']) || $data['cod_cita'] === null || $data['cod_cita'] === '') {
            $data['cod_cita'] = $this->citasRepository->getNextCodCita();
        }

        $cita = $this->citasRepository->createcitas($data);
        $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyCitaCreated($cita));

        return $cita;
    }

    public function update($id, array $data)
    {
        $data = $this->normalizePayload($data);
        unset($data['cod_cita'], $data['cod_usuario']);

        $cita = $this->citasRepository->updatecitas((int) $id, $data);

        if ($cita) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyCitaUpdated($cita));
        }

        return $cita;
    }

    public function delete($id)
    {
        $cita = $this->getcitasById((int) $id);

        if (!$cita) {
            return null;
        }

        $deleted = $this->citasRepository->deletecitas((int) $id);

        if ($deleted) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyCitaDeleted($cita));
        }

        return $deleted;
    }

    protected function normalizePayload(array $data): array
    {
        if (isset($data['cod_cita'])) {
            $data['cod_cita'] = (int) $data['cod_cita'];
        }

        if (isset($data['cod_usuario'])) {
            $data['cod_usuario'] = (int) $data['cod_usuario'];
        }

        if (isset($data['cod_Residente'])) {
            $data['cod_Residente'] = (int) $data['cod_Residente'];
        }

        if (isset($data['Fecha_cita'])) {
            $data['Fecha_cita'] = trim((string) $data['Fecha_cita']);
        }

        if (isset($data['hora_inicio'])) {
            $data['hora_inicio'] = trim((string) $data['hora_inicio']);
        }

        if (isset($data['hora_fin'])) {
            $data['hora_fin'] = trim((string) $data['hora_fin']);
        }

        if (isset($data['Nombre_acompañante'])) {
            $data['Nombre_acompañante'] = trim((string) $data['Nombre_acompañante']);
        }

        if (isset($data['Lugar_cita'])) {
            $data['Lugar_cita'] = trim((string) $data['Lugar_cita']);
        }

        return $data;
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

        if ($fallback > 0) {
            return $fallback;
        }

        throw ValidationException::withMessages([
            'cod_usuario' => 'No se pudo identificar el usuario autenticado para registrar la cita.',
        ]);
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
