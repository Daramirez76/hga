<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class usuariosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin users
        \App\Models\usuarios::factory(2)->admin()->create();

        // Create staff users
        \App\Models\usuarios::factory(5)->staff()->create();

        // Create family members
        \App\Models\usuarios::factory(8)->family()->create();
    }
}
