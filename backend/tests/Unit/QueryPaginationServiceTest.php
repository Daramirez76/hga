<?php

namespace Tests\Unit;

use App\Services\QueryPaginationService;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class QueryPaginationServiceTest extends TestCase
{
    public function test_it_clamps_per_page_to_five_and_paginates_results(): void
    {
        $service = new QueryPaginationService();
        $items = Collection::make([
            ['id' => 1, 'name' => 'Uno'],
            ['id' => 2, 'name' => 'Dos'],
            ['id' => 3, 'name' => 'Tres'],
            ['id' => 4, 'name' => 'Cuatro'],
            ['id' => 5, 'name' => 'Cinco'],
            ['id' => 6, 'name' => 'Seis'],
            ['id' => 7, 'name' => 'Siete'],
        ]);

        $result = $service->paginateCollection($items, 2, 10);

        $this->assertSame(5, $result['meta']['pagination']['per_page']);
        $this->assertSame(2, $result['meta']['pagination']['current_page']);
        $this->assertSame(7, $result['meta']['pagination']['total']);
        $this->assertSame(2, count($result['data']));
        $this->assertSame(6, $result['data'][0]['id']);
        $this->assertSame(7, $result['data'][1]['id']);
    }

    public function test_it_filters_collection_before_paginating_and_is_accent_insensitive(): void
    {
        $service = new QueryPaginationService();
        $items = Collection::make([
            ['id' => 1, 'title' => 'Cita médica'],
            ['id' => 2, 'title' => 'Visita familiar'],
            ['id' => 3, 'title' => 'Informe de avance'],
        ]);

        $filtered = $service->filterCollection($items, 'medica', ['title']);
        $result = $service->paginateCollection($filtered, 1, 5, [], 'medica');

        $this->assertSame(1, $result['meta']['pagination']['total']);
        $this->assertSame('medica', $result['meta']['pagination']['search']);
        $this->assertSame('Cita médica', $result['data'][0]['title']);
    }
}
