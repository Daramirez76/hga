<?php

namespace App\Repositories\Interfaces;

use Illuminate\Support\Collection;

interface dashboardInterface
{
    /**
     * @return array<string, Collection>
     */
    public function getDashboardCollections(): array;
}
