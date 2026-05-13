<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\citas;

class citasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        citas::factory(10)->create();
    }
}
