<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\visitas;

class visitasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        visitas::factory(10)->create();
    }
}
