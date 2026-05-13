<?php

namespace App\Services;

use App\Repositories\Interfaces\visitasInterface;
use Illuminate\Support\Facades\Auth;

class visitasService
{
    protected visitasInterface $visitasRepository;

    private const MAX_VISITS_PER_RESIDENT_PER_DAY = 3;
    private const MAX_VISITS_PER_DAY_GLOBAL = 6;
    private const MAX_VISITS_PER_TUTOR_PER_WEEK = 1;

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
        // Filtrar por residentes accesibles (staff ve todos, tutores ven sus asignados)
        $visitas = $this->accessScopeService->filterByResidentFields(
            collect($this->visitasRepository->getAllVisitas()),
            ['cod_Residente']
        );

        // Aplicar filtrado adicional por usuario si es tutor
        $visitas = $this->filterVisitasByUserIfTutor($visitas);

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

        // Verificar acceso al residente
        if (!$this->accessScopeService->canAccessResidentId((int) ($visita->cod_Residente ?? 0))) {
            return null;
        }

        // Verificar acceso a la visita específica (tutores solo ven sus propias visitas)
        if (!$this->canAccessVisita($visita)) {
            return null;
        }

        return $visita;
    }

    public function create(array $data)
    {
        $payload = $this->normalizePayload($data);
        $payload['cod_usuario'] = $this->resolveAuthenticatedUserCode($payload['cod_usuario'] ?? null);

        // Validar que tutores solo crean visitas para sus residentes asignados
        $this->validateTutorCanAccessResident((int) ($payload['cod_Residente'] ?? 0));

        $this->validateVisitConstraints($payload);

        $visita = $this->visitasRepository->createVisita($payload);
        $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyVisitaCreated($visita));

        return $visita;
    }

    public function update(int $id, array $data)
    {
        // Verificar que el usuario actual pueda acceder a esta visita
        $existingVisita = $this->visitasRepository->getVisitaById($id);
        if (!$existingVisita || !$this->canAccessVisita($existingVisita)) {
            return null;
        }

        // Validar que tutores solo actualizan visitas para sus residentes asignados
        $this->validateTutorCanAccessResident((int) ($existingVisita->cod_Residente ?? 0));

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

        // Verificar que el usuario actual pueda acceder a esta visita
        if (!$this->canAccessVisita($visita)) {
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
        $userId = $data['cod_usuario'] ?? null;

        if (!$residentCode || !$date || !$startTime || !$endTime || !$userId || $userId <= 0) {
            return; // Dejar que el request valide los campos requeridos
        }

        // 1. Validar que no sea una fecha pasada
        try {
            $visitDate = new \DateTime($date);
            $today = new \DateTime();
            $today->setTime(0, 0, 0);
            
            if ($visitDate < $today) {
                throw new \InvalidArgumentException('No se pueden registrar visitas en fechas pasadas.');
            }
        } catch (\Exception $e) {
            if (strpos($e->getMessage(), 'pasadas') !== false) {
                throw $e;
            }
            // Si es otro error, ignorar y dejar que otras validaciones reporten
        }

        // 2. Validar bloqueo de horario GLOBAL (no puede haber dos visitas en el mismo horario, para ningún residente)
        if ($this->visitasRepository->hasOverlappingVisitGlobal($date, $startTime, $endTime, $excludeId)) {
            throw new \InvalidArgumentException('El horario seleccionado ya está ocupado. Por favor, elige otro horario disponible.');
        }

        // 3. Validar límite diario global (máximo 6 visitas en total por día)
        $visitsOnDay = $this->visitasRepository->countVisitsOnDateGlobal($date, $excludeId);
        if ($visitsOnDay >= self::MAX_VISITS_PER_DAY_GLOBAL) {
            throw new \InvalidArgumentException('Se ha alcanzado el límite máximo de visitas permitidas para este día (6 visitas). Intenta con otra fecha.');
        }

        // 4. Validar límite de visitas por tutor por semana (máximo 1 por semana)
        // IMPORTANTE: Esta validación se aplica SOLO a tutores
        if ($this->accessScopeService->isTutor()) {
            $visitsThisWeek = $this->visitasRepository->countVisitsByTutorInWeek($userId, $date, $excludeId);
            if ($visitsThisWeek >= self::MAX_VISITS_PER_TUTOR_PER_WEEK) {
                throw new \InvalidArgumentException('Ya has registrado una visita esta semana. Cada tutor puede registrar como máximo 1 visita por semana.');
            }
        }

        // Mantener la validación antigua por compatibilidad (aunque ya no es tan crucial con las nuevas restricciones)
        // Validar cruces de horarios por residente
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

    /**
     * Filtra visitas por usuario actual si es tutor.
     * Los tutores solo ven las visitas que ellos registraron.
     * El personal ve todas las visitas.
     *
     * @param \Illuminate\Support\Collection $visitas
     * @return \Illuminate\Support\Collection
     */
    protected function filterVisitasByUserIfTutor($visitas)
    {
        // Si no es tutor, devolver todas las visitas (ya filtradas por residentes)
        if (!$this->accessScopeService->isTutor()) {
            return $visitas;
        }

        $currentUserDocId = $this->accessScopeService->getUserDocId();

        if ($currentUserDocId <= 0) {
            return collect();
        }

        // Filtrar: solo visitas registradas por este tutor (cod_usuario)
        return $visitas->filter(
            static fn ($visita): bool => (int) ($visita->cod_usuario ?? 0) === $currentUserDocId
        )->values();
    }

    /**
     * Verifica si el usuario actual puede acceder a una visita específica.
     * - Staff: puede acceder a todas las visitas
     * - Tutor: solo puede acceder a sus propias visitas (cod_usuario)
     *
     * @param object $visita
     * @return bool
     */
    protected function canAccessVisita(object $visita): bool
    {
        // Staff tiene acceso a todas
        if ($this->accessScopeService->isStaff()) {
            return true;
        }

        // Tutor solo puede acceder si él la registró
        if ($this->accessScopeService->isTutor()) {
            $currentUserDocId = $this->accessScopeService->getUserDocId();
            $visitaUserId = (int) ($visita->cod_usuario ?? 0);

            return $currentUserDocId > 0 && $currentUserDocId === $visitaUserId;
        }

        return false;
    }

    /**
     * Valida que el tutor actual tenga permiso para interactuar con este residente.
     * Los tutores solo pueden crear/editar visitas para sus residentes asignados.
     *
     * @param int $residentId
     * @throws \InvalidArgumentException
     * @return void
     */
    protected function validateTutorCanAccessResident(int $residentId): void
    {
        if (!$this->accessScopeService->canAccessResidentId($residentId)) {
            throw new \InvalidArgumentException('No tienes permiso para interactuar con este residente.');
        }
    }

    /**
     * Obtiene visitas para el calendario dentro de un rango de fechas.
     * 
     * - Admin/Staff: Ve todas las visitas del rango
     * - Tutor: Ve solo sus visitas registradas
     *
     * @param string $startDate Formato: Y-m-d
     * @param string $endDate Formato: Y-m-d
     * @return array
     */
    public function getCalendarVisitas(string $startDate, string $endDate): array
    {
        if ($this->accessScopeService->isStaff()) {
            // Admin/Staff ve todas las visitas del rango
            $visitas = $this->visitasRepository->getVisitasByDateRange($startDate, $endDate);
        } else if ($this->accessScopeService->isTutor()) {
            // Tutor solo ve sus propias visitas
            $userDocId = $this->accessScopeService->getUserDocId();
            $visitas = $this->visitasRepository->getVisitasByUserAndDateRange($userDocId, $startDate, $endDate);
        } else {
            return [];
        }

        // Normalizar los datos para el calendario
        return $visitas->map(function ($visita) {
            return [
                'id' => $visita->id,
                'cod_Visitas' => $visita->cod_Visitas,
                'title' => $visita->Nomb_visitante ?? 'Visita sin nombre',
                'start' => $visita->Fecha_Visita . 'T' . $visita->hora_inicio,
                'end' => $visita->Fecha_Visita . 'T' . $visita->hora_fin,
                'residentName' => $this->getResidentNameForVisita($visita),
                'visitorDoc' => $visita->doc_id,
                'cod_usuario' => $visita->cod_usuario,
                'Fecha_Visita' => $visita->Fecha_Visita,
                'hora_inicio' => $visita->hora_inicio,
                'hora_fin' => $visita->hora_fin,
            ];
        })->all();
    }

    /**
     * Obtiene el nombre del residente asociado a una visita.
     * Esto es un helper para evitar queries adicionales si ya tenemos los datos.
     *
     * @param object $visita
     * @return string
     */
    protected function getResidentNameForVisita(object $visita): string
    {
        // Aquí podrías cargar la relación si el modelo lo permite
        // Por ahora, retornar el ID del residente
        return 'Residente #' . ($visita->cod_Residente ?? 'N/A');
    }

    /**
     * Obtiene los horarios disponibles para una fecha específica.
     * Retorna un array con los horarios de 1 hora disponibles entre 9 AM y 4 PM (lunes-viernes).
     * 
     * Restricciones validadas:
     * - Máximo 6 visitas por día (si ya hay 6, retorna vacío)
     * - Máximo 1 visita por tutor por semana (valida si el tutor ya tiene una)
     * - Un horario ocupado no puede ser reutilizado
     * 
     * @param string $date Formato: Y-m-d
     * @return array Array de horarios disponibles con datos de validación
     * @throws \InvalidArgumentException
     */
    public function getAvailableTimeSlots(string $date): array
    {
        // Validar que no sea fecha pasada
        try {
            $visitDate = new \DateTime($date);
            $today = new \DateTime();
            $today->setTime(0, 0, 0);
            
            if ($visitDate < $today) {
                throw new \InvalidArgumentException('No se pueden consultar disponibilidad para fechas pasadas.');
            }
        } catch (\Exception $e) {
            if (strpos($e->getMessage(), 'pasadas') !== false) {
                throw $e;
            }
            throw new \InvalidArgumentException('Formato de fecha inválido. Use Y-m-d');
        }

        // Validar que sea lunes-viernes
        $dayOfWeek = (int) $visitDate->format('N'); // 1=lunes, 7=domingo
        if ($dayOfWeek > 5) {
            return [
                'date' => $date,
                'available' => [],
                'reason' => 'Las visitas solo se pueden registrar de lunes a viernes.',
                'slots_exhausted' => false,
                'tutor_limit_reached' => false,
            ];
        }

        // Validar que el día no esté agotado (máximo 6 visitas)
        $visitsOnDay = $this->visitasRepository->countVisitsOnDateGlobal($date);
        if ($visitsOnDay >= self::MAX_VISITS_PER_DAY_GLOBAL) {
            return [
                'date' => $date,
                'available' => [],
                'reason' => 'Esta fecha ha alcanzado el límite máximo de visitas.',
                'slots_exhausted' => true,
                'tutor_limit_reached' => false,
                'visits_count' => $visitsOnDay,
            ];
        }

        // Obtener tutorías registradas esta semana (si es tutor)
        $tutorLimitReached = false;
        if ($this->accessScopeService->isTutor()) {
            $userId = $this->accessScopeService->getUserDocId();
            if ($userId > 0) {
                $visitsThisWeek = $this->visitasRepository->countVisitsByTutorInWeek($userId, $date);
                if ($visitsThisWeek >= self::MAX_VISITS_PER_TUTOR_PER_WEEK) {
                    $tutorLimitReached = true;
                }
            }
        }

        // Generar slots de 1 hora entre 9 AM y 4 PM (9-10, 10-11, ..., 15-16)
        $timeSlots = [];
        for ($hour = 9; $hour < 16; $hour++) {
            $startTime = sprintf('%02d:00', $hour);
            $endTime = sprintf('%02d:00', $hour + 1);
            
            $occupied = $this->visitasRepository->hasOverlappingVisitGlobal($date, $startTime, $endTime);
            
            $timeSlots[] = [
                'start' => $startTime,
                'end' => $endTime,
                'available' => !$occupied && !$tutorLimitReached,
                'occupied' => $occupied,
            ];
        }

        // Filtrar solo los disponibles
        $availableSlots = array_filter($timeSlots, fn ($slot) => $slot['available']);

        return [
            'date' => $date,
            'available' => array_values($availableSlots),
            'all_slots' => $timeSlots,
            'slots_exhausted' => $visitsOnDay >= self::MAX_VISITS_PER_DAY_GLOBAL,
            'tutor_limit_reached' => $tutorLimitReached,
            'visits_count' => $visitsOnDay,
        ];
    }
}
