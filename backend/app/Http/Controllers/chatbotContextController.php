<?php

namespace App\Http\Controllers;

use App\Models\actividades;
use App\Models\visitas;
use App\Services\AccessScopeService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class chatbotContextController extends Controller
{
    public function __construct(
        protected AccessScopeService $accessScopeService
    ) {
    }

    public function show(): JsonResponse
    {
        $authUser = auth('api')->user();
        $roleCode = $this->accessScopeService->getRoleCode($authUser);

        return response()->json([
            'success' => true,
            'message' => 'chatbot context retrieved successfully',
            'data' => [
                'project' => [
                    'name' => 'Hogar Geriatrico HGA',
                    'assistant_scope' => 'Orientacion general sobre el portal web y sobre el hogar geriatrico',
                    'portal_type' => 'Portal web administrativo y de consulta para hogar geriatrico',
                ],
                'modules' => [
                    'auth' => ['login', 'register', 'google_auth', 'password_recovery'],
                    'care' => ['residentes', 'medicamentos', 'citas', 'visitas', 'actividades', 'informes'],
                    'support' => ['dashboard', 'notificaciones', 'perfil_de_usuario'],
                ],
                'usage_guidelines' => [
                    'No revelar datos personales ni sensibles de residentes o usuarios.',
                    'Orientar sobre modulos existentes del portal antes de inventar funcionalidades.',
                    'Sugerir al personal del hogar cuando la consulta requiera validacion humana.',
                ],
                'view_routes' => $this->resolveViewRoutes($roleCode),
                'knowledge' => $this->buildKnowledgeBase($roleCode),
            ],
        ]);
    }

    public function viewer(): JsonResponse
    {
        $authUser = auth('api')->user();
        $roleCode = (int) ($authUser->cod_rol ?? 0);

        return response()->json([
            'success' => true,
            'message' => 'chatbot viewer context retrieved successfully',
            'data' => [
                'viewer' => [
                    'authenticated' => true,
                    'role_code' => $roleCode,
                    'role_name' => $this->resolveRoleName($roleCode),
                    'name' => (string) ($authUser->name ?? $authUser->nombre ?? ''),
                    'accessible_modules' => $this->resolveAccessibleModules($roleCode),
                ],
            ],
        ]);
    }

    /**
     * @return list<string>
     */
    protected function resolveAccessibleModules(int $roleCode): array
    {
        if ($roleCode === 1) {
            return ['dashboard', 'residentes', 'medicamentos', 'citas', 'visitas', 'actividades', 'informes', 'notificaciones', 'perfil_de_usuario'];
        }

        if ($roleCode === 2) {
            return ['residentes', 'medicamentos', 'citas', 'visitas', 'actividades', 'informes', 'notificaciones', 'perfil_de_usuario'];
        }

        if ($roleCode === 4) {
            return ['home', 'residentes', 'citas', 'visitas', 'actividades', 'notificaciones', 'perfil_de_usuario'];
        }

        return ['auth', 'informacion_general'];
    }

    protected function resolveRoleName(int $roleCode): ?string
    {
        return match ($roleCode) {
            1 => 'Administrador',
            2 => 'Enfermero',
            3 => 'Doctor',
            4 => 'Tutor',
            default => null,
        };
    }

    /**
     * @return array<string, array<string, string>>
     */
    protected function resolveViewRoutes(int $roleCode): array
    {
        $isTutor = $roleCode === 4;

        return [
            'inicio' => [
                'href' => $isTutor ? 'home.html' : 'home_employees.html',
                'label' => $isTutor ? 'Inicio del tutor' : 'Inicio del personal',
            ],
            'agenda' => [
                'href' => $isTutor ? 'home.html' : 'home_employees.html',
                'label' => $isTutor ? 'Agenda del residente' : 'Agenda del hogar',
            ],
            'residentes' => [
                'href' => 'resident.html',
                'label' => 'Residentes',
            ],
            'actividades' => [
                'href' => 'recreational_activities.html',
                'label' => 'Actividades ludicas',
            ],
            'visitas' => [
                'href' => $isTutor ? 'home.html' : 'Visitas.html',
                'label' => $isTutor ? 'Agenda del residente' : 'Visitas',
            ],
            'citas' => [
                'href' => $isTutor ? 'home.html' : 'citas_medicas.html',
                'label' => $isTutor ? 'Agenda del residente' : 'Citas medicas',
            ],
            'informes' => [
                'href' => 'Informes.html',
                'label' => 'Informes',
            ],
            'medicamentos' => [
                'href' => 'medicaments.html',
                'label' => 'Medicamentos',
            ],
            'notificaciones' => [
                'href' => 'notificaciones.html',
                'label' => 'Notificaciones',
            ],
            'perfil' => [
                'href' => 'user.html',
                'label' => 'Perfil de usuario',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildKnowledgeBase(int $roleCode): array
    {
        $viewRoutes = $this->resolveViewRoutes($roleCode);
        $activities = $this->summarizeActivities();
        $visits = $this->summarizeVisits();

        return [
            'activities' => [
                'summary' => $activities['summary'],
                'items' => $activities['items'],
                'view' => $viewRoutes['actividades'],
            ],
            'visits' => [
                'summary' => $visits['summary'],
                'items' => $visits['items'],
                'schedule_note' => 'Las visitas del sistema muestran la fecha programada. Si necesitas validar una hora exacta o coordinacion adicional, revisa la vista sugerida o consulta con el personal del hogar.',
                'view' => $viewRoutes['visitas'],
            ],
        ];
    }

    /**
     * @return array{summary: string, items: list<array<string, string|int>>}
     */
    protected function summarizeActivities(): array
    {
        $activities = $this->accessScopeService->filterResidents(
            actividades::query()->get()
        );

        $items = $this->pickRelevantItems($activities, 'Fecha')
            ->map(function (object $activity): array {
                return [
                    'id' => (int) ($activity->Cod_acti_ludi ?? 0),
                    'title' => trim((string) ($activity->Nombre ?? 'Actividad ludica')),
                    'date' => $this->formatDate((string) ($activity->Fecha ?? '')),
                    'start_time' => $this->formatTime((string) ($activity->Hora_ini ?? '')),
                    'end_time' => $this->formatTime((string) ($activity->Hora_fin ?? '')),
                    'place' => trim((string) ($activity->Lugar ?? '')),
                ];
            })
            ->values()
            ->all();

        if ($items === []) {
            return [
                'summary' => 'No hay actividades ludicas visibles en este momento para tu perfil.',
                'items' => [],
            ];
        }

        return [
            'summary' => sprintf(
                'Hay %d actividades ludicas visibles. La proxima destacada es %s el %s de %s a %s.',
                $activities->count(),
                $items[0]['title'],
                $items[0]['date'],
                $items[0]['start_time'] ?: 'hora por confirmar',
                $items[0]['end_time'] ?: 'hora por confirmar'
            ),
            'items' => $items,
        ];
    }

    /**
     * @return array{summary: string, items: list<array<string, string|int>>}
     */
    protected function summarizeVisits(): array
    {
        $visits = $this->accessScopeService->filterByResidentFields(
            visitas::query()->get(),
            ['cod_Residente']
        );

        $items = $this->pickRelevantItems($visits, 'Fecha_Visita')
            ->map(function (object $visit): array {
                return [
                    'id' => (int) (($visit->id ?? 0) ?: ($visit->cod_Visitas ?? 0)),
                    'visitor' => trim((string) ($visit->Nomb_visitante ?? 'Visitante registrado')),
                    'date' => $this->formatDate((string) ($visit->Fecha_Visita ?? '')),
                    'resident_code' => (int) ($visit->cod_Residente ?? 0),
                ];
            })
            ->values()
            ->all();

        if ($items === []) {
            return [
                'summary' => 'No hay visitas visibles en este momento para tu perfil.',
                'items' => [],
            ];
        }

        return [
            'summary' => sprintf(
                'Hay %d visitas visibles. La proxima visita destacada es la de %s para el %s.',
                $visits->count(),
                $items[0]['visitor'],
                $items[0]['date']
            ),
            'items' => $items,
        ];
    }

    /**
     * @param Collection<int, object> $items
     * @return Collection<int, object>
     */
    protected function pickRelevantItems(Collection $items, string $dateField): Collection
    {
        $today = now()->startOfDay();

        $sorted = $items
            ->filter(fn ($item): bool => !empty($item->{$dateField}))
            ->sortBy(function ($item) use ($dateField): string {
                return (string) ($item->{$dateField} ?? '');
            })
            ->values();

        $upcoming = $sorted
            ->filter(function ($item) use ($dateField, $today): bool {
                $parsedDate = $this->parseDate((string) ($item->{$dateField} ?? ''));
                if (!$parsedDate) {
                    return false;
                }

                return $parsedDate->startOfDay()->greaterThanOrEqualTo($today);
            })
            ->values();

        if ($upcoming->isNotEmpty()) {
            return $upcoming->take(3)->values();
        }

        return $sorted->reverse()->take(3)->values();
    }

    protected function formatDate(string $value): string
    {
        $parsedDate = $this->parseDate($value);
        if (!$parsedDate) {
            return 'fecha por confirmar';
        }

        return $parsedDate->format('Y-m-d');
    }

    protected function formatTime(string $value): string
    {
        $normalized = trim($value);
        if ($normalized === '') {
            return '';
        }

        return substr($normalized, 0, 5);
    }

    protected function parseDate(string $value): ?CarbonImmutable
    {
        $normalized = trim($value);
        if ($normalized === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($normalized);
        } catch (\Throwable) {
            return null;
        }
    }
}
