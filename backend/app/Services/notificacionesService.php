<?php

namespace App\Services;

use App\Models\residentes;
use App\Models\usuarios;
use App\Repositories\Interfaces\notificacionesInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class notificacionesService
{
    public function __construct(
        protected notificacionesInterface $notificacionesRepository
    ) {
    }

    /**
     * @return array{items: Collection<int, mixed>, unread_count: int}
     */
    public function getNotificationsForCurrentUser(?int $limit = null): array
    {
        $docId = $this->getAuthenticatedUserDocId();

        return [
            'items' => $this->notificacionesRepository->getForRecipient($docId, $limit),
            'unread_count' => $this->notificacionesRepository->countUnreadForRecipient($docId),
        ];
    }

    public function markAsReadForCurrentUser(int $id)
    {
        return $this->notificacionesRepository->markAsReadForRecipient($id, $this->getAuthenticatedUserDocId());
    }

    public function markAllAsReadForCurrentUser(): int
    {
        return $this->notificacionesRepository->markAllAsReadForRecipient($this->getAuthenticatedUserDocId());
    }

    public function notifyCitaCreated(object $cita): void
    {
        $this->dispatchCitaNotification('created', $cita);
    }

    public function notifyCitaUpdated(object $cita): void
    {
        $this->dispatchCitaNotification('updated', $cita);
    }

    public function notifyCitaDeleted(object $cita): void
    {
        $this->dispatchCitaNotification('deleted', $cita);
    }

    public function notifyVisitaCreated(object $visita): void
    {
        $this->dispatchVisitaNotification('created', $visita);
    }

    public function notifyVisitaUpdated(object $visita): void
    {
        $this->dispatchVisitaNotification('updated', $visita);
    }

    public function notifyVisitaDeleted(object $visita): void
    {
        $this->dispatchVisitaNotification('deleted', $visita);
    }

    public function notifyMedicamentoCreated(object $medicamento): void
    {
        $this->dispatchMedicamentoNotification('created', $medicamento);
    }

    public function notifyMedicamentoUpdated(object $medicamento): void
    {
        $this->dispatchMedicamentoNotification('updated', $medicamento);
    }

    public function notifyMedicamentoDeleted(object $medicamento): void
    {
        $this->dispatchMedicamentoNotification('deleted', $medicamento);
    }

    public function notifyInformeCreated(object $informe): void
    {
        $this->dispatchInformeNotification('created', $informe);
    }

    public function notifyInformeUpdated(object $informe): void
    {
        $this->dispatchInformeNotification('updated', $informe);
    }

    public function notifyInformeDeleted(object $informe): void
    {
        $this->dispatchInformeNotification('deleted', $informe);
    }

    public function notifyActividadCreated(object $actividad): void
    {
        $this->dispatchActividadNotification('created', $actividad);
    }

    public function notifyActividadUpdated(object $actividad): void
    {
        $this->dispatchActividadNotification('updated', $actividad);
    }

    public function notifyActividadDeleted(object $actividad): void
    {
        $this->dispatchActividadNotification('deleted', $actividad);
    }

    protected function dispatchCitaNotification(string $event, object $cita): void
    {
        $codResidente = (int) ($cita->cod_Residente ?? 0);
        $actorDocId = $this->resolveActorDocument($cita);
        $recipientDocIds = $this->resolveRecipientDocIds($codResidente);

        if ($recipientDocIds === []) {
            return;
        }

        [$title, $message] = $this->buildCitaMessage($event, $cita, $codResidente);
        $now = now();
        $entityId = (int) ($cita->cod_cita ?? 0);
        $meta = $this->buildCitaMeta($cita);
        $rows = [];

        foreach ($recipientDocIds as $recipientDocId) {
            $rows[] = [
                'recipient_doc_id' => $recipientDocId,
                'actor_doc_id' => $actorDocId > 0 ? $actorDocId : null,
                'module' => 'citas',
                'event' => $event,
                'entity_id' => $entityId > 0 ? $entityId : null,
                'cod_residente' => $codResidente > 0 ? $codResidente : null,
                'title' => $title,
                'message' => $message,
                'meta' => json_encode($meta, JSON_UNESCAPED_UNICODE),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $this->notificacionesRepository->createMany($rows);
    }

    protected function dispatchVisitaNotification(string $event, object $visita): void
    {
        $codResidente = (int) ($visita->cod_Residente ?? 0);
        $actorDocId = $this->resolveActorDocument($visita);
        $recipientDocIds = $this->resolveRecipientDocIds($codResidente);

        if ($recipientDocIds === []) {
            return;
        }

        [$title, $message] = $this->buildVisitaMessage($event, $visita, $codResidente);
        $now = now();
        $entityId = (int) (($visita->id ?? 0) ?: ($visita->cod_Visitas ?? 0));
        $meta = $this->buildVisitaMeta($visita);
        $rows = [];

        foreach ($recipientDocIds as $recipientDocId) {
            $rows[] = [
                'recipient_doc_id' => $recipientDocId,
                'actor_doc_id' => $actorDocId > 0 ? $actorDocId : null,
                'module' => 'visitas',
                'event' => $event,
                'entity_id' => $entityId > 0 ? $entityId : null,
                'cod_residente' => $codResidente > 0 ? $codResidente : null,
                'title' => $title,
                'message' => $message,
                'meta' => json_encode($meta, JSON_UNESCAPED_UNICODE),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $this->notificacionesRepository->createMany($rows);
    }

    protected function dispatchMedicamentoNotification(string $event, object $medicamento): void
    {
        $codResidente = (int) ($medicamento->cod_residente ?? 0);
        $actorDocId = $this->resolveActorDocument($medicamento);
        $recipientDocIds = $this->resolveRecipientDocIds($codResidente);

        if ($recipientDocIds === []) {
            return;
        }

        [$title, $message] = $this->buildMedicamentoMessage($event, $medicamento, $codResidente);
        $now = now();
        $entityId = (int) ($medicamento->Cod_medicamento ?? 0);
        $meta = $this->buildMedicamentoMeta($medicamento);
        $rows = [];

        foreach ($recipientDocIds as $recipientDocId) {
            $rows[] = [
                'recipient_doc_id' => $recipientDocId,
                'actor_doc_id' => $actorDocId > 0 ? $actorDocId : null,
                'module' => 'medicamentos',
                'event' => $event,
                'entity_id' => $entityId > 0 ? $entityId : null,
                'cod_residente' => $codResidente > 0 ? $codResidente : null,
                'title' => $title,
                'message' => $message,
                'meta' => json_encode($meta, JSON_UNESCAPED_UNICODE),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $this->notificacionesRepository->createMany($rows);
    }

    protected function dispatchInformeNotification(string $event, object $informe): void
    {
        $codResidente = (int) ($informe->cod_Residente ?? 0);
        $actorDocId = $this->resolveActorDocument($informe);
        $recipientDocIds = $this->resolveRecipientDocIds($codResidente);

        if ($recipientDocIds === []) {
            return;
        }

        [$title, $message] = $this->buildInformeMessage($event, $informe, $codResidente);
        $now = now();
        $entityId = (int) ($informe->cod_Informes ?? 0);
        $meta = $this->buildInformeMeta($informe);
        $rows = [];

        foreach ($recipientDocIds as $recipientDocId) {
            $rows[] = [
                'recipient_doc_id' => $recipientDocId,
                'actor_doc_id' => $actorDocId > 0 ? $actorDocId : null,
                'module' => 'informes',
                'event' => $event,
                'entity_id' => $entityId > 0 ? $entityId : null,
                'cod_residente' => $codResidente > 0 ? $codResidente : null,
                'title' => $title,
                'message' => $message,
                'meta' => json_encode($meta, JSON_UNESCAPED_UNICODE),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $this->notificacionesRepository->createMany($rows);
    }

    protected function dispatchActividadNotification(string $event, object $actividad): void
    {
        $codResidente = (int) ($actividad->cod_residente ?? 0);
        $actorDocId = $this->resolveActorDocument($actividad);
        $recipientDocIds = $this->resolveRecipientDocIds($codResidente);

        if ($recipientDocIds === []) {
            return;
        }

        [$title, $message] = $this->buildActividadMessage($event, $actividad, $codResidente);
        $now = now();
        $entityId = (int) ($actividad->Cod_acti_ludi ?? 0);
        $meta = $this->buildActividadMeta($actividad);
        $rows = [];

        foreach ($recipientDocIds as $recipientDocId) {
            $rows[] = [
                'recipient_doc_id' => $recipientDocId,
                'actor_doc_id' => $actorDocId > 0 ? $actorDocId : null,
                'module' => 'actividades',
                'event' => $event,
                'entity_id' => $entityId > 0 ? $entityId : null,
                'cod_residente' => $codResidente > 0 ? $codResidente : null,
                'title' => $title,
                'message' => $message,
                'meta' => json_encode($meta, JSON_UNESCAPED_UNICODE),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $this->notificacionesRepository->createMany($rows);
    }

    /**
     * @return array{0: string, 1: string}
     */
    protected function buildCitaMessage(string $event, object $cita, int $codResidente): array
    {
        $fecha = trim((string) ($cita->Fecha_cita ?? ''));
        $horaInicio = trim((string) ($cita->hora_inicio ?? ''));
        $lugar = trim((string) ($cita->Lugar_cita ?? ''));
        $fechaLabel = $fecha !== '' ? $this->formatDateLabel($fecha) : 'fecha pendiente';
        $horaLabel = $horaInicio !== '' ? substr($horaInicio, 0, 5) : 'hora pendiente';
        $lugarLabel = $lugar !== '' ? $lugar : 'lugar pendiente';

        return match ($event) {
            'updated' => [
                'Cita medica actualizada',
                "Se actualizo la cita medica del residente #{$codResidente} para el {$fechaLabel} a las {$horaLabel} en {$lugarLabel}.",
            ],
            'deleted' => [
                'Cita medica eliminada',
                "Se elimino una cita medica asociada al residente #{$codResidente} programada para el {$fechaLabel} a las {$horaLabel}.",
            ],
            default => [
                'Nueva cita medica',
                "Se registro una cita medica para el residente #{$codResidente} el {$fechaLabel} a las {$horaLabel} en {$lugarLabel}.",
            ],
        };
    }

    /**
     * @return array{0: string, 1: string}
     */
    protected function buildVisitaMessage(string $event, object $visita, int $codResidente): array
    {
        $fecha = trim((string) ($visita->Fecha_Visita ?? ''));
        $visitante = trim((string) ($visita->Nomb_visitante ?? ''));
        $fechaLabel = $fecha !== '' ? $this->formatDateLabel($fecha) : 'fecha pendiente';
        $visitanteLabel = $visitante !== '' ? $visitante : 'visitante sin nombre';

        return match ($event) {
            'updated' => [
                'Visita actualizada',
                "Se actualizo la visita de {$visitanteLabel} para el residente #{$codResidente} programada para el {$fechaLabel}.",
            ],
            'deleted' => [
                'Visita eliminada',
                "Se elimino una visita asociada al residente #{$codResidente} que estaba programada para el {$fechaLabel}.",
            ],
            default => [
                'Nueva visita programada',
                "Se registro una visita de {$visitanteLabel} para el residente #{$codResidente} el {$fechaLabel}.",
            ],
        };
    }

    /**
     * @return array{0: string, 1: string}
     */
    protected function buildMedicamentoMessage(string $event, object $medicamento, int $codResidente): array
    {
        $nombre = trim((string) ($medicamento->nombre_medic ?? ''));
        $novedad = trim((string) ($medicamento->descrip_novedad ?? ''));
        $nombreLabel = $nombre !== '' ? $nombre : 'medicamento sin nombre';
        $novedadLabel = $novedad !== '' ? $novedad : 'sin detalle adicional';

        return match ($event) {
            'updated' => [
                'Medicamento actualizado',
                "Se actualizo el medicamento {$nombreLabel} para el residente #{$codResidente}. Detalle: {$novedadLabel}.",
            ],
            'deleted' => [
                'Medicamento eliminado',
                "Se elimino el medicamento {$nombreLabel} asociado al residente #{$codResidente}.",
            ],
            default => [
                'Nuevo medicamento registrado',
                "Se registro el medicamento {$nombreLabel} para el residente #{$codResidente}. Detalle: {$novedadLabel}.",
            ],
        };
    }

    /**
     * @return array{0: string, 1: string}
     */
    protected function buildInformeMessage(string $event, object $informe, int $codResidente): array
    {
        $titulo = trim((string) ($informe->Titulo_Informes ?? ''));
        $tituloLabel = $titulo !== '' ? $titulo : 'informe sin titulo';

        return match ($event) {
            'updated' => [
                'Informe actualizado',
                "Se actualizo el informe {$tituloLabel} del residente #{$codResidente}.",
            ],
            'deleted' => [
                'Informe eliminado',
                "Se elimino un informe asociado al residente #{$codResidente}.",
            ],
            default => [
                'Nuevo informe registrado',
                "Se registro el informe {$tituloLabel} para el residente #{$codResidente}.",
            ],
        };
    }

    /**
     * @return array{0: string, 1: string}
     */
    protected function buildActividadMessage(string $event, object $actividad, int $codResidente): array
    {
        $nombre = trim((string) ($actividad->Nombre ?? ''));
        $fecha = trim((string) ($actividad->Fecha ?? ''));
        $lugar = trim((string) ($actividad->Lugar ?? ''));
        $nombreLabel = $nombre !== '' ? $nombre : 'actividad sin nombre';
        $fechaLabel = $fecha !== '' ? $this->formatDateLabel($fecha) : 'fecha pendiente';
        $lugarLabel = $lugar !== '' ? $lugar : 'lugar pendiente';

        return match ($event) {
            'updated' => [
                'Actividad ludica actualizada',
                "Se actualizo la actividad {$nombreLabel} del residente #{$codResidente} para el {$fechaLabel} en {$lugarLabel}.",
            ],
            'deleted' => [
                'Actividad ludica eliminada',
                "Se elimino una actividad ludica asociada al residente #{$codResidente} programada para el {$fechaLabel}.",
            ],
            default => [
                'Nueva actividad ludica',
                "Se registro la actividad {$nombreLabel} para el residente #{$codResidente} el {$fechaLabel} en {$lugarLabel}.",
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildCitaMeta(object $cita): array
    {
        return [
            'cod_cita' => (int) ($cita->cod_cita ?? 0),
            'fecha' => (string) ($cita->Fecha_cita ?? ''),
            'hora_inicio' => (string) ($cita->hora_inicio ?? ''),
            'hora_fin' => (string) ($cita->hora_fin ?? ''),
            'lugar' => (string) ($cita->Lugar_cita ?? ''),
            'acompanante' => (string) ($cita->Nombre_acompañante ?? ''),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildVisitaMeta(object $visita): array
    {
        return [
            'id' => (int) ($visita->id ?? 0),
            'cod_Visitas' => (int) ($visita->cod_Visitas ?? 0),
            'fecha' => (string) ($visita->Fecha_Visita ?? ''),
            'visitante' => (string) ($visita->Nomb_visitante ?? ''),
            'doc_id' => (int) ($visita->doc_id ?? 0),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildMedicamentoMeta(object $medicamento): array
    {
        return [
            'cod_medicamento' => (int) ($medicamento->Cod_medicamento ?? 0),
            'nombre_medic' => (string) ($medicamento->nombre_medic ?? ''),
            'fecha_entrada' => (string) ($medicamento->fecha_entrada ?? ''),
            'fecha_vencimiento' => (string) ($medicamento->fecha_vencimiento ?? ''),
            'stock' => (int) ($medicamento->stock ?? 0),
            'descrip_novedad' => (string) ($medicamento->descrip_novedad ?? ''),
            'fecha_novedad' => (string) ($medicamento->fecha_novedad ?? ''),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildInformeMeta(object $informe): array
    {
        return [
            'cod_Informes' => (int) ($informe->cod_Informes ?? 0),
            'titulo' => (string) ($informe->Titulo_Informes ?? ''),
            'descripcion' => (string) ($informe->descripcion ?? ''),
            'tipo' => (string) ($informe->tipo ?? ''),
            'urgencia' => (string) ($informe->urgencia ?? ''),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildActividadMeta(object $actividad): array
    {
        return [
            'Cod_acti_ludi' => (int) ($actividad->Cod_acti_ludi ?? 0),
            'nombre' => (string) ($actividad->Nombre ?? ''),
            'fecha' => (string) ($actividad->Fecha ?? ''),
            'hora_inicio' => (string) ($actividad->Hora_ini ?? ''),
            'hora_fin' => (string) ($actividad->Hora_fin ?? ''),
            'lugar' => (string) ($actividad->Lugar ?? ''),
        ];
    }

    /**
     * @return list<int>
     */
    protected function resolveRecipientDocIds(int $codResidente): array
    {
        $docIds = usuarios::query()
            ->whereIn('cod_rol', [1, 2])
            ->pluck('doc_id')
            ->map(static fn ($docId): int => (int) $docId)
            ->filter(static fn (int $docId): bool => $docId > 0)
            ->values()
            ->all();

        if ($codResidente > 0) {
            $tutorDocId = residentes::query()
                ->where('cod_residente', $codResidente)
                ->value('cod_usuario');

            $tutorDocId = (int) ($tutorDocId ?? 0);

            if ($tutorDocId > 0) {
                $isTutor = usuarios::query()
                    ->where('doc_id', $tutorDocId)
                    ->where('cod_rol', 4)
                    ->exists();

                if ($isTutor) {
                    $docIds[] = $tutorDocId;
                }
            }
        }

        return collect($docIds)
            ->filter(static fn (int $docId): bool => $docId > 0)
            ->unique()
            ->values()
            ->all();
    }

    protected function resolveActorDocument(object $entity): int
    {
        $authUser = Auth::guard('api')->user();

        if (is_object($authUser)) {
            $docId = (int) ($authUser->doc_id ?? $authUser->id ?? 0);

            if ($docId > 0) {
                return $docId;
            }
        }

        $directDocId = (int) ($entity->doc_id ?? 0);
        if ($directDocId > 0) {
            return $directDocId;
        }

        return (int) ($entity->cod_usuario ?? 0);
    }

    protected function getAuthenticatedUserDocId(): int
    {
        $user = Auth::guard('api')->user();
        $docId = (int) ($user->doc_id ?? $user->id ?? 0);

        return $docId > 0 ? $docId : 0;
    }

    protected function formatDateLabel(string $date): string
    {
        try {
            return \Illuminate\Support\Carbon::parse($date)->format('d/m/Y');
        } catch (\Throwable) {
            return $date;
        }
    }
}
