<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class medicamentosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create regular medications
        \App\Models\medicamentos::factory(5)->create();

        // Create low-stock medications
        \App\Models\medicamentos::factory(3)->lowStock()->create();

        // Create recently added medications
        \App\Models\medicamentos::factory(2)->recent()->create();
    }
}
