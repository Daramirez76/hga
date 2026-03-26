<?php

namespace App\Services;

use App\Repositories\Interfaces\dashboardInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class dashboardService
{
    private const SHORT_MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    /**
     * @var array<string, array{label: string, count_label: string, date_keys: list<string>, include_without_date_in_month: bool, include_in_trend: bool}>
     */
    private const MODULES = [
        'residentes' => [
            'label' => 'Residentes',
            'count_label' => 'residentes',
            'date_keys' => [],
            'include_without_date_in_month' => true,
            'include_in_trend' => false,
        ],
        'medicamentos' => [
            'label' => 'Medicamentos',
            'count_label' => 'registros',
            'date_keys' => ['fecha_entrada', 'fecha_novedad'],
            'include_without_date_in_month' => false,
            'include_in_trend' => true,
        ],
        'actividades' => [
            'label' => 'Actividades Ludicas',
            'count_label' => 'registros',
            'date_keys' => ['Fecha'],
            'include_without_date_in_month' => false,
            'include_in_trend' => true,
        ],
        'citas' => [
            'label' => 'Citas Medicas',
            'count_label' => 'registros',
            'date_keys' => ['Fecha_cita'],
            'include_without_date_in_month' => false,
            'include_in_trend' => true,
        ],
        'visitas' => [
            'label' => 'Visitas',
            'count_label' => 'registros',
            'date_keys' => ['Fecha_Visita'],
            'include_without_date_in_month' => false,
            'include_in_trend' => true,
        ],
        'informes' => [
            'label' => 'Informes',
            'count_label' => 'registros',
            'date_keys' => [],
            'include_without_date_in_month' => true,
            'include_in_trend' => false,
        ],
        'usuarios' => [
            'label' => 'Usuarios',
            'count_label' => 'usuarios',
            'date_keys' => [],
            'include_without_date_in_month' => true,
            'include_in_trend' => false,
        ],
    ];

    public function __construct(
        protected dashboardInterface $dashboardRepository
    ) {
    }

    /**
     * @param object|null $currentUser
     * @return array<string, mixed>
     */
    public function buildDashboard(?object $currentUser = null): array
    {
        $collections = $this->dashboardRepository->getDashboardCollections();

        return [
            'generated_at' => now()->toIso8601String(),
            'current_user' => $this->normalizeCurrentUser($currentUser),
            'modules' => $this->buildModulesConfig(),
            'metrics' => [
                'all' => $this->buildAllMetrics($collections, $currentUser),
                'by_month' => $this->buildMonthlyMetrics($collections, $currentUser),
            ],
            'charts' => [
                'last_six_months' => $this->buildLastSixMonthsSeries($collections),
            ],
        ];
    }

    /**
     * @param array<string, Collection> $collections
     * @param object|null $currentUser
     * @return array<string, int>
     */
    protected function buildAllMetrics(array $collections, ?object $currentUser): array
    {
        $metrics = [];

        foreach (self::MODULES as $key => $config) {
            if ($key === 'usuarios') {
                continue;
            }

            $metrics[$key] = ($collections[$key] ?? collect())->count();
        }

        $metrics['usuarios'] = $this->countUniqueUsers($collections, $currentUser);

        return $metrics;
    }

    /**
     * @param array<string, Collection> $collections
     * @param object|null $currentUser
     * @return array<string, array<string, int>>
     */
    protected function buildMonthlyMetrics(array $collections, ?object $currentUser): array
    {
        $monthlyMetrics = [];

        for ($month = 1; $month <= 12; $month++) {
            $monthKey = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
            $filteredCollections = [];
            $metrics = [];

            foreach (self::MODULES as $key => $config) {
                if ($key === 'usuarios') {
                    continue;
                }

                $filteredCollections[$key] = $this->filterCollectionForMonth(
                    $collections[$key] ?? collect(),
                    $config['date_keys'],
                    $month,
                    $config['include_without_date_in_month']
                );

                $metrics[$key] = $filteredCollections[$key]->count();
            }

            $metrics['usuarios'] = $this->countUniqueUsers($filteredCollections, $currentUser);
            $monthlyMetrics[$monthKey] = $metrics;
        }

        return $monthlyMetrics;
    }

    /**
     * @param array<string, Collection> $collections
     * @return list<array<string, mixed>>
     */
    protected function buildLastSixMonthsSeries(array $collections): array
    {
        $series = [];
        $currentMonth = now()->startOfMonth();

        for ($offset = 5; $offset >= 0; $offset--) {
            $monthDate = $currentMonth->copy()->subMonths($offset);
            $totals = [];

            foreach (self::MODULES as $key => $config) {
                if (!$config['include_in_trend']) {
                    continue;
                }

                $totals[$key] = $this->countCollectionForMonthAndYear(
                    $collections[$key] ?? collect(),
                    $config['date_keys'],
                    (int) $monthDate->month,
                    (int) $monthDate->year
                );
            }

            $series[] = [
                'label' => self::SHORT_MONTH_NAMES[((int) $monthDate->month) - 1] ?? $monthDate->format('M'),
                'month' => str_pad((string) $monthDate->month, 2, '0', STR_PAD_LEFT),
                'year' => (int) $monthDate->year,
                'totals' => $totals,
                'activity_total' => array_sum($totals),
            ];
        }

        return $series;
    }

    /**
     * @return list<array<string, string>>
     */
    protected function buildModulesConfig(): array
    {
        $modules = [];

        foreach (self::MODULES as $key => $config) {
            $modules[] = [
                'key' => $key,
                'label' => $config['label'],
                'count_label' => $config['count_label'],
            ];
        }

        return $modules;
    }

    /**
     * @param Collection<int, mixed> $collection
     * @param list<string> $dateKeys
     * @return Collection<int, mixed>
     */
    protected function filterCollectionForMonth(Collection $collection, array $dateKeys, int $month, bool $includeWithoutDate): Collection
    {
        if ($dateKeys === []) {
            return $includeWithoutDate ? $collection : collect();
        }

        return $collection->filter(function ($item) use ($dateKeys, $month, $includeWithoutDate) {
            $date = $this->extractDateFromItem($item, $dateKeys);

            if (!$date) {
                return $includeWithoutDate;
            }

            return (int) $date->month === $month;
        })->values();
    }

    /**
     * @param Collection<int, mixed> $collection
     * @param list<string> $dateKeys
     */
    protected function countCollectionForMonthAndYear(Collection $collection, array $dateKeys, int $month, int $year): int
    {
        if ($dateKeys === []) {
            return 0;
        }

        return $collection->filter(function ($item) use ($dateKeys, $month, $year) {
            $date = $this->extractDateFromItem($item, $dateKeys);

            return $date
                && (int) $date->month === $month
                && (int) $date->year === $year;
        })->count();
    }

    /**
     * @param array<string, Collection> $collections
     * @param object|null $currentUser
     */
    protected function countUniqueUsers(array $collections, ?object $currentUser): int
    {
        $userIds = collect();

        foreach ($collections as $collection) {
            if (!$collection instanceof Collection) {
                continue;
            }

            foreach ($collection as $item) {
                foreach (['cod_usuario', 'doc_id', 'id'] as $field) {
                    $value = $this->getItemValue($item, $field);

                    if ($value !== null && trim((string) $value) !== '') {
                        $userIds->push((string) $value);
                    }
                }
            }
        }

        if ($currentUser && isset($currentUser->id) && trim((string) $currentUser->id) !== '') {
            $userIds->push((string) $currentUser->id);
        }

        return $userIds->unique()->count();
    }

    /**
     * @param object|null $currentUser
     * @return array<string, mixed>|null
     */
    protected function normalizeCurrentUser(?object $currentUser): ?array
    {
        if (!$currentUser) {
            return null;
        }

        return [
            'id' => $currentUser->id ?? null,
            'name' => $currentUser->name ?? null,
            'apellido' => $currentUser->apellido ?? null,
            'email' => $currentUser->email ?? null,
            'cod_rol' => $currentUser->cod_rol ?? null,
        ];
    }

    /**
     * @param mixed $item
     */
    protected function getItemValue(mixed $item, string $field): mixed
    {
        if (is_array($item)) {
            return $item[$field] ?? null;
        }

        if (is_object($item)) {
            return $item->{$field} ?? null;
        }

        return null;
    }

    /**
     * @param mixed $item
     * @param list<string> $dateKeys
     */
    protected function extractDateFromItem(mixed $item, array $dateKeys): ?Carbon
    {
        foreach ($dateKeys as $field) {
            $rawValue = $this->getItemValue($item, $field);
            $parsedDate = $this->parsePossibleDate($rawValue);

            if ($parsedDate) {
                return $parsedDate;
            }
        }

        return null;
    }

    protected function parsePossibleDate(mixed $rawValue): ?Carbon
    {
        if ($rawValue instanceof Carbon) {
            return $rawValue;
        }

        if ($rawValue instanceof \DateTimeInterface) {
            return Carbon::instance($rawValue);
        }

        $normalized = trim((string) $rawValue);

        if ($normalized === '') {
            return null;
        }

        try {
            return Carbon::parse($normalized);
        } catch (\Throwable) {
            // Continue with custom date formats below.
        }

        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $normalized, $matches) === 1) {
            try {
                return Carbon::createFromFormat('d/m/Y', $matches[1] . '/' . $matches[2] . '/' . $matches[3]);
            } catch (\Throwable) {
                return null;
            }
        }

        return null;
    }
}
