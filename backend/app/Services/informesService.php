<?php

namespace App\Services;

use App\Repositories\Interfaces\informesInterface;
use Illuminate\Support\Facades\Auth;

class informesService
{
    protected informesInterface $informesRepository;

    public function __construct(
        informesInterface $informesRepository,
        protected notificacionesService $notificacionesService
    ) {
        $this->informesRepository = $informesRepository;
    }

    public function getAllInformes()
    {
        return $this->informesRepository->getAllVisibleForUser($this->getAuthenticatedUser());
    }

    public function getInformeById(int $id)
    {
        return $this->informesRepository->findVisibleById($id, $this->getAuthenticatedUser());
    }

    public function create(array $data)
    {
        $user = $this->getAuthenticatedUser();
        $payload = $this->normalizePayload($data);

        if ($user) {
            $payload['doc_id'] = $this->resolveAuthorDocument($user);
            $payload['cod_rol'] = $this->resolveRoleCode($user);
        }

        if (!isset($payload['tipo']) || $payload['tipo'] === '') {
            $payload['tipo'] = 'general';
        }

        if (!isset($payload['urgencia']) || $payload['urgencia'] === '') {
            $payload['urgencia'] = 'normal';
        }

        $informe = $this->informesRepository->create($payload);
        $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyInformeCreated($informe));

        return $informe;
    }

    public function update(int $id, array $data)
    {
        $payload = $this->normalizePayload($data);
        unset($payload['cod_Informes'], $payload['doc_id'], $payload['cod_rol']);

        $informe = $this->informesRepository->update($id, $payload, $this->getAuthenticatedUser());

        if ($informe) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyInformeUpdated($informe));
        }

        return $informe;
    }

    public function delete(int $id)
    {
        $informe = $this->getInformeById($id);

        if (!$informe) {
            return null;
        }

        $deleted = $this->informesRepository->delete($id, $this->getAuthenticatedUser());

        if ($deleted) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyInformeDeleted($informe));
        }

        return $deleted;
    }

    protected function getAuthenticatedUser(): ?object
    {
        $user = Auth::guard('api')->user();

        return is_object($user) ? $user : null;
    }

    protected function resolveAuthorDocument(object $user): int
    {
        $docId = (int) ($user->doc_id ?? 0);

        if ($docId > 0) {
            return $docId;
        }

        return (int) ($user->id ?? 0);
    }

    protected function resolveRoleCode(object $user): int
    {
        $roleCode = (int) ($user->cod_rol ?? 0);

        return $roleCode > 0 ? $roleCode : 4;
    }

    protected function normalizePayload(array $data): array
    {
        if (isset($data['cod_Informes'])) {
            $data['cod_Informes'] = (int) $data['cod_Informes'];
        }

        if (isset($data['cod_Residente'])) {
            $data['cod_Residente'] = (int) $data['cod_Residente'];
        }

        if (isset($data['Titulo_Informes'])) {
            $data['Titulo_Informes'] = trim((string) $data['Titulo_Informes']);
        }

        if (isset($data['descripcion'])) {
            $data['descripcion'] = trim((string) $data['descripcion']);
        }

        if (isset($data['tipo'])) {
            $data['tipo'] = trim((string) $data['tipo']);
        }

        if (isset($data['urgencia'])) {
            $data['urgencia'] = trim((string) $data['urgencia']);
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
