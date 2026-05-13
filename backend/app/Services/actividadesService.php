<?php

namespace App\Services;

use App\Repositories\Interfaces\actividadesInterface;
use Illuminate\Support\Facades\Auth;

class actividadesService
{
    protected actividadesInterface $actividadesRepository;

    public function __construct(
        actividadesInterface $actividadesRepository,
        protected notificacionesService $notificacionesService,
        protected AccessScopeService $accessScopeService,
        protected QueryPaginationService $paginationService
    ) {
        $this->actividadesRepository = $actividadesRepository;
    }

    public function getAllActividades(?int $page = 1, ?int $perPage = 5, ?string $search = null, bool $paginate = false): array
    {
        $actividades = collect($this->actividadesRepository->all());
        $actividades = $this->paginationService->filterCollection($actividades, $search, [
            'Cod_acti_ludi',
            'Nombre',
            'Fecha',
            'Hora_ini',
            'Hora_fin',
            'cod_residente',
            'cod_rol',
            'Lugar',
        ]);

        if (!$paginate) {
            return [
                'data' => $actividades->values()->all(),
                'meta' => [],
            ];
        }

        return $this->paginationService->paginateCollection($actividades, $page, $perPage, [], $search);
    }

    public function getActividadesById($id)
    {
        return $this->actividadesRepository->find((int) $id);
    }

    public function create(array $data)
    {
        $data = $this->normalizePayload($data);
        $user = Auth::guard('api')->user();

        if (empty($data['Cod_acti_ludi'])) {
            $data['Cod_acti_ludi'] = $this->actividadesRepository->getNextCodActiLudi();
        }

        if (!isset($data['cod_rol']) || $data['cod_rol'] === null || $data['cod_rol'] === '') {
            $data['cod_rol'] = $user ? (int) ($user->cod_rol ?? 2) : 2;
        }

        $actividad = $this->actividadesRepository->create($data);
        $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyActividadCreated($actividad));

        return $actividad;
    }

    public function update(int $id, array $data)
    {
        $data = $this->normalizePayload($data);
        unset($data['Cod_acti_ludi'], $data['cod_rol']);

        $actividad = $this->actividadesRepository->update($id, $data);

        if ($actividad) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyActividadUpdated($actividad));
        }

        return $actividad;
    }

    public function delete(int $id)
    {
        $actividad = $this->getActividadesById($id);

        if (!$actividad) {
            return null;
        }

        $deleted = $this->actividadesRepository->delete($id);

        if ($deleted) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyActividadDeleted($actividad));
        }

        return $deleted;
    }

    protected function normalizePayload(array $data): array
    {
        if (isset($data['cod_acti_ludi']) && !isset($data['Cod_acti_ludi'])) {
            $data['Cod_acti_ludi'] = $data['cod_acti_ludi'];
        }
        unset($data['cod_acti_ludi']);

        if (isset($data['Cod_acti_ludi'])) {
            $data['Cod_acti_ludi'] = (int) $data['Cod_acti_ludi'];
        }

        if (isset($data['cod_residente'])) {
            $data['cod_residente'] = (int) $data['cod_residente'];
        }

        if (isset($data['cod_rol'])) {
            $data['cod_rol'] = (int) $data['cod_rol'];
        }

        if (isset($data['Nombre'])) {
            $data['Nombre'] = trim((string) $data['Nombre']);
        }

        if (isset($data['Lugar'])) {
            $data['Lugar'] = trim((string) $data['Lugar']);
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
